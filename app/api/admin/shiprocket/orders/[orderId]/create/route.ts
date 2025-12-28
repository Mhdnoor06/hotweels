import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import type { ShipRocketSettings, CreateOrderRequest } from '@/lib/shiprocket/types'
import { formatOrderDate } from '@/lib/shiprocket/utils'

export const dynamic = 'force-dynamic'

interface ShippingAddress {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product?: {
    name: string
    id: string
    series?: string
  }
}

interface Order {
  id: string
  user_id: string
  status: string
  payment_method: string
  total: number
  discount_amount: number
  shipping_charges: number | null
  shipping_address: ShippingAddress
  shiprocket_order_id: string | null
  created_at: string
  order_items: OrderItem[]
}

/**
 * POST /api/admin/shiprocket/orders/[orderId]/create
 * Create a ShipRocket order for an existing order
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

    // Fetch the order with items and product details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (id, name, series)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as Order

    // Check if order already has a ShipRocket order
    if (typedOrder.shiprocket_order_id) {
      return NextResponse.json(
        { error: 'Order already has a ShipRocket shipment', shiprocketOrderId: typedOrder.shiprocket_order_id },
        { status: 400 }
      )
    }

    // Check order status - should be pending, confirmed or processing
    if (!['pending', 'confirmed', 'processing'].includes(typedOrder.status)) {
      return NextResponse.json(
        { error: `Cannot create shipment for order with status: ${typedOrder.status}. Order must not be shipped, delivered or cancelled.` },
        { status: 400 }
      )
    }

    // Get ShipRocket settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('shiprocket_settings')
      .select('*')
      .limit(1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'ShipRocket is not configured' },
        { status: 503 }
      )
    }

    const typedSettings = settings as unknown as ShipRocketSettings

    if (!typedSettings.enabled) {
      return NextResponse.json(
        { error: 'ShipRocket integration is disabled' },
        { status: 503 }
      )
    }

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Fetch actual pickup locations from ShipRocket to get the correct name
    let pickupLocationName = typedSettings.pickup_location_name
    try {
      const pickupLocations = await client.getPickupLocations()
      console.log('Available ShipRocket pickup locations:', JSON.stringify(pickupLocations, null, 2))

      if (pickupLocations.length > 0) {
        // Try to match by pincode first
        const matchByPincode = pickupLocations.find(
          loc => loc.pin_code === typedSettings.pickup_pincode
        )

        if (matchByPincode) {
          pickupLocationName = matchByPincode.pickup_location
          console.log(`Matched pickup location by pincode: ${pickupLocationName}`)
        } else {
          // Use the first available pickup location
          pickupLocationName = pickupLocations[0].pickup_location
          console.log(`Using first available pickup location: ${pickupLocationName}`)
        }
      }
    } catch (err) {
      console.error('Failed to fetch pickup locations, using configured name:', err)
    }

    // Get shipping address
    const shippingAddress = typedOrder.shipping_address as ShippingAddress

    // Parse customer name
    const nameParts = (shippingAddress.fullName || 'Customer').split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Calculate total weight
    const itemCount = typedOrder.order_items.reduce((sum, item) => sum + item.quantity, 0)
    const totalWeight = Math.max(
      itemCount * typedSettings.default_weight,
      typedSettings.default_weight
    )

    // Prepare order items for ShipRocket
    const orderItems = typedOrder.order_items.map((item) => ({
      name: item.product?.name || 'Hot Wheels Car',
      sku: item.product_id.slice(0, 20), // ShipRocket has SKU length limit
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: 9503, // HSN code for toys
    }))

    // Calculate the correct subtotal for Shiprocket (product value only, excluding shipping)
    // This is important for COD orders - we only collect the product amount, not shipping
    // because shipping is already paid by the customer during checkout
    const shippingCharges = typedOrder.shipping_charges || 0
    const productSubtotal = typedOrder.total - shippingCharges

    console.log(`Order total: ₹${typedOrder.total}, Shipping charges: ₹${shippingCharges}, Product subtotal: ₹${productSubtotal}`)

    // Create ShipRocket order payload
    const payload: CreateOrderRequest = {
      order_id: typedOrder.id.slice(0, 20), // Use shortened order ID
      order_date: formatOrderDate(new Date(typedOrder.created_at)),
      pickup_location: pickupLocationName,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shippingAddress.address.slice(0, 80),
      billing_city: shippingAddress.city.slice(0, 30),
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: 'India',
      billing_email: shippingAddress.email,
      billing_phone: shippingAddress.phone.replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: typedOrder.payment_method === 'cod' ? 'COD' : 'Prepaid',
      sub_total: productSubtotal, // Only the product value, not including shipping
      shipping_charges: 0, // Shipping already paid by customer, don't add to COD collection
      total_discount: typedOrder.discount_amount || 0,
      length: typedSettings.default_length,
      breadth: typedSettings.default_breadth,
      height: typedSettings.default_height,
      weight: totalWeight,
    }

    // Create order in ShipRocket
    const result = await client.createOrder(payload)

    // Log full response for debugging
    console.log('ShipRocket createOrder response:', JSON.stringify(result, null, 2))

    // Validate response - ShipRocket may return different structures
    if (!result) {
      throw new Error('Empty response from ShipRocket API')
    }

    // Handle potential error responses from ShipRocket
    if ((result as any).status_code === 0 || (result as any).message) {
      throw new Error((result as any).message || 'ShipRocket API returned an error')
    }

    // Validate required fields exist
    let srOrderId = result.order_id ?? (result as any).order_id ?? (result as any).id
    let srShipmentId = result.shipment_id ?? (result as any).shipment_id
    let srStatus = result.status ?? (result as any).status ?? 'NEW'
    let srAwbCode = result.awb_code ?? (result as any).awb_code ?? null
    let srCourierName = result.courier_name ?? (result as any).courier_name ?? null

    if (!srOrderId) {
      console.error('Invalid ShipRocket response - missing order_id:', result)
      throw new Error('ShipRocket API did not return an order_id. Response: ' + JSON.stringify(result))
    }

    // If shipment_id is not in the response, try to fetch it from ShipRocket
    if (!srShipmentId) {
      console.log('Shipment ID not in create response, fetching from ShipRocket...')
      try {
        const orderDetails = await client.getOrderDetails(String(srOrderId))
        console.log('Fetched order details:', JSON.stringify(orderDetails, null, 2))

        if (orderDetails.shipment_id) {
          srShipmentId = orderDetails.shipment_id
          srStatus = orderDetails.status || srStatus
          srAwbCode = orderDetails.awb_code || srAwbCode
          srCourierName = orderDetails.courier_name || srCourierName
        }
      } catch (fetchError) {
        console.error('Failed to fetch order details:', fetchError)
        // Continue without shipment_id - user can sync later
      }
    }

    // Update order with ShipRocket details (don't change order status - let admin do that)
    const shiprocketUpdatePayload: Record<string, unknown> = {
      shiprocket_order_id: String(srOrderId),
      shiprocket_shipment_id: srShipmentId ? String(srShipmentId) : null,
      shiprocket_status: srStatus,
    }

    if (srAwbCode) {
      shiprocketUpdatePayload.shiprocket_awb_code = srAwbCode
    }
    if (srCourierName) {
      shiprocketUpdatePayload.shiprocket_courier_name = srCourierName
    }

    // First, save ShipRocket data (this should always succeed)
    const { error: srUpdateError } = await supabaseAdmin
      .from('orders')
      .update(shiprocketUpdatePayload as never)
      .eq('id', orderId)

    if (srUpdateError) {
      console.error('Failed to save ShipRocket details:', srUpdateError)
      // This is critical - if we can't save the SR data, we need to report it
      return NextResponse.json({
        success: true,
        warning: 'ShipRocket order created but failed to save details to database. Please sync manually.',
        shiprocket: {
          orderId: srOrderId,
          shipmentId: srShipmentId,
          status: srStatus,
          awbCode: srAwbCode,
          courierName: srCourierName,
        },
      })
    }

    // Try to update order status to 'confirmed' if it's still 'pending'
    // This is safe because confirmed is a valid next state from pending
    if (typedOrder.status === 'pending') {
      const { error: statusError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'confirmed' } as never)
        .eq('id', orderId)
        .eq('status', 'pending') // Only update if still pending

      if (statusError) {
        console.log('Could not update order status to confirmed:', statusError.message)
        // Not critical - ShipRocket data is already saved
      }
    }

    // Auto-generate AWB if enabled and we have a shipment ID
    // Don't try if order is cancelled or in a bad state
    let autoAwbResult = null
    const canGenerateAwb = srShipmentId &&
      !srAwbCode &&
      !['CANCELED', 'CANCELLED', 'RTO', 'DELIVERED'].includes(srStatus?.toUpperCase() || '')

    if (typedSettings.auto_assign_courier && canGenerateAwb) {
      console.log('Auto-generating AWB for shipment:', srShipmentId)
      try {
        // Find the cheapest courier first
        const deliveryPincode = shippingAddress.pincode
        const isCOD = typedOrder.payment_method === 'cod'
        let cheapestCourierId: number | undefined

        if (deliveryPincode && typedSettings.pickup_pincode) {
          console.log(`Finding cheapest courier: ${typedSettings.pickup_pincode} → ${deliveryPincode}, COD: ${isCOD}`)

          const cheapestCourier = await client.getCheapestCourier(
            typedSettings.pickup_pincode,
            deliveryPincode,
            totalWeight,
            isCOD,
            typedOrder.total
          )

          if (cheapestCourier) {
            cheapestCourierId = cheapestCourier.courier_company_id
            console.log(`Selected cheapest courier: ${cheapestCourier.courier_name} (ID: ${cheapestCourierId}) @ ₹${cheapestCourier.total_charge}`)
          }
        }

        // Generate AWB with cheapest courier (or let Shiprocket decide if not found)
        const awbResponse = await client.generateAWB(Number(srShipmentId), cheapestCourierId)
        console.log('Auto AWB response:', JSON.stringify(awbResponse, null, 2))

        // Update order with AWB details only (don't change order status - let admin do that)
        const { error: awbUpdateError } = await supabaseAdmin
          .from('orders')
          .update({
            shiprocket_awb_code: awbResponse.awb_code,
            shiprocket_courier_name: awbResponse.courier_name,
            shiprocket_courier_id: awbResponse.courier_company_id,
            shiprocket_status: 'AWB_ASSIGNED',
          } as never)
          .eq('id', orderId)

        if (awbUpdateError) {
          console.error('Failed to save AWB details:', awbUpdateError)
        }

        autoAwbResult = {
          awbCode: awbResponse.awb_code,
          courierName: awbResponse.courier_name,
          courierId: awbResponse.courier_company_id,
        }

        // Update local variables for response
        srAwbCode = awbResponse.awb_code
        srCourierName = awbResponse.courier_name
        srStatus = 'AWB_ASSIGNED'
      } catch (awbError) {
        console.error('Auto AWB generation failed:', awbError)
        // Don't fail the whole request - order was created successfully
        autoAwbResult = { error: awbError instanceof Error ? awbError.message : 'AWB generation failed' }
      }
    }

    return NextResponse.json({
      success: true,
      message: autoAwbResult?.awbCode
        ? 'ShipRocket order created and AWB generated successfully'
        : 'ShipRocket order created successfully',
      shiprocket: {
        orderId: srOrderId,
        shipmentId: srShipmentId,
        status: srStatus,
        awbCode: srAwbCode,
        courierName: srCourierName,
      },
      autoAwb: autoAwbResult,
    })
  } catch (error) {
    console.error('Create ShipRocket order error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to create ShipRocket order: ${message}` },
      { status: 500 }
    )
  }
}
