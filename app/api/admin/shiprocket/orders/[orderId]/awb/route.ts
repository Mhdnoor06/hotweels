import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import { notifyShippingUpdate } from '@/lib/notifications'
import type { ShipRocketSettings } from '@/lib/shiprocket/types'
import type { Database } from '@/lib/supabase/database.types'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export const dynamic = 'force-dynamic'

interface ShippingAddress {
  pincode: string
}

interface Order {
  id: string
  user_id: string | null
  status: string
  payment_method: string
  total: number
  shipping_address: ShippingAddress
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
    const { courierId, selectCheapest = true } = body as { courierId?: number; selectCheapest?: boolean }

    // Fetch the order with shipping details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, payment_method, total, shipping_address, shiprocket_order_id, shiprocket_shipment_id, shiprocket_awb_code')
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

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Determine courier ID to use
    let selectedCourierId = courierId
    let cheapestCourierInfo = null

    // If no specific courier provided and selectCheapest is true, find the cheapest
    if (!courierId && selectCheapest) {
      // Get settings for pickup pincode and weight
      const { data: settings } = await supabaseAdmin
        .from('shiprocket_settings')
        .select('pickup_pincode, default_weight')
        .limit(1)
        .single()

      if (settings) {
        const typedSettings = settings as unknown as ShipRocketSettings
        const deliveryPincode = typedOrder.shipping_address?.pincode
        const isCOD = typedOrder.payment_method === 'cod'

        if (deliveryPincode && typedSettings.pickup_pincode) {
          console.log(`Finding cheapest courier: ${typedSettings.pickup_pincode} → ${deliveryPincode}, COD: ${isCOD}`)

          cheapestCourierInfo = await client.getCheapestCourier(
            typedSettings.pickup_pincode,
            deliveryPincode,
            typedSettings.default_weight || 0.5,
            isCOD,
            typedOrder.total
          )

          if (cheapestCourierInfo) {
            selectedCourierId = cheapestCourierInfo.courier_company_id
            console.log(`Selected cheapest courier: ${cheapestCourierInfo.courier_name} (ID: ${selectedCourierId}) @ ₹${cheapestCourierInfo.total_charge}`)
          } else {
            console.log('No couriers available, will use Shiprocket default')
          }
        }
      }
    }

    // Generate AWB with the selected courier
    const result = await client.generateAWB(
      parseInt(typedOrder.shiprocket_shipment_id),
      selectedCourierId
    )

    // Log the result from Shiprocket
    console.log('Shiprocket AWB result:', JSON.stringify(result, null, 2))

    // Validate AWB code is not empty
    if (!result.awb_code) {
      return NextResponse.json(
        { error: 'Shiprocket returned empty AWB code' },
        { status: 500 }
      )
    }

    // Update order with AWB details only (don't change order status - let admin do that manually)
    const updatePayload: OrderUpdate = {
      shiprocket_awb_code: result.awb_code,
      shiprocket_courier_id: result.courier_company_id,
      shiprocket_courier_name: result.courier_name,
      shiprocket_status: 'AWB_ASSIGNED',
    }

    console.log('Updating order ID:', orderId)
    console.log('Update payload:', JSON.stringify(updatePayload, null, 2))

    const { error: updateError, data: updateData } = await supabaseAdmin
      .from('orders')
      .update(updatePayload as never)
      .eq('id', orderId)
      .select('shiprocket_awb_code, shiprocket_courier_name, shiprocket_status')
      .single()

    if (updateError) {
      console.error('Failed to update order with AWB details:', updateError)
      // AWB was generated in Shiprocket but failed to save locally
      return NextResponse.json(
        {
          error: `AWB generated (${result.awb_code}) but failed to save to database: ${updateError.message}`,
          awb_code: result.awb_code,
          courier_name: result.courier_name
        },
        { status: 500 }
      )
    }

    console.log('AWB saved to database:', updateData)

    // Notify user that courier has been assigned
    if (typedOrder.user_id) {
      const shortOrderId = orderId.slice(0, 8).toUpperCase()
      await notifyShippingUpdate(
        typedOrder.user_id,
        orderId,
        'Courier Assigned',
        `${result.courier_name} has been assigned to deliver your order #${shortOrderId}. Your package will be picked up soon.`,
        {
          courier: result.courier_name,
          awb: result.awb_code,
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: cheapestCourierInfo
        ? `AWB generated with cheapest courier: ${result.courier_name} @ ₹${cheapestCourierInfo.total_charge}`
        : 'AWB generated successfully',
      awb: {
        code: result.awb_code,
        courierId: result.courier_company_id,
        courierName: result.courier_name,
        assignedAt: result.assigned_date_time,
      },
      courierSelection: cheapestCourierInfo ? {
        method: 'cheapest',
        freightCharge: cheapestCourierInfo.freight_charge,
        codCharges: cheapestCourierInfo.cod_charges,
        totalCharge: cheapestCourierInfo.total_charge,
        estimatedDays: cheapestCourierInfo.estimated_delivery_days,
      } : {
        method: courierId ? 'manual' : 'shiprocket_default',
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
