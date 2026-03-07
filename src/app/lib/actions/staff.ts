'use server'

import { getUserContext } from '@/app/lib/auth'
import { createClient } from '@/app/lib/supabase/server'
import { createAdminClient } from '@/app/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Staff management server actions.
 *
 * WHY: Staff CRUD is the core of the staff management feature. These actions
 * handle updating staff profiles, changing roles (with sync to organization_members),
 * removing staff, and self-service profile editing.
 *
 * Authorization model:
 * - updateStaffMember / removeStaffMember: org ADMIN or superadmin only
 * - updateMyProfile: any authenticated user (RLS enforces own-record-only)
 */

// ============================================================
// ADMIN: Update a staff member's profile
// ============================================================

export async function updateStaffMember(params: {
  staffId: string
  name: string
  role: 'ADMIN' | 'PRESENTER' | 'VIEWER'
  jobTitle: string
  phone: string
  officeLocation: string
}): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getUserContext()
  if (!ctx) return { error: 'Unauthorized' }

  const isAdmin = ctx.activeRole === 'ADMIN'
  if (!isAdmin && !ctx.isSuperadmin) {
    return { error: 'Unauthorized: admin access required' }
  }

  const admin = createAdminClient()

  // Fetch the staff record to get org_id and user_id for role sync
  const { data: staff, error: fetchError } = await admin
    .from('staff')
    .select('id, organization_id, user_id, role')
    .eq('id', params.staffId)
    .single()

  if (fetchError || !staff) {
    return { error: 'Staff member not found' }
  }

  // Verify the admin has permission for this org
  if (!ctx.isSuperadmin) {
    const hasAccess = ctx.memberships.some(
      (m) => m.organizationId === staff.organization_id && m.role === 'ADMIN'
    )
    if (!hasAccess) {
      return { error: 'Unauthorized: you are not an admin of this organization' }
    }
  }

  // Update the staff record
  const { error: updateError } = await admin
    .from('staff')
    .update({
      name: params.name.trim(),
      role: params.role,
      job_title: params.jobTitle.trim() || null,
      phone: params.phone.trim() || null,
      office_location: params.officeLocation.trim() || null,
    })
    .eq('id', params.staffId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Sync role to organization_members if user_id is set and role changed
  if (staff.user_id && staff.role !== params.role) {
    const { error: syncError } = await admin
      .from('organization_members')
      .update({ role: params.role })
      .eq('organization_id', staff.organization_id)
      .eq('user_id', staff.user_id)

    if (syncError) {
      console.error('Role sync to organization_members failed:', syncError)
      // Non-fatal: the staff record is already updated
    }
  }

  revalidatePath('/staff')
  return { success: true }
}

// ============================================================
// ADMIN: Remove a staff member from the organization
// ============================================================

export async function removeStaffMember(
  staffId: string
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getUserContext()
  if (!ctx) return { error: 'Unauthorized' }

  const isAdmin = ctx.activeRole === 'ADMIN'
  if (!isAdmin && !ctx.isSuperadmin) {
    return { error: 'Unauthorized: admin access required' }
  }

  const admin = createAdminClient()

  // Fetch the staff record to get org_id and user_id
  const { data: staff, error: fetchError } = await admin
    .from('staff')
    .select('id, organization_id, user_id')
    .eq('id', staffId)
    .single()

  if (fetchError || !staff) {
    return { error: 'Staff member not found' }
  }

  // Verify the admin has permission for this org
  if (!ctx.isSuperadmin) {
    const hasAccess = ctx.memberships.some(
      (m) => m.organizationId === staff.organization_id && m.role === 'ADMIN'
    )
    if (!hasAccess) {
      return { error: 'Unauthorized: you are not an admin of this organization' }
    }
  }

  // Prevent admins from removing themselves
  if (staff.user_id === ctx.userId) {
    return { error: 'You cannot remove yourself from the organization' }
  }

  // Delete organization_members row (if user_id is set)
  if (staff.user_id) {
    await admin
      .from('organization_members')
      .delete()
      .eq('organization_id', staff.organization_id)
      .eq('user_id', staff.user_id)
  }

  // Delete the staff record
  const { error: deleteError } = await admin
    .from('staff')
    .delete()
    .eq('id', staffId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/staff')
  return { success: true }
}

// ============================================================
// SELF-SERVICE: Update own profile
// ============================================================

/**
 * Update the current user's own staff profile.
 *
 * WHY: Uses the regular Supabase client (not admin) so RLS enforces that
 * users can only update their own record. The existing policy
 * "Users can update own staff record" allows UPDATE WHERE user_id = auth.uid().
 *
 * Admins editing OTHER people's profiles should use updateStaffMember instead.
 */
export async function updateMyProfile(params: {
  name: string
  jobTitle: string
  phone: string
  officeLocation: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Update using RLS — only the user's own staff records will be affected
  const { error } = await supabase
    .from('staff')
    .update({
      name: params.name.trim(),
      job_title: params.jobTitle.trim() || null,
      phone: params.phone.trim() || null,
      office_location: params.officeLocation.trim() || null,
    })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/staff')
  revalidatePath('/profile')
  return { success: true }
}
