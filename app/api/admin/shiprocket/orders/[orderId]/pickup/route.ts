import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  status: string
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
  shiprocket_status: string | null
  pickup_scheduled_date: string | null
  pickup_token: string | null
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/pickup
 * Schedule pickup for a shipment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // Verify admin auth
  const auth = await verifyAdminAuthFromRequest(request)
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    )
  }

  try {
    const { orderId } = await params

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, shiprocket_shipment_id, shiprocket_awb_code, shiprocket_status, pickup_scheduled_date, pickup_token')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

    // Check order status - prevent scheduling for cancelled/delivered orders
    if (['cancelled', 'delivered'].includes(typedOrder.status)) {
      return NextResponse.json(
        { error: `Cannot schedule pickup for ${typedOrder.status} order` },
        { status: 400 }
      )
    }

    // Check ShipRocket status - prevent scheduling for cancelled shipments
    if (typedOrder.shiprocket_status &&
        ['CANCELED', 'CANCELLED', 'RTO', 'RTO_DELIVERED', 'DELIVERED'].includes(typedOrder.shiprocket_status.toUpperCase())) {
      return NextResponse.json(
        { error: `Cannot schedule pickup for shipment with status: ${typedOrder.shiprocket_status}` },
        { status: 400 }
      )
    }

    // Check if order has a ShipRocket shipment
    if (!typedOrder.shiprocket_shipment_id) {
      return NextResponse.json(
        { error: 'Order does not have a ShipRocket shipment. Create ShipRocket order first.' },
        { status: 400 }
      )
    }

    // Check if AWB is assigned
    if (!typedOrder.shiprocket_awb_code) {
      return NextResponse.json(
        { error: 'AWB not assigned. Generate AWB first.' },
        { status: 400 }
      )
    }

    // Check if pickup already scheduled
    if (typedOrder.pickup_token) {
      return NextResponse.json(
        {
          error: 'Pickup already scheduled',
          pickup: {
            scheduledDate: typedOrder.pickup_scheduled_date,
            tokenNumber: typedOrder.pickup_token,
          }
        },
        { status: 400 }
      )
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Schedule pickup
    const result = await client.schedulePickup([parseInt(typedOrder.shiprocket_shipment_id)])

    // Update order with pickup details and status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        pickup_scheduled_date: result.pickup_scheduled_date,
        pickup_token: result.pickup_token_number,
        shiprocket_status: 'PICKUP_SCHEDULED',
        status: 'shipped', // Update order status to shipped
      } as never)
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order with pickup details:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pickup scheduled successfully',
      pickup: {
        scheduledDate: result.pickup_scheduled_date,
        tokenNumber: result.pickup_token_number,
      },
    })
  } catch (error) {
    console.error('Schedule pickup error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to schedule pickup: ${message}` },
      { status: 500 }
    )
  }
}
