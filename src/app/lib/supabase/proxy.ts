import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase auth session on every request.
 *
 * WHY: Auth tokens expire. The Proxy runs before every page load and calls
 * getClaims() which validates the JWT and refreshes it if needed.
 *
 * IMPORTANT: The proxy only handles authentication (is the user logged in?).
 * Authorization (superadmin checks, org membership checks) is handled by
 * the page layouts, because middleware runs on the Edge runtime where
 * Supabase RPC/DB calls can be unreliable.
 *
 * Route classification:
 *   PUBLIC_ROUTES  - accessible without authentication (/login, /invite, /no-org)
 *   AUTH_ROUTES    - auth infrastructure (/auth/callback)
 *   Everything else - require authentication (layout handles role checks)
 */

const PUBLIC_ROUTES = ['/login', '/invite', '/no-org']
const AUTH_ROUTES = ['/auth']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Call getClaims() immediately after creating the client.
  // This refreshes the token and validates it. Skipping this can cause
  // random logouts.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const pathname = request.nextUrl.pathname

  // -------------------------------------------------------
  // UNAUTHENTICATED USERS
  // -------------------------------------------------------
  if (!user) {
    // Allow public and auth routes through
    if (isPublicRoute(pathname) || isAuthRoute(pathname)) {
      return supabaseResponse
    }
    // Everything else redirects to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // -------------------------------------------------------
  // AUTHENTICATED USERS
  // -------------------------------------------------------

  // Redirect away from /login (there is no /signup anymore)
  if (pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // All other authorization checks (superadmin, org membership)
  // are handled by the page layouts which run in the Node.js runtime
  // and can reliably query the database.

  return supabaseResponse
}
