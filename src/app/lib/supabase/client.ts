import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components (browser).
 *
 * WHY: Auth in Next.js needs different clients for different environments.
 * The browser client runs in the user's browser and stores the session
 * in cookies (handled by @supabase/ssr). We use a function that returns
 * a new client each time because the client holds mutable state—creating
 * a fresh one per component avoids stale session data.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
