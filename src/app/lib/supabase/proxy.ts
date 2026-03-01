import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase auth session on every request.
 *
 * WHY: Auth tokens expire. The Proxy runs before every page load and calls
 * getClaims()—which validates the JWT and refreshes it if needed. We must
 * use getClaims() (not getSession()) in server code because getSession()
 * doesn't validate the token; getClaims() verifies the JWT signature
 * against Supabase's public keys, so we can trust it.
 *
 * This function also protects routes: if there's no user and they're not
 * on /login or /auth/*, we redirect to login.
 */
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

  // Redirect unauthenticated users to login (except for auth routes)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/signup')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access login/signup, redirect to home
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
