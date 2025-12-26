import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'

type CustomCarInsert = Database['public']['Tables']['custom_cars']['Insert']

// Helper to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  return null
}

// GET - List all custom cars with their backgrounds
export async function GET(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('custom_cars')
    .select(`
      *,
      backgrounds:custom_backgrounds(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create a new custom car
export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const body: CustomCarInsert = await request.json()

    const { data, error } = await supabaseAdmin
      .from('custom_cars')
      .insert(body as never)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
