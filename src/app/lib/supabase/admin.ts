import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the service_role key.
 *
 * WHY: Some operations must bypass RLS. Examples:
 * - Invitation acceptance: inserting into organization_members for a user
 *   who is not yet a member of any org (RLS would block them).
 * - Superadmin creating orgs: the admin client is needed for auth.admin
 *   operations like createUser.
 *
 * IMPORTANT: The SUPABASE_SERVICE_ROLE_KEY env var has no NEXT_PUBLIC_ prefix
 * so it is never exposed to the browser. This client must ONLY be used in
 * server actions and route handlers.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
