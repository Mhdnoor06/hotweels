import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client for server-side operations
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Verify if a user is an admin from Supabase token
 */
export async function verifyAdminToken(token: string): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    // Create a client with the user's token
    const supabase = createClient<Database>(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return { isAdmin: false }
    }

    // Check if user has admin role in the users table
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userData || (userData as { role: string }).role !== 'admin') {
      return { isAdmin: false }
    }

    return { isAdmin: true, userId: user.id }
  } catch (error) {
    console.error('Error verifying admin token:', error)
    return { isAdmin: false }
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Get admin token from cookies (for server-side use)
 */
export function getTokenFromCookies(request: { cookies: { get: (name: string) => { value: string } | undefined } }): string | null {
  const cookie = request.cookies.get('admin_access_token')
  return cookie?.value || null
}

/**
 * Helper to verify admin auth from request (extracts token from cookies)
 */
export async function verifyAdminAuthFromRequest(request: { cookies: { get: (name: string) => { value: string } | undefined } }): Promise<{ isAdmin: boolean; userId?: string }> {
  const token = getTokenFromCookies(request)
  if (!token) {
    return { isAdmin: false }
  }
  return verifyAdminToken(token)
}

/**
 * Check if any admin exists in the database
 */
export async function checkAdminExists(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    return !error && data !== null
  } catch (error) {
    console.error('Error checking admin existence:', error)
    return false
  }
}

/**
 * Create admin user in database
 */
export async function createAdminUser(userId: string, email: string, name?: string): Promise<{ error: string | null }> {
  try {
    // Update the user role to admin
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: 'admin' } as never)
      .eq('id', userId)

    if (error) {
      // If update fails, try inserting (in case trigger didn't create user record)
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email,
          name: name || null,
          role: 'admin'
        } as never)

      if (insertError) {
        return { error: insertError.message }
      }
    }

    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create admin user' }
  }
}

