import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookies } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear cookies
    response.cookies.delete('admin_access_token')
    response.cookies.delete('admin_refresh_token')

    // If token exists, sign out from Supabase
    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        })
        await supabase.auth.signOut()
      }
    }

    return response
  } catch (error) {
    console.error('Error in admin logout:', error)
    
    // Still clear cookies even if there's an error
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.cookies.delete('admin_access_token')
    response.cookies.delete('admin_refresh_token')
    return response
  }
}

