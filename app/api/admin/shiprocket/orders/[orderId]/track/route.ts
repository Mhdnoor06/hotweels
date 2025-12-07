import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import { SHIPROCKET_STATUS_MAP, ORDER_STATUS_FROM_SHIPROCKET } from '@/lib/shiprocket/types'

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  status: string
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
  shiprocket_courier_name: string | null
  shiprocket_status: string | null
  tracking_url: string | null
  estimated_delivery_date: string | null
}

/**
 * GET /api/admin/shiprocket/orders/[orderId]/track
 * Get tracking information for an order
 */
export async function GET(
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
      .select('id, status, shiprocket_shipment_id, shiprocket_awb_code, shiprocket_courier_name, shiprocket_status, tracking_url, estimated_delivery_date')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

    // Check if order has AWB
    if (!typedOrder.shiprocket_awb_code) {
      return NextResponse.json(
        { error: 'Order does not have an AWB. Generate AWB first.' },
        { status: 400 }
      )
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Track by AWB
    const tracking = await client.trackByAWB(typedOrder.shiprocket_awb_code)

    // Map status ID to readable status
    const statusLabel = SHIPROCKET_STATUS_MAP[tracking.current_status_id] || tracking.current_status

    // Check if order status should be updated
    const newOrderStatus = ORDER_STATUS_FROM_SHIPROCKET[statusLabel]
    if (newOrderStatus && newOrderStatus !== typedOrder.status) {
      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({
          status: newOrderStatus,
          shiprocket_status: statusLabel,
          tracking_url: tracking.track_url,
          estimated_delivery_date: tracking.etd || null,
        } as never)
        .eq('id', orderId)
    } else {
      // Just update tracking info
      await supabaseAdmin
        .from('orders')
        .update({
          shiprocket_status: statusLabel,
          tracking_url: tracking.track_url,
          estimated_delivery_date: tracking.etd || null,
        } as never)
        .eq('id', orderId)
    }

    return NextResponse.json({
      success: true,
      tracking: {
        awb: tracking.awb,
        courier: typedOrder.shiprocket_courier_name || tracking.courier,
        currentStatus: tracking.current_status,
        statusId: tracking.current_status_id,
        statusLabel: statusLabel,
        estimatedDelivery: tracking.etd,
        deliveredDate: tracking.delivered_date,
        trackingUrl: tracking.track_url,
        events: tracking.events.map((event) => ({
          date: event.date,
          status: event.status,
          activity: event.activity,
          location: event.location,
          statusLabel: event['sr-status-label'],
        })),
      },
    })
  } catch (error) {
    console.error('Track order error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to get tracking: ${message}` },
      { status: 500 }
    )
  }
}
