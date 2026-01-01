import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notifyNewSignup } from '@/lib/discord'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/collection'

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error.message)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }

    // Check if this is a new user (created_at is within last minute)
    if (data?.user) {
      const createdAt = new Date(data.user.created_at)
      const now = new Date()
      const isNewUser = (now.getTime() - createdAt.getTime()) < 60000 // Within 1 minute

      if (isNewUser) {
        // Send Discord notification for new OAuth signup (non-blocking)
        notifyNewSignup({
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          provider: 'Google',
        }).catch(err => console.error('Discord OAuth notification failed:', err))
      }
    }
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(redirect, requestUrl.origin))
}
