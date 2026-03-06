import { createClient } from '@/app/lib/supabase/server'

export type UserRole = 'ADMIN' | 'PRESENTER' | 'VIEWER'

export interface UserContext {
  userId: string
  email: string
  isSuperadmin: boolean
  memberships: Array<{
    organizationId: string
    role: UserRole
    organizationName: string
  }>
  /**
   * The "active" org. For users in exactly one org, this is automatic.
   * For multi-org users, a future org-switcher dropdown will set this.
   */
  activeOrganizationId: string | null
  activeRole: UserRole | null
}

/**
 * Fetches the full auth context for the current user.
 *
 * WHY: Multiple pages and layouts need to know the user's org memberships,
 * role, and superadmin status. Instead of scattering these queries across
 * every page, we centralize them here. This function is called in layouts
 * and server components to gate access and render role-appropriate UI.
 *
 * Returns null if the user is not authenticated.
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check superadmin status using the SECURITY DEFINER function
  // (direct table query would fail due to circular RLS dependency)
  const { data: isSuperadminResult } = await supabase.rpc('is_superadmin')

  // Fetch org memberships with org names
  const { data: memberships } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      role,
      organizations ( name )
    `)
    .eq('user_id', user.id)

  const mapped = (memberships ?? []).map((m: Record<string, unknown>) => ({
    organizationId: m.organization_id as string,
    role: m.role as UserRole,
    organizationName: (m.organizations as Record<string, unknown>)?.name as string ?? 'Unknown',
  }))

  // Auto-select org if user belongs to exactly one
  const activeOrganizationId = mapped.length === 1
    ? mapped[0].organizationId
    : null
  const activeRole = mapped.length === 1
    ? mapped[0].role
    : null

  return {
    userId: user.id,
    email: user.email ?? '',
    isSuperadmin: !!isSuperadminResult,
    memberships: mapped,
    activeOrganizationId,
    activeRole,
  }
}
