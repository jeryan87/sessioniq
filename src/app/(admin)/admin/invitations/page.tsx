import { createAdminClient } from '@/app/lib/supabase/admin'
import { InviteForm } from '@/app/components/admin/invite-form'

/**
 * Invitation management page for superadmins.
 *
 * WHY: Superadmins need to send invitations and see the status of all
 * invitations across all organizations.
 */
export default async function InvitationsPage() {
  const admin = createAdminClient()

  // Fetch all organizations for the invite form dropdown
  const { data: organizations } = await admin
    .from('organizations')
    .select('id, name')
    .order('name')

  // Fetch recent invitations with org names
  const { data: invitations } = await admin
    .from('invitations')
    .select(`
      id,
      email,
      role,
      status,
      token,
      created_at,
      expires_at,
      accepted_at,
      organizations ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
        Invitations
      </h2>

      <div className="mt-6">
        <InviteForm organizations={organizations ?? []} />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-[var(--foreground)]">
          Recent Invitations
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="pb-3 pr-4 font-medium text-[var(--color-muted)]">Email</th>
                <th className="pb-3 pr-4 font-medium text-[var(--color-muted)]">Organization</th>
                <th className="pb-3 pr-4 font-medium text-[var(--color-muted)]">Role</th>
                <th className="pb-3 pr-4 font-medium text-[var(--color-muted)]">Status</th>
                <th className="pb-3 font-medium text-[var(--color-muted)]">Created</th>
              </tr>
            </thead>
            <tbody>
              {(invitations ?? []).map((inv: Record<string, unknown>) => (
                <tr
                  key={inv.id as string}
                  className="border-b border-[var(--color-border)]"
                >
                  <td className="py-3 pr-4 text-[var(--foreground)]">
                    {inv.email as string}
                  </td>
                  <td className="py-3 pr-4 text-[var(--foreground)]">
                    {(inv.organizations as Record<string, unknown>)?.name as string}
                  </td>
                  <td className="py-3 pr-4 text-[var(--foreground)]">
                    {inv.role as string}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : inv.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {inv.status as string}
                    </span>
                  </td>
                  <td className="py-3 text-[var(--color-muted)]">
                    {new Date(inv.created_at as string).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
