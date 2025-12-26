import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'

type CustomBackgroundInsert = Database['public']['Tables']['custom_backgrounds']['Insert']

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

// GET - List all custom backgrounds (optionally filter by car_id)
export async function GET(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const carId = searchParams.get('car_id')

  let query = supabaseAdmin
    .from('custom_backgrounds')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter by car_id if provided
  if (carId) {
    query = query.eq('car_id', carId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create a new custom background
export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const body: CustomBackgroundInsert = await request.json()

    const { data, error } = await supabaseAdmin
      .from('custom_backgrounds')
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
