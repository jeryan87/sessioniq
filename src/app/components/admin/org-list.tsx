/**
 * Displays a list of organizations for superadmins.
 *
 * WHY: Superadmins need visibility into all organizations on the platform.
 * This is a simple read-only table. Future iterations will add actions
 * like editing org details or viewing member counts.
 */
export function OrgList({
  organizations,
}: {
  organizations: Array<{
    id: string
    name: string
    slug: string
    created_at: string
  }>
}) {
  if (organizations.length === 0) {
    return (
      <p className="text-[var(--color-muted)]">
        No organizations yet. Create one above.
      </p>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-[var(--foreground)]">
        All Organizations
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="pb-3 pr-4 font-medium text-[var(--color-muted)]">
                Name
              </th>
              <th className="pb-3 pr-4 font-medium text-[var(--color-muted)]">
                Slug
              </th>
              <th className="pb-3 font-medium text-[var(--color-muted)]">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr
                key={org.id}
                className="border-b border-[var(--color-border)]"
              >
                <td className="py-3 pr-4 font-medium text-[var(--foreground)]">
                  {org.name}
                </td>
                <td className="py-3 pr-4 text-[var(--color-muted)]">
                  {org.slug}
                </td>
                <td className="py-3 text-[var(--color-muted)]">
                  {new Date(org.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
