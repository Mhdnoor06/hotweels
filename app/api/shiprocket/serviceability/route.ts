import { NextRequest, NextResponse } from 'next/server'
import { getShipRocketClient } from '@/lib/shiprocket/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { ShipRocketSettings } from '@/lib/shiprocket/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/shiprocket/serviceability
 * Check if delivery is available to a pincode
 *
 * This is a public API that can be used during checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deliveryPincode, weight, isCOD = false, declaredValue } = body

    if (!deliveryPincode) {
      return NextResponse.json(
        { error: 'Delivery pincode is required' },
        { status: 400 }
      )
    }

    // Validate pincode format (6 digits for India)
    if (!/^\d{6}$/.test(deliveryPincode)) {
      return NextResponse.json(
        { error: 'Invalid pincode format. Must be 6 digits.' },
        { status: 400 }
      )
    }

    // Get pickup pincode from settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('shiprocket_settings')
      .select('pickup_pincode, default_weight, enabled')
      .limit(1)
      .maybeSingle()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'ShipRocket is not configured' },
        { status: 503 }
      )
    }

    const typedSettings = settings as ShipRocketSettings

    if (!typedSettings.enabled) {
      return NextResponse.json(
        { error: 'ShipRocket integration is disabled' },
        { status: 503 }
      )
    }

    if (!typedSettings.pickup_pincode) {
      return NextResponse.json(
        { error: 'Pickup location not configured' },
        { status: 503 }
      )
    }

    // Use provided weight or default weight
    const packageWeight = weight || typedSettings.default_weight || 0.5

    // Get ShipRocket client
    const client = await getShipRocketClient()

    // Check serviceability
    const result = await client.checkServiceability(
      typedSettings.pickup_pincode,
      deliveryPincode,
      packageWeight,
      isCOD,
      declaredValue
    )

    if (!result.available) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'Delivery is not available to this pincode',
        couriers: [],
      })
    }

    // Sort couriers by freight charge (cheapest first)
    const sortedCouriers = result.couriers.sort(
      (a, b) => a.freight_charge - b.freight_charge
    )

    // Find cheapest and fastest options
    const cheapest = sortedCouriers[0]
    const fastest = [...result.couriers].sort((a, b) => {
      const daysA = parseInt(a.estimated_delivery_days.split('-')[0]) || 999
      const daysB = parseInt(b.estimated_delivery_days.split('-')[0]) || 999
      return daysA - daysB
    })[0]

    // Format couriers for response
    const formattedCouriers = sortedCouriers.map((courier) => ({
      id: courier.courier_company_id,
      name: courier.courier_name,
      freightCharge: courier.freight_charge,
      codCharges: courier.cod_charges,
      totalCharge: courier.freight_charge + (isCOD ? courier.cod_charges : 0),
      estimatedDays: courier.estimated_delivery_days,
      etd: courier.etd,
      rating: courier.rating,
      isSurface: courier.is_surface,
    }))

    return NextResponse.json({
      success: true,
      available: true,
      message: `${result.couriers.length} courier(s) available`,
      couriers: formattedCouriers,
      cheapest: cheapest
        ? {
            id: cheapest.courier_company_id,
            name: cheapest.courier_name,
            charge: cheapest.freight_charge + (isCOD ? cheapest.cod_charges : 0),
          }
        : null,
      fastest: fastest
        ? {
            id: fastest.courier_company_id,
            name: fastest.courier_name,
            days: fastest.estimated_delivery_days,
          }
        : null,
    })
  } catch (error) {
    console.error('Serviceability check error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    // Check for common errors
    if (message.includes('not configured') || message.includes('disabled')) {
      return NextResponse.json(
        { error: 'Shipping service is temporarily unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check serviceability. Please try again.' },
      { status: 500 }
    )
  }
}
