'use client'

import { createClient } from '@/app/lib/supabase/client'

/**
 * Logout button - signs the user out and redirects to login.
 *
 * WHY: signOut() clears the session and cookies. We use window.location
 * to force a full page reload so the proxy runs again and redirects
 * unauthenticated users to /login.
 */
export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--color-border)]"
    >
      Sign out
    </button>
  )
}
