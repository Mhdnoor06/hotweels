import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  status: string
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  shiprocket_status: string | null
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/cancel
 * Cancel a ShipRocket shipment
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
      .select('id, status, shiprocket_order_id, shiprocket_shipment_id, shiprocket_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

    // Check if order has a ShipRocket order
    if (!typedOrder.shiprocket_order_id) {
      return NextResponse.json(
        { error: 'Order does not have a ShipRocket shipment.' },
        { status: 400 }
      )
    }

    // Check if already cancelled
    if (typedOrder.shiprocket_status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Shipment is already cancelled.' },
        { status: 400 }
      )
    }

    // Check if already picked up or in transit - warn but allow
    const dangerousStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'REACHED_DESTINATION_HUB']
    if (dangerousStatuses.includes(typedOrder.shiprocket_status || '')) {
      // Get confirmation from request body
      const body = await request.json().catch(() => ({}))
      if (!body.force) {
        return NextResponse.json(
          {
            error: `Shipment is already ${typedOrder.shiprocket_status}. Cancellation may incur charges. Send force: true to confirm.`,
            requiresConfirmation: true,
            currentStatus: typedOrder.shiprocket_status,
          },
          { status: 400 }
        )
      }
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Cancel the order
    await client.cancelOrder([parseInt(typedOrder.shiprocket_order_id)])

    // Update order status - also cancel the local order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        shiprocket_status: 'CANCELLED',
        status: 'cancelled', // Also update local order status
      } as never)
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order status:', updateError)
      // Still return success since ShipRocket cancellation worked
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel shipment error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to cancel shipment: ${message}` },
      { status: 500 }
    )
  }
}
