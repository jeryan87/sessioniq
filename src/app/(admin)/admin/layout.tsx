import { getUserContext } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/app/components/logout-button'

/**
 * Layout for superadmin pages.
 *
 * WHY: All /admin pages require superadmin access. The proxy checks this
 * too, but the layout provides a second line of defense and renders the
 * admin-specific chrome. The admin layout is intentionally different from
 * the app layout — no sidebar, different header with an orange "Admin"
 * badge, and a horizontal nav for admin sections.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()
  if (!ctx) redirect('/login')
  if (!ctx.isSuperadmin) redirect('/')

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-semibold text-[var(--foreground)]">
              SessionIQ
            </Link>
            <span className="rounded-md bg-[var(--color-accent)] px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-muted)]">
              {ctx.email}
            </span>
            <LogoutButton />
          </div>
        </div>
        <nav className="flex gap-6 px-6 pb-3">
          <Link
            href="/admin"
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--foreground)]"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/organizations"
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--foreground)]"
          >
            Organizations
          </Link>
          <Link
            href="/admin/invitations"
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--foreground)]"
          >
            Invitations
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
