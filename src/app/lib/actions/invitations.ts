'use server'

import { createAdminClient } from '@/app/lib/supabase/admin'
import { createClient } from '@/app/lib/supabase/server'

/**
 * Accept an invitation and create a new account.
 *
 * WHY: This is the primary invitation flow. A new user clicks the invite
 * link, fills in their name and password, and this action:
 *   1. Re-validates the token (defense in depth)
 *   2. Creates the auth account via admin API (bypasses normal signup)
 *   3. Inserts into organization_members (bypasses RLS via admin client)
 *   4. Inserts/updates the staff record
 *   5. Marks the invitation as accepted
 *
 * We use admin.auth.admin.createUser with email_confirm: true because
 * the invitation token itself proves email ownership — the token was
 * sent to that email address. No need for double-confirmation.
 *
 * All mutations use upsert with conflict clauses so the operation is
 * idempotent — if the user refreshes or retries, nothing breaks.
 */
export async function acceptInvitation(params: {
  token: string
  password: string
  name: string
}): Promise<{ success?: boolean; userId?: string; error?: string }> {
  const admin = createAdminClient()

  // 1. Validate token (using admin client to bypass RLS)
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('token', params.token)
    .eq('status', 'pending')
    .maybeSingle()

  if (!invitation) {
    return { error: 'Invalid or expired invitation' }
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired while we are here
    await admin
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    return { error: 'This invitation has expired' }
  }

  // 2. Validate password server-side (client has minLength=6 but we enforce here too)
  if (!params.password || params.password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  // 3. Try to create the auth account. If the email is already registered,
  // createUser will fail — we catch that and look up the existing user instead.
  // This avoids calling listUsers() which requires pagination and doesn't
  // support email filtering in the JS client.
  let userId: string

  const { data: newUser, error: signupError } =
    await admin.auth.admin.createUser({
      email: invitation.email,
      password: params.password,
      email_confirm: true, // Skip email verification — token is proof
      user_metadata: { name: params.name },
    })

  if (signupError) {
    // If the user already exists, find their ID via the admin listUsers API.
    // The error message from GoTrue for duplicate emails contains "already registered".
    if (signupError.message?.toLowerCase().includes('already') ||
        signupError.message?.toLowerCase().includes('registered') ||
        signupError.message?.toLowerCase().includes('exists')) {
      // Look up the existing user. We paginate through page 1 which is fine
      // for a targeted lookup — we just need to confirm they exist.
      const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 })
      const existingUser = userList?.users?.find(
        u => u.email?.toLowerCase() === invitation.email.toLowerCase()
      )
      if (!existingUser) {
        return { error: 'User exists but could not be found. Contact support.' }
      }
      userId = existingUser.id
    } else {
      return { error: signupError.message ?? 'Failed to create account' }
    }
  } else if (!newUser.user) {
    return { error: 'Failed to create account' }
  } else {
    userId = newUser.user.id
  }

  // 5. Insert into organization_members (idempotent via upsert)
  const { error: memberError } = await admin
    .from('organization_members')
    .upsert(
      {
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
      },
      { onConflict: 'organization_id,user_id' }
    )

  if (memberError) {
    return { error: 'Failed to add you to the organization' }
  }

  // 6. Insert/update staff record (idempotent via upsert)
  const { error: staffError } = await admin.from('staff').upsert(
    {
      organization_id: invitation.organization_id,
      user_id: userId,
      name: params.name,
      email: invitation.email,
      role: invitation.role,
    },
    { onConflict: 'organization_id,email' }
  )

  // Staff insert failure is non-fatal — the user is still an org member
  if (staffError) {
    console.error('Staff record insert failed (non-fatal):', staffError)
  }

  // 7. Mark invitation as accepted
  await admin
    .from('invitations')
    .update({
      status: 'accepted' as const,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  return { success: true, userId }
}

/**
 * Accept an invitation as an already-logged-in user.
 *
 * WHY: This handles the case where a user who already has an account
 * and is logged in gets invited to a new org. They click the invite
 * link, the page detects they are authenticated, and shows a
 * "Join [Org Name]" button instead of a signup form.
 *
 * Security: We verify the invitation email matches the logged-in user's
 * email. This prevents a user from hijacking an invitation meant for
 * someone else.
 */
export async function acceptInvitationAsExistingUser(
  token: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const admin = createAdminClient()

  // Validate token
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()

  if (!invitation) {
    return { error: 'Invalid or expired invitation' }
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await admin
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    return { error: 'This invitation has expired' }
  }

  // Verify email matches
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return {
      error:
        'This invitation was sent to a different email address. ' +
        'Please sign out and use the correct account.',
    }
  }

  // Insert into organization_members
  const { error: memberError } = await admin
    .from('organization_members')
    .upsert(
      {
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      },
      { onConflict: 'organization_id,user_id' }
    )

  if (memberError) {
    return { error: 'Failed to add you to the organization' }
  }

  // Update staff record
  await admin.from('staff').upsert(
    {
      organization_id: invitation.organization_id,
      user_id: user.id,
      name: user.user_metadata?.name ?? user.email ?? '',
      email: invitation.email,
      role: invitation.role,
    },
    { onConflict: 'organization_id,email' }
  )

  // Mark invitation as accepted
  await admin
    .from('invitations')
    .update({
      status: 'accepted' as const,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  return { success: true }
}
