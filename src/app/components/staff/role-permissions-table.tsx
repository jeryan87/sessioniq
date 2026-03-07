'use client'

/**
 * Display-only role permissions matrix.
 *
 * WHY: From the v1 design — shows what each role can do at a glance.
 * Permissions are not yet editable (hardcoded to the intended role model).
 * This table appears at the bottom of the staff page for reference.
 */

const PERMISSIONS: { label: string; admin: boolean; presenter: boolean; viewer: boolean }[] = [
  { label: 'View all sessions', admin: true, presenter: true, viewer: true },
  { label: 'Create sessions', admin: true, presenter: true, viewer: false },
  { label: 'Edit any session', admin: true, presenter: false, viewer: false },
  { label: 'Manage session templates', admin: true, presenter: false, viewer: false },
  { label: 'Manage feedback forms', admin: true, presenter: false, viewer: false },
  { label: 'View analytics (all)', admin: true, presenter: false, viewer: false },
  { label: 'View own analytics', admin: true, presenter: true, viewer: true },
  { label: 'Manage staff', admin: true, presenter: false, viewer: false },
  { label: 'Configure settings', admin: true, presenter: false, viewer: false },
]

export function RolePermissionsTable() {
  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--foreground)]">
        Role Permissions
      </h3>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Permission enforcement is not yet active. This table reflects the intended role model.
      </p>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                Permission
              </th>
              <th className="px-4 py-3 text-center font-medium text-[var(--color-primary)]">
                Admin
              </th>
              <th className="px-4 py-3 text-center font-medium text-[var(--foreground)]">
                Presenter
              </th>
              <th className="px-4 py-3 text-center font-medium text-[var(--foreground)]">
                Viewer
              </th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr
                key={p.label}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <td className="px-4 py-3 text-[var(--foreground)]">{p.label}</td>
                <td className="px-4 py-3 text-center text-green-600">
                  {p.admin ? '\u2713' : '\u2013'}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.presenter ? '\u2713' : '\u2013'}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.viewer ? '\u2713' : '\u2013'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
