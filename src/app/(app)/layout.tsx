import { getUserContext } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/app/components/logout-button'
import { SidebarNav } from '@/app/components/sidebar-nav'

/**
 * Layout for the authenticated app section.
 *
 * WHY: Matches the v1 SessionIQ design — dark sidebar on the left, slim
 * header bar on top with user info. All pages under (app)/ share this shell.
 *
 * Auth guards: redirects unauthenticated users to /login and users without
 * org membership to /no-org.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()

  if (!ctx) redirect('/login')
  if (ctx.memberships.length === 0 && !ctx.isSuperadmin) redirect('/no-org')

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <SidebarNav isSuperadmin={ctx.isSuperadmin} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-muted)]">
              {ctx.email}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
