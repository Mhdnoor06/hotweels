import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import type { ShipRocketSettings } from '@/lib/shiprocket/types'

export const dynamic = 'force-dynamic'

interface ShippingAddress {
  pincode: string
}

interface Order {
  id: string
  payment_method: string
  total: number
  shipping_address: ShippingAddress
  shiprocket_shipment_id: string | null
  shiprocket_awb_code: string | null
}

/**
 * GET /api/admin/shiprocket/orders/[orderId]/couriers
 * Fetch available couriers with prices for an order
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
      .select('id, payment_method, total, shipping_address, shiprocket_shipment_id, shiprocket_awb_code')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

    // Check if AWB already exists
    if (typedOrder.shiprocket_awb_code) {
      return NextResponse.json(
        { error: 'AWB already assigned for this order' },
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

    // Get settings for pickup pincode
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('shiprocket_settings')
      .select('pickup_pincode, default_weight')
      .limit(1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'ShipRocket settings not configured' },
        { status: 503 }
      )
    }

    const typedSettings = settings as unknown as ShipRocketSettings
    const deliveryPincode = typedOrder.shipping_address?.pincode

    if (!deliveryPincode) {
      return NextResponse.json(
        { error: 'Order does not have a delivery pincode' },
        { status: 400 }
      )
    }

    if (!typedSettings.pickup_pincode) {
      return NextResponse.json(
        { error: 'Pickup pincode not configured in settings' },
        { status: 503 }
      )
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    const isCOD = typedOrder.payment_method === 'cod'
    const weight = typedSettings.default_weight || 0.5

    // Check serviceability and get available couriers
    const result = await client.checkServiceability(
      typedSettings.pickup_pincode,
      deliveryPincode,
      weight,
      isCOD,
      typedOrder.total
    )

    if (!result.available || result.couriers.length === 0) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'No couriers available for this route',
        couriers: [],
      })
    }

    // Sort couriers by total charge (cheapest first)
    const sortedCouriers = [...result.couriers].sort((a, b) => {
      const totalA = a.freight_charge + (isCOD ? a.cod_charges : 0)
      const totalB = b.freight_charge + (isCOD ? b.cod_charges : 0)
      return totalA - totalB
    })

    // Format couriers for response
    const formattedCouriers = sortedCouriers.map((courier, index) => ({
      id: courier.courier_company_id,
      name: courier.courier_name,
      freightCharge: courier.freight_charge,
      codCharges: isCOD ? courier.cod_charges : 0,
      totalCharge: courier.freight_charge + (isCOD ? courier.cod_charges : 0),
      estimatedDays: courier.estimated_delivery_days,
      etd: courier.etd,
      rating: courier.rating,
      isSurface: courier.is_surface,
      isCheapest: index === 0,
    }))

    // Find fastest courier
    const fastestCourier = [...result.couriers].sort((a, b) => {
      const daysA = parseInt(a.estimated_delivery_days.split('-')[0]) || 999
      const daysB = parseInt(b.estimated_delivery_days.split('-')[0]) || 999
      return daysA - daysB
    })[0]

    // Mark fastest
    const fastestId = fastestCourier?.courier_company_id
    formattedCouriers.forEach(c => {
      (c as any).isFastest = c.id === fastestId
    })

    return NextResponse.json({
      success: true,
      available: true,
      message: `${result.couriers.length} courier(s) available`,
      couriers: formattedCouriers,
      route: {
        pickup: typedSettings.pickup_pincode,
        delivery: deliveryPincode,
        weight: weight,
        isCOD: isCOD,
      },
    })
  } catch (error) {
    console.error('Fetch couriers error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to fetch couriers: ${message}` },
      { status: 500 }
    )
  }
}
