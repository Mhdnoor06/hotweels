import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface TrackingActivity {
  date: string
  status: string
  activity: string
  location: string
  'sr-status-label'?: string
}

interface OrderWithTracking {
  id: string
  user_id: string
  status: string
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
  shiprocket_courier_name: string | null
  shiprocket_status: string | null
  estimated_delivery_date: string | null
  tracking_url: string | null
  pickup_scheduled_date: string | null
}

// Helper to get user from Authorization header
async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

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

/**
 * GET /api/orders/[orderId]/track
 * Get tracking details for an order (user must own the order)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verify user auth
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to track your order' },
        { status: 401 }
      )
    }

    const { orderId } = await params

    // Fetch the order (ensure user owns it)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        shiprocket_order_id,
        shiprocket_shipment_id,
        shiprocket_awb_code,
        shiprocket_courier_name,
        shiprocket_status,
        estimated_delivery_date,
        tracking_url,
        pickup_scheduled_date
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as OrderWithTracking

    // Verify ownership
    if (typedOrder.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this order' },
        { status: 403 }
      )
    }

    // If no ShipRocket AWB, return basic status
    if (!typedOrder.shiprocket_awb_code) {
      return NextResponse.json({
        success: true,
        tracking: {
          orderId: typedOrder.id,
          status: typedOrder.status,
          shiprocketStatus: typedOrder.shiprocket_status,
          hasShipment: false,
          message: typedOrder.shiprocket_order_id
            ? 'Your order is being prepared for shipment'
            : 'Shipment not yet created',
        }
      })
    }

    // Fetch live tracking from ShipRocket
    let liveTracking: {
      awb: string
      courier: string
      currentStatus: string
      statusLabel: string
      events: TrackingActivity[]
      etd: string
      deliveredDate: string | null
      trackingUrl: string
    } | null = null

    try {
      const client = await getShipRocketClient()
      const trackData = await client.trackByAWB(typedOrder.shiprocket_awb_code!)

      liveTracking = {
        awb: trackData.awb,
        courier: typedOrder.shiprocket_courier_name || trackData.courier,
        currentStatus: trackData.current_status,
        statusLabel: formatStatusLabel(trackData.current_status),
        events: trackData.events.map(e => ({
          date: e.date,
          status: e['sr-status-label'] || e.status || '',
          activity: e.activity,
          location: e.location,
        })),
        etd: trackData.etd,
        deliveredDate: trackData.delivered_date,
        trackingUrl: trackData.track_url,
      }

      // Update estimated delivery date if different
      if (trackData.etd && trackData.etd !== typedOrder.estimated_delivery_date) {
        await supabaseAdmin
          .from('orders')
          .update({
            estimated_delivery_date: trackData.etd,
            tracking_url: trackData.track_url,
            shiprocket_status: trackData.current_status,
          } as never)
          .eq('id', orderId)
      }
    } catch (trackError) {
      console.error('Failed to fetch live tracking:', trackError)
      // Continue with cached data
    }

    return NextResponse.json({
      success: true,
      tracking: {
        orderId: typedOrder.id,
        status: typedOrder.status,
        hasShipment: true,
        awbCode: typedOrder.shiprocket_awb_code,
        courierName: typedOrder.shiprocket_courier_name,
        shiprocketStatus: liveTracking?.currentStatus || typedOrder.shiprocket_status,
        statusLabel: liveTracking?.statusLabel || formatStatusLabel(typedOrder.shiprocket_status),
        estimatedDelivery: liveTracking?.etd || typedOrder.estimated_delivery_date,
        deliveredDate: liveTracking?.deliveredDate,
        trackingUrl: liveTracking?.trackingUrl || typedOrder.tracking_url,
        pickupDate: typedOrder.pickup_scheduled_date,
        events: liveTracking?.events || [],
      }
    })
  } catch (error) {
    console.error('Track order error:', error)

    return NextResponse.json(
      { error: 'Failed to get tracking information' },
      { status: 500 }
    )
  }
}

function formatStatusLabel(status: string | null): string {
  if (!status) return 'Processing'

  const statusLabels: Record<string, string> = {
    'AWB_ASSIGNED': 'Tracking Number Assigned',
    'LABEL_GENERATED': 'Shipping Label Ready',
    'PICKUP_SCHEDULED': 'Pickup Scheduled',
    'PICKUP_QUEUED': 'Awaiting Pickup',
    'MANIFEST_GENERATED': 'Manifest Created',
    'SHIPPED': 'Shipped',
    'PICKED_UP': 'Picked Up by Courier',
    'IN_TRANSIT': 'In Transit',
    'OUT_FOR_DELIVERY': 'Out for Delivery',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'RTO_INITIATED': 'Returning to Seller',
    'RTO_IN_TRANSIT': 'Return in Transit',
    'RTO_DELIVERED': 'Returned to Seller',
    'UNDELIVERED': 'Delivery Attempt Failed',
    'DELAYED': 'Delayed',
    'REACHED_DESTINATION_HUB': 'Reached Destination Hub',
  }

  return statusLabels[status.toUpperCase()] || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}
