import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
  shipping_label_url: string | null
}

/**
 * GET /api/admin/shiprocket/orders/[orderId]/label
 * Get or generate shipping label for a shipment
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
      .select('id, shiprocket_shipment_id, shiprocket_awb_code, shipping_label_url')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

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

    // If we already have a label URL, return it
    if (typedOrder.shipping_label_url) {
      return NextResponse.json({
        success: true,
        label: {
          url: typedOrder.shipping_label_url,
          generated: true,
          cached: true,
        },
      })
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Generate label
    const labelUrl = await client.generateLabel([parseInt(typedOrder.shiprocket_shipment_id)])

    // Update order with label URL
    // Don't overwrite shiprocket_status if already at a later stage
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        shipping_label_url: labelUrl,
      } as never)
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order with label URL:', updateError)
    }

    return NextResponse.json({
      success: true,
      label: {
        url: labelUrl,
        generated: true,
        cached: false,
      },
    })
  } catch (error) {
    console.error('Generate label error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to generate label: ${message}` },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/label
 * Force regenerate shipping label (useful if label expired)
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
      .select('id, shiprocket_shipment_id, shiprocket_awb_code')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

    // Check if order has a ShipRocket shipment
    if (!typedOrder.shiprocket_shipment_id) {
      return NextResponse.json(
        { error: 'Order does not have a ShipRocket shipment.' },
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

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Generate new label
    const labelUrl = await client.generateLabel([parseInt(typedOrder.shiprocket_shipment_id)])

    // Update order with new label URL
    await supabaseAdmin
      .from('orders')
      .update({ shipping_label_url: labelUrl } as never)
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      message: 'Label regenerated successfully',
      label: {
        url: labelUrl,
        generated: true,
      },
    })
  } catch (error) {
    console.error('Regenerate label error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to regenerate label: ${message}` },
      { status: 500 }
    )
  }
}
