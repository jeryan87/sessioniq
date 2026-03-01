import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * WHY: Server code runs on the server and doesn't have access to the browser's
 * localStorage. Instead, we read/write cookies. Next.js 15+ requires awaiting
 * cookies(). The try/catch around setAll is important: Server Components
 * cannot set cookies (only the Proxy can), so we silently ignore that
 * error—the Proxy handles session refresh before the page renders.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies—the Proxy handles this.
            // Ignoring is expected and safe.
          }
        },
      },
    }
  )
}
