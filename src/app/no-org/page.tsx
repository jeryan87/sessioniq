import { LogoutButton } from '@/app/components/logout-button'
import { createClient } from '@/app/lib/supabase/server'

/**
 * No-org waiting page.
 *
 * WHY: When a user is authenticated but has no organization membership,
 * they land here. This happens if:
 * - They created an account via invitation but something went wrong
 *   during the org linking step.
 * - They existed as a user before the provisioned tenancy model was
 *   implemented (legacy accounts).
 * - Their org membership was revoked.
 *
 * The page tells them what happened and gives them a way to sign out.
 */
export default async function NoOrgPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          No Organization Found
        </h1>
        <p className="mt-4 text-[var(--color-muted)]">
          You&apos;re signed in as <strong>{user?.email}</strong>, but you&apos;re
          not a member of any organization yet.
        </p>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          If you received an invitation, check your email for the invite link.
          If you believe this is an error, contact your administrator.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
