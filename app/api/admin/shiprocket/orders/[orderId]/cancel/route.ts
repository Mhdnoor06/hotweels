import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import { notifyOrderStatusChange, notifyShippingUpdate } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  user_id: string | null
  status: string
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
  shiprocket_status: string | null
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/cancel
 * Cancel a ShipRocket order or shipment
 *
 * Body options:
 * - mode: 'order' (default) - Cancels entire order and local order status
 * - mode: 'shipment' - Cancels only the shipment/AWB, keeps order active for re-assignment
 * - force: true - Required for cancelling in-transit shipments
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
    const body = await request.json().catch(() => ({}))
    const { mode = 'order', force = false } = body as { mode?: 'order' | 'shipment'; force?: boolean }

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, shiprocket_order_id, shiprocket_shipment_id, shiprocket_awb_code, shiprocket_status')
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

    // For shipment cancellation, AWB code is required
    if (mode === 'shipment' && !typedOrder.shiprocket_awb_code) {
      return NextResponse.json(
        { error: 'No AWB assigned to this order. Use order cancellation instead.' },
        { status: 400 }
      )
    }

    // Check if already picked up or in transit - warn but allow with force
    const dangerousStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'REACHED_DESTINATION_HUB']
    if (dangerousStatuses.includes(typedOrder.shiprocket_status || '')) {
      if (!force) {
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

    if (mode === 'shipment') {
      // Cancel only the shipment/AWB - keeps order active
      console.log(`Cancelling shipment AWB: ${typedOrder.shiprocket_awb_code}`)
      await client.cancelShipment([typedOrder.shiprocket_awb_code!])

      // Clear AWB and courier data, reset order status to confirmed
      // This allows the order to go through the fulfillment flow again
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          shiprocket_awb_code: null,
          shiprocket_courier_id: null,
          shiprocket_courier_name: null,
          shiprocket_status: 'NEW', // Reset to NEW so AWB can be regenerated
          pickup_scheduled_date: null,
          pickup_token: null,
          shipping_label_url: null,
          tracking_url: null,
          estimated_delivery_date: null,
          status: 'confirmed', // Reset order status back to confirmed
        } as never)
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order after shipment cancellation:', updateError)
      }

      // Notify user about shipment cancellation
      if (typedOrder.user_id) {
        await notifyShippingUpdate(
          typedOrder.user_id,
          orderId,
          'Shipment Cancelled',
          `The shipment for your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled. A new courier will be assigned soon.`
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Shipment cancelled successfully. You can now assign a new courier.',
        mode: 'shipment',
      })
    } else {
      // Cancel the entire order
      console.log(`Cancelling order: ${typedOrder.shiprocket_order_id}`)
      await client.cancelOrder([parseInt(typedOrder.shiprocket_order_id)])

      // Update both shiprocket_status and order status to cancelled
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          shiprocket_status: 'CANCELLED',
          status: 'cancelled', // Also update local order status
        } as never)
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
      }

      // Notify user about order cancellation
      if (typedOrder.user_id) {
        await notifyOrderStatusChange(
          typedOrder.user_id,
          orderId,
          'cancelled'
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully',
        mode: 'order',
      })
    }
  } catch (error) {
    console.error('Cancel error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to cancel: ${message}` },
      { status: 500 }
    )
  }
}
