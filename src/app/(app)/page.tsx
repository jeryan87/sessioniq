import { getUserContext } from '@/app/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Home / dashboard page.
 *
 * WHY: This is the main landing page after login. It shows a welcome
 * message with the user's org context. Future iterations will add
 * dashboard widgets (upcoming sessions, stats, etc.)
 */
export default async function HomePage() {
  const ctx = await getUserContext()
  if (!ctx) redirect('/login')

  const orgName =
    ctx.memberships.length > 0
      ? ctx.memberships[0].organizationName
      : 'SessionIQ'

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
        Welcome to {orgName}
      </h2>
      <p className="mt-2 text-[var(--color-muted)]">
        Signed in as {ctx.email}
        {ctx.activeRole && (
          <span>
            {' '}
            &middot; Role: <strong>{ctx.activeRole}</strong>
          </span>
        )}
        {ctx.isSuperadmin && (
          <span>
            {' '}
            &middot;{' '}
            <span className="text-[var(--color-accent)] font-medium">
              Superadmin
            </span>
          </span>
        )}
      </p>

      <div className="mt-8 text-[var(--color-muted)]">
        <p>
          The enterprise auth foundation is set. Next up: Staff Management,
          Session Types, and the rest of the roadmap.
        </p>
      </div>
    </div>
  )
}
