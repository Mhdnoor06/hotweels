import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'

export const dynamic = 'force-dynamic'

interface OrderWithShipRocket {
  id: string
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
  shiprocket_status: string | null
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/sync
 * Sync order details from ShipRocket to local database
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

    // Fetch the order from database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, shiprocket_order_id, shiprocket_shipment_id, shiprocket_awb_code, shiprocket_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as OrderWithShipRocket

    if (!typedOrder.shiprocket_order_id) {
      return NextResponse.json(
        { error: 'Order does not have a ShipRocket order ID' },
        { status: 400 }
      )
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Fetch order details from ShipRocket
    console.log(`Syncing ShipRocket order: ${typedOrder.shiprocket_order_id}`)
    const srOrder = await client.getOrderDetails(typedOrder.shiprocket_order_id)
    console.log('ShipRocket order details:', JSON.stringify(srOrder, null, 2))

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    let hasChanges = false

    // Update shipment_id if we got it
    if (srOrder.shipment_id && String(srOrder.shipment_id) !== typedOrder.shiprocket_shipment_id) {
      updateData.shiprocket_shipment_id = String(srOrder.shipment_id)
      hasChanges = true
    }

    // Update AWB code if we got it
    if (srOrder.awb_code && srOrder.awb_code !== typedOrder.shiprocket_awb_code) {
      updateData.shiprocket_awb_code = srOrder.awb_code
      hasChanges = true
    }

    // Update courier name if we got it
    if (srOrder.courier_name) {
      updateData.shiprocket_courier_name = srOrder.courier_name
    }

    // Update status
    if (srOrder.status && srOrder.status !== typedOrder.shiprocket_status) {
      updateData.shiprocket_status = srOrder.status
      hasChanges = true
    }

    // Update local order if we have changes
    if (hasChanges || Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updateData as never)
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order with synced data:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: hasChanges ? 'Order synced successfully' : 'Order is already up to date',
      shiprocket: {
        orderId: srOrder.order_id,
        shipmentId: srOrder.shipment_id,
        status: srOrder.status,
        awbCode: srOrder.awb_code,
        courierName: srOrder.courier_name,
      },
      updated: hasChanges,
    })
  } catch (error) {
    console.error('Sync ShipRocket order error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to sync ShipRocket order: ${message}` },
      { status: 500 }
    )
  }
}
