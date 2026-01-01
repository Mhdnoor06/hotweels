import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/collection'

  // With PKCE flow, auth exchange happens client-side
  // This callback just handles the redirect
  if (!code) {
    return NextResponse.redirect(new URL(redirect, requestUrl.origin))
  }

  // If code is present, exchange it for session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth callback error:', error.message)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
  }

  // Discord notification for new Google signups is handled client-side
  // in auth-context.tsx via onAuthStateChange listener

  return NextResponse.redirect(new URL(redirect, requestUrl.origin))
}
