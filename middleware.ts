import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/profile', '/gatherings/new', '/notifications', '/courts/suggest', '/admin']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))

  if (isProtected && !session) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only guard
  if (pathname.startsWith('/admin') && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/profile/:path*', '/gatherings/new', '/notifications/:path*', '/courts/suggest', '/admin/:path*'],
}
