// Client-side Supabase client
export { supabase } from './client'

// Server-side Supabase client (use only in server components/API routes)
export { supabaseAdmin } from './server'

// Database types
export type {
  Database,
  Product,
  Order,
  OrderItem,
  WishlistItem,
  User
} from './database.types'
