import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Lazy initialization for Cloudflare Workers compatibility
// Environment variables may not be available at module load time
let _supabaseAdmin: SupabaseClient<Database> | null = null

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _supabaseAdmin
}

// Legacy export for backward compatibility - now uses getter
// Proxy properly binds methods to preserve 'this' context
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    const client = getSupabaseAdmin()
    const value = (client as any)[prop]
    // Bind functions to the client to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
