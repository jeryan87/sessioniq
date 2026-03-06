import { getUserContext } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/app/components/logout-button'

/**
 * Layout for the authenticated app section.
 *
 * WHY: All pages under (app)/ need a header with user context and navigation.
 * This layout fetches the user context once and renders the app chrome.
 * If the user is not authenticated or has no org, the proxy should have
 * already redirected them, but we double-check here as a second line
 * of defense.
 *
 * Future: This will include the full sidebar nav (Home, Calendar, Staff, etc.)
 * For now it's a simple header + content area.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()

  if (!ctx) redirect('/login')
  // Check memberships.length instead of activeOrganizationId, because
  // multi-org users have activeOrganizationId === null until they pick an org.
  // We only redirect to /no-org if they truly have zero memberships.
  if (ctx.memberships.length === 0 && !ctx.isSuperadmin) redirect('/no-org')

  const orgName =
    ctx.memberships.length > 0
      ? ctx.memberships[0].organizationName
      : 'SessionIQ'

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            SessionIQ
          </h1>
          <span className="text-sm text-[var(--color-muted)]">
            {orgName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {ctx.isSuperadmin && (
            <Link
              href="/admin"
              className="rounded-md bg-[var(--color-accent)] px-2 py-0.5 text-xs font-medium text-white hover:opacity-90"
            >
              Admin
            </Link>
          )}
          <span className="text-sm text-[var(--color-muted)]">
            {ctx.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  )
}
