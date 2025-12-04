import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminToken } from '@/lib/admin-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Sign in the user
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError || !authData.session || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify the user is an admin
    const tokenVerification = await verifyAdminToken(authData.session.access_token)

    if (!tokenVerification.isAdmin) {
      // Sign out if not admin
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    })

    // Set httpOnly cookies for tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    }

    response.cookies.set('admin_access_token', authData.session.access_token, cookieOptions)
    response.cookies.set('admin_refresh_token', authData.session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days for refresh token
    })

    return response
  } catch (error) {
    console.error('Error in admin login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

