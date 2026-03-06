'use server'

import { getUserContext } from '@/app/lib/auth'
import { createAdminClient } from '@/app/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Create a new organization. Superadmin only.
 *
 * WHY: Organizations are provisioned by superadmins, not self-created.
 * This action validates superadmin status, creates the org, and
 * revalidates the organizations page so the list updates.
 */
export async function createOrganization(params: {
  name: string
  slug: string
}): Promise<{
  success?: boolean
  organization?: { id: string; name: string; slug: string }
  error?: string
}> {
  const ctx = await getUserContext()
  if (!ctx?.isSuperadmin) {
    return { error: 'Unauthorized: superadmin access required' }
  }

  // Validate slug format (lowercase, alphanumeric, hyphens)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(params.slug)) {
    return {
      error:
        'Slug must be lowercase letters, numbers, and hyphens only (e.g., "acme-corp")',
    }
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('organizations')
    .insert({
      name: params.name.trim(),
      slug: params.slug.trim().toLowerCase(),
    })
    .select('id, name, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'An organization with this slug already exists' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/organizations')
  return { success: true, organization: data }
}

/**
 * Send an invitation. Can be called by superadmins (any org) or
 * org admins (their own org only).
 *
 * WHY: Invitations are the only way new users enter the system.
 * This action creates the invitation row and returns the invite URL.
 * For MVP, the caller (admin UI) shows the URL for manual sharing.
 * For production, this would trigger an email via Supabase Edge Functions.
 */
export async function sendInvitation(params: {
  organizationId: string
  email: string
  role: 'ADMIN' | 'PRESENTER' | 'VIEWER'
}): Promise<{
  success?: boolean
  inviteUrl?: string
  error?: string
}> {
  const ctx = await getUserContext()
  if (!ctx) return { error: 'Unauthorized' }

  // Authorization: superadmin can invite to any org,
  // org admin can invite to their own org only
  const isSuperadmin = ctx.isSuperadmin
  const isOrgAdmin = ctx.memberships.some(
    (m) => m.organizationId === params.organizationId && m.role === 'ADMIN'
  )

  if (!isSuperadmin && !isOrgAdmin) {
    return { error: 'Unauthorized: you do not have permission for this organization' }
  }

  const admin = createAdminClient()

  // Check for existing pending invitation to same email + org
  const { data: existing } = await admin
    .from('invitations')
    .select('id')
    .eq('organization_id', params.organizationId)
    .eq('email', params.email.toLowerCase().trim())
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return { error: 'A pending invitation already exists for this email address' }
  }

  // Check if the user is already a member of this org.
  // We check our staff table by email (which we control) rather than
  // calling listUsers() which doesn't support email filtering in the JS client.
  const { data: existingStaff } = await admin
    .from('staff')
    .select('user_id')
    .eq('organization_id', params.organizationId)
    .eq('email', params.email.toLowerCase().trim())
    .maybeSingle()

  if (existingStaff?.user_id) {
    // The staff record has a linked user_id, check if they're an org member
    const { data: existingMember } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', params.organizationId)
      .eq('user_id', existingStaff.user_id)
      .maybeSingle()

    if (existingMember) {
      return { error: 'This user is already a member of this organization' }
    }
  }

  // Create the invitation
  const { data: invitation, error } = await admin
    .from('invitations')
    .insert({
      organization_id: params.organizationId,
      email: params.email.toLowerCase().trim(),
      role: params.role,
      invited_by: ctx.userId,
    })
    .select('id, token')
    .single()

  if (error) {
    return { error: error.message }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite?token=${invitation.token}`

  // TODO: Send email via Supabase Edge Functions + Resend/SendGrid.
  // For MVP, the invite URL is returned to the admin UI for manual sharing.

  revalidatePath('/admin/invitations')
  return { success: true, inviteUrl }
}
