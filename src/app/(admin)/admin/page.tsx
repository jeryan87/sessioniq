import { createAdminClient } from '@/app/lib/supabase/admin'

/**
 * Superadmin dashboard.
 *
 * WHY: Quick overview of platform state — how many orgs, users,
 * pending invitations. The admin layout already verified superadmin
 * access, so we can fetch data directly.
 */
export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  const { count: orgCount } = await admin
    .from('organizations')
    .select('*', { count: 'exact', head: true })

  const { count: memberCount } = await admin
    .from('organization_members')
    .select('*', { count: 'exact', head: true })

  const { count: pendingInviteCount } = await admin
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
        Admin Dashboard
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-sm text-[var(--color-muted)]">Organizations</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
            {orgCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-sm text-[var(--color-muted)]">Total Members</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
            {memberCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-sm text-[var(--color-muted)]">
            Pending Invitations
          </p>
          <p className="mt-1 text-3xl font-semibold text-[var(--color-accent)]">
            {pendingInviteCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  )
}
