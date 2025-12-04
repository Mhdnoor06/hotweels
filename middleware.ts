import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only protect /admin/* routes (but not /admin/auth/* or /admin/signup or /admin login page)
  if (request.nextUrl.pathname.startsWith('/admin/') && 
      !request.nextUrl.pathname.startsWith('/admin/auth/') &&
      request.nextUrl.pathname !== '/admin' &&
      request.nextUrl.pathname !== '/admin/signup') {
    
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
  ],
}

