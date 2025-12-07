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
  shiprocket_order_id: string | null
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/awb
 * Generate AWB and assign courier for a shipment
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
    const { courierId } = body as { courierId?: number }

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, shiprocket_order_id, shiprocket_shipment_id, shiprocket_awb_code')
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

    // Check if AWB already exists
    if (typedOrder.shiprocket_awb_code) {
      return NextResponse.json(
        {
          error: 'AWB already assigned for this order',
          awbCode: typedOrder.shiprocket_awb_code
        },
        { status: 400 }
      )
    }

    // Get ShipRocket clientx
    const client = await getShipRocketClient()

    // Generate AWB
    const result = await client.generateAWB(
      parseInt(typedOrder.shiprocket_shipment_id),
      courierId
    )

    // Update order with AWB details and set status to processing
    const updatePayload: Record<string, unknown> = {
      shiprocket_awb_code: result.awb_code,
      shiprocket_courier_id: result.courier_company_id,
      shiprocket_courier_name: result.courier_name,
      shiprocket_status: 'AWB_ASSIGNED',
    }

    // Auto-update order status to 'processing' if it's pending or confirmed
    if (['pending', 'confirmed'].includes(typedOrder.status)) {
      updatePayload.status = 'processing'
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload as never)
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order with AWB details:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'AWB generated successfully',
      awb: {
        code: result.awb_code,
        courierId: result.courier_company_id,
        courierName: result.courier_name,
        assignedAt: result.assigned_date_time,
      },
    })
  } catch (error) {
    console.error('Generate AWB error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to generate AWB: ${message}` },
      { status: 500 }
    )
  }
}
