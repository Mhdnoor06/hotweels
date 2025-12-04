import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

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

// GET - List all orders with items and user info
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await verifyAdminAuth(request)
  if (authError) return authError
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('orders')
    .select(`
      *,
      user:users(name, email),
      order_items(
        *,
        product:products(name, image, series)
      )
    `)
    .order('created_at', { ascending: false })

  if (status && status !== 'All') {
    query = query.eq('status', status.toLowerCase() as Database['public']['Tables']['orders']['Row']['status'])
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH - Update order status or payment status
export async function PATCH(request: NextRequest) {
  // Verify admin authentication
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { orderId, status, payment_status } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const updateData: OrderUpdate = {}
    if (status) updateData.status = status.toLowerCase()
    if (payment_status) updateData.payment_status = payment_status.toLowerCase()

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData as never)
      .eq('id', orderId)
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
