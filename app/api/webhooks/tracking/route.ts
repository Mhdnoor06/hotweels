import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// CORS headers for Shiprocket webhook
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

/**
 * OPTIONS /api/webhooks/shiprocket
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })  // Empty response for preflight requests
}

/**
 * ShipRocket Webhook Payload Structure
 * This endpoint receives tracking updates from ShipRocket
 */
interface ShipRocketWebhookPayload {
  awb: string
  courier_name: string
  current_status: string
  current_status_id: number
  shipment_status: string
  shipment_status_id: number
  order_id?: number | string
  channel_order_id?: string
  etd?: string
  scans?: {
    location: string
    date: string
    activity: string
    status: string
  }[]
  delivered_date?: string
  pod?: string // Proof of delivery
  pod_status?: string
}

// Map ShipRocket status IDs to our status
interface OrderForWebhook {
  id: string
  status: string
  shiprocket_status: string | null
}

const STATUS_MAP: Record<number, { shiprocketStatus: string; orderStatus?: string }> = {
  1: { shiprocketStatus: 'AWB_ASSIGNED' },
  2: { shiprocketStatus: 'LABEL_GENERATED' },
  3: { shiprocketStatus: 'PICKUP_SCHEDULED' },
  4: { shiprocketStatus: 'PICKUP_QUEUED' },
  5: { shiprocketStatus: 'MANIFEST_GENERATED' },
  6: { shiprocketStatus: 'SHIPPED', orderStatus: 'shipped' },
  7: { shiprocketStatus: 'DELIVERED', orderStatus: 'delivered' },
  8: { shiprocketStatus: 'CANCELLED', orderStatus: 'cancelled' },
  9: { shiprocketStatus: 'RTO_INITIATED' },
  10: { shiprocketStatus: 'RTO_DELIVERED' },
  11: { shiprocketStatus: 'PENDING' },
  12: { shiprocketStatus: 'LOST' },
  13: { shiprocketStatus: 'PICKUP_ERROR' },
  14: { shiprocketStatus: 'RTO_ACKNOWLEDGED' },
  15: { shiprocketStatus: 'PICKUP_RESCHEDULED' },
  16: { shiprocketStatus: 'CANCELLATION_REQUESTED' },
  17: { shiprocketStatus: 'OUT_FOR_DELIVERY' },
  18: { shiprocketStatus: 'IN_TRANSIT', orderStatus: 'shipped' },
  19: { shiprocketStatus: 'OUT_FOR_PICKUP' },
  20: { shiprocketStatus: 'PICKUP_EXCEPTION' },
  21: { shiprocketStatus: 'UNDELIVERED' },
  22: { shiprocketStatus: 'DELAYED' },
  23: { shiprocketStatus: 'PARTIAL_DELIVERED' },
  24: { shiprocketStatus: 'DESTROYED' },
  25: { shiprocketStatus: 'DAMAGED' },
  26: { shiprocketStatus: 'FULFILLED' },
  38: { shiprocketStatus: 'REACHED_DESTINATION_HUB' },
  39: { shiprocketStatus: 'MISROUTED' },
  40: { shiprocketStatus: 'RTO_IN_TRANSIT' },
  41: { shiprocketStatus: 'RTO_OUT_FOR_DELIVERY' },
  42: { shiprocketStatus: 'RTO_UNDELIVERED' },
  43: { shiprocketStatus: 'PICKED_UP', orderStatus: 'shipped' },
  44: { shiprocketStatus: 'SELF_FULFILLED' },
  45: { shiprocketStatus: 'DISPOSED_OFF' },
  46: { shiprocketStatus: 'CANCELLED_BY_USER' },
  47: { shiprocketStatus: 'RTO_LOCK' },
  48: { shiprocketStatus: 'STUCK_IN_TRANSIT' },
  49: { shiprocketStatus: 'PICKED_UP_CUSTOM_DELIVERED' },
  50: { shiprocketStatus: 'RTO_NDR' },
}

/**
 * POST /api/webhooks/shiprocket
 * Receives tracking updates from ShipRocket
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional, but recommended)
    const webhookSecret = request.headers.get('x-api-key')
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET

    // If webhook secret is configured, verify it
    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.warn('Invalid ShipRocket webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 200, headers: corsHeaders })  // Add CORS headers to response
    }

    const payload: ShipRocketWebhookPayload = await request.json()
    console.log('ShipRocket webhook received:', JSON.stringify(payload, null, 2))

    // Validate required fields
    if (!payload.awb) {
      console.error('Missing AWB in webhook payload')
      return NextResponse.json({ error: 'Missing AWB' }, { status: 200, headers: corsHeaders })  // Add CORS headers to response
    }

    // Find order by AWB code
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, status, shiprocket_status')
      .eq('shiprocket_awb_code', payload.awb)
      .single()

    if (findError || !order) {
      console.log(`Order not found for AWB: ${payload.awb}`)
      // Return success anyway to prevent ShipRocket from retrying
      return NextResponse.json({
        success: true,
        message: 'Order not found, webhook acknowledged'
      }, { headers: corsHeaders } )  // Add CORS headers to response
    }

    const typedOrder = order as unknown as OrderForWebhook

    // Prepare update data
    const updateData: Record<string, unknown> = {
      shiprocket_status: payload.current_status || payload.shipment_status,
    }

    // Update courier name if provided
    if (payload.courier_name) {
      updateData.shiprocket_courier_name = payload.courier_name
    }

    // Update estimated delivery date if provided
    if (payload.etd) {
      updateData.estimated_delivery_date = payload.etd
    }

    // Get status mapping
    const statusId = payload.current_status_id || payload.shipment_status_id
    const statusMapping = STATUS_MAP[statusId]

    if (statusMapping) {
      updateData.shiprocket_status = statusMapping.shiprocketStatus

      // Update order status if mapping defines one and it's a progression
      if (statusMapping.orderStatus) {
        const currentStatus = typedOrder.status
        const newStatus = statusMapping.orderStatus

        // Only update if it's a valid progression
        // pending -> confirmed -> processing -> shipped -> delivered
        // Or any status -> cancelled
        const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
        const currentIndex = statusOrder.indexOf(currentStatus)
        const newIndex = statusOrder.indexOf(newStatus)

        if (newStatus === 'cancelled' || newIndex > currentIndex) {
          updateData.status = newStatus
        }
      }
    }

    // Handle delivered status - save delivered date
    if (statusId === 7 && payload.delivered_date) {
      // ShipRocket doesn't have a dedicated delivered_date column in our schema
      // but we track it via shiprocket_status being DELIVERED
    }

    // Update the order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData as never)
      .eq('id', typedOrder.id)

    if (updateError) {
      console.error('Failed to update order from webhook:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update order'
      }, { status: 200, headers: corsHeaders })  // Add CORS headers to response
    }

    console.log(`Order ${typedOrder.id} updated via webhook:`, updateData)

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: typedOrder.id,
      newStatus: updateData.shiprocket_status,
    }, { headers: corsHeaders })  // Add CORS headers to response
  } catch (error) {
    console.error('ShipRocket webhook error:', error)

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200, headers: corsHeaders }  // Add CORS headers to response
    )
  }
}

/**
 * GET /api/webhooks/shiprocket
 * Health check endpoint for webhook verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'ShipRocket webhook endpoint is active'
  }, { headers: corsHeaders })  // Add CORS headers to response
}
