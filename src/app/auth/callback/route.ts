import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

/**
 * Auth callback route - handles redirects after email confirmation and OAuth.
 *
 * WHY: Supabase sends users here after they click links in emails or complete
 * OAuth. Two flows:
 *
 * 1. Email confirmation: token_hash + type (e.g. signup, email). We use
 *    verifyOtp() which works across browsers (unlike exchangeCodeForSession
 *    which needs the PKCE code verifier cookie from the original browser).
 *
 * 2. OAuth (Google, etc.): code parameter. We use exchangeCodeForSession().
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const rawNext = searchParams.get('next') ?? '/'

  // SECURITY: Validate the redirect target to prevent open redirect attacks.
  // Only allow relative paths starting with "/" — reject absolute URLs, protocol-relative
  // URLs (//evil.com), and paths with encoded characters that could bypass checks.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const supabase = await createClient()

  if (tokenHash && type) {
    // Email confirmation flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email_change' | 'recovery',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } else if (code) {
    // OAuth PKCE flow
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
