import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminExists, createAdminUser } from '@/lib/admin-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const adminExists = await checkAdminExists()
    if (adminExists) {
      return NextResponse.json(
        { error: 'Admin user already exists. Signup is disabled.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for signup
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Sign up the user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin
      user_metadata: {
        full_name: name || null
      }
    })

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message || 'Failed to create admin user' },
        { status: 500 }
      )
    }

    // Create admin user record with admin role
    const adminError = await createAdminUser(authData.user.id, email, name)

    if (adminError.error) {
      // Cleanup: delete the auth user if we couldn't create the admin record
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: adminError.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      userId: authData.user.id
    })
  } catch (error) {
    console.error('Error in admin signup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

