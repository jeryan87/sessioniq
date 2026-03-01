import { type NextRequest } from 'next/server'
import { updateSession } from '@/app/lib/supabase/proxy'

/**
 * Next.js Proxy (formerly Middleware) runs before every matching request.
 *
 * WHY: We need to refresh auth tokens before the page renders. Server
 * Components can't set cookies, so the Proxy is the only place that can
 * update the session and pass fresh cookies to both the browser and
 * server. The matcher excludes static assets to avoid unnecessary work.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - images, fonts, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
