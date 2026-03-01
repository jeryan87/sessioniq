import { createClient } from '@/app/lib/supabase/server'
import { LogoutButton } from '@/app/components/logout-button'

/**
 * Home page - only visible to authenticated users.
 *
 * WHY: The Proxy redirects unauthenticated users to /login before they
 * reach this page. So by the time we render, we know the user is logged in.
 * We fetch the user from the server to display their email—using getClaims()
 * or getSession() after the proxy has refreshed the token.
 */
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          SessionIQ
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--color-muted)]">
            {user?.email}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">
            Welcome to SessionIQ
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            You&apos;re signed in. The foundation is set—next up is Staff Management,
            Session Types, and the rest of the roadmap.
          </p>
        </div>
      </main>
    </div>
  )
}
