import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add X-Robots-Tag noindex for sitemap.xml and robots.txt
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex')
    return response
  }

  // Only protect /admin/* routes (but not /admin/auth/* or /admin/signup or /admin login page)
  if (pathname.startsWith('/admin/') &&
      !pathname.startsWith('/admin/auth/') &&
      pathname !== '/admin' &&
      pathname !== '/admin/signup') {

    // Check for admin access token in httpOnly cookie
    const token = request.cookies.get('admin_access_token')?.value

    if (!token) {
      // Redirect to admin login if no token
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/sitemap.xml',
    '/robots.txt',
  ],
}

