import { NextResponse } from 'next/server'
import { createOrder, getUserOrders, type CreateOrderInput } from '@/lib/supabase/orders'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

// Helper to get user from Authorization header
async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  // Create a new client and verify the token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

// GET - Fetch orders for the current user
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orders = await getUserOrders(user.id)

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST - Create a new order
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to place an order' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items, shipping_address, total, payment_method, transaction_id, payment_screenshot, discount_amount, shipping_charges, shipping_payment_screenshot } = body

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      )
    }

    if (!shipping_address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    const orderInput: CreateOrderInput = {
      user_id: user.id,
      items: items.map((item: { id: string; quantity: number; price: number }) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      shipping_address,
      total,
      payment_method: payment_method || 'cod',
      transaction_id: transaction_id || undefined,
      payment_screenshot: payment_screenshot || undefined,
      discount_amount: discount_amount || 0,
      shipping_charges: shipping_charges || undefined,
      shipping_payment_screenshot: shipping_payment_screenshot || undefined,
    }

    // Pass user email and name to ensure user exists in public.users
    const { order, error } = await createOrder(
      orderInput,
      user.email,
      user.user_metadata?.full_name || user.user_metadata?.name || shipping_address?.fullName
    )

    if (error || !order) {
      return NextResponse.json(
        { error: error || 'Failed to create order' },
        { status: 500 }
      )
    }

    // Send notification about order placement
    const shortOrderId = order.id.slice(0, 8).toUpperCase()
    await createNotification({
      userId: user.id,
      title: 'Order Placed Successfully',
      message: `Your order #${shortOrderId} has been placed and is pending confirmation. We'll notify you once it's confirmed.`,
      type: 'order_status',
      orderId: order.id,
      metadata: {
        status: 'pending',
        total: order.total,
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
      },
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
