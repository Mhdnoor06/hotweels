import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import type { ShipRocketSettings, ShipRocketSettingsInput, ShipRocketSettingsResponse } from '@/lib/shiprocket/types'
import { resetShipRocketClient } from '@/lib/shiprocket/client'

// Create fresh Supabase admin client for each request with unique request ID
function getSupabaseAdmin(requestId?: string) {
  const uniqueId = requestId || `${Date.now()}-${Math.random().toString(36).substring(7)}`
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'x-request-id': uniqueId,
        }
      }
    }
  )
}

// Force dynamic to ensure no caching
export const dynamic = 'force-dynamic'

// Helper to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  return null
}

// Helper to fetch settings with retry for stale data
async function fetchSettingsWithRetry(maxRetries = 3, delayMs = 100): Promise<{ data: ShipRocketSettings | null; error: Error | null }> {
  let lastData: ShipRocketSettings | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Create a fresh client for each attempt
    const supabase = getSupabaseAdmin(`get-${Date.now()}-${attempt}`)

    const { data: rows, error } = await supabase
      .from('shiprocket_settings' as never)
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      return { data: null, error: error as unknown as Error }
    }

    const data = Array.isArray(rows) && rows.length > 0 ? rows[0] as ShipRocketSettings : null

    if (!data) {
      return { data: null, error: null }
    }

    // If this is the first attempt or the data is newer, use it
    if (!lastData || new Date(data.updated_at) >= new Date(lastData.updated_at)) {
      lastData = data
    }

    // If we got the same data twice, it's likely consistent
    if (attempt > 0 && lastData && data.updated_at === lastData.updated_at) {
      console.log(`GET - Data consistent after ${attempt + 1} attempts`)
      break
    }

    // Small delay before retry
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { data: lastData, error: null }
}

// GET - Get ShipRocket settings (without sensitive data)
export async function GET(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin(`count-${Date.now()}`)

    // First check how many rows exist (for debugging)
    const { count } = await supabase
      .from('shiprocket_settings' as never)
      .select('*', { count: 'exact', head: true })

    console.log('GET - Total rows in shiprocket_settings:', count)

    // Fetch with retry to handle read replica lag
    const { data, error } = await fetchSettingsWithRetry()

    console.log('GET raw data from DB:', JSON.stringify(data, null, 2))

    if (data) {
      console.log('GET data:', { pickup_phone: data.pickup_phone, pickup_address: data.pickup_address, enabled: data.enabled, updated_at: data.updated_at })
    } else {
      console.log('GET data: null')
    }

    if (error) {
      console.error('Error fetching ShipRocket settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no settings exist, return default response
    if (!data) {
      console.log('No shiprocket_settings row found, returning defaults')
      const defaultResponse: ShipRocketSettingsResponse = {
        enabled: false,
        hasCredentials: false,
        tokenValid: false,
        tokenExpiresAt: null,
        pickupLocation: null,
        autoAssignCourier: true,
        preferredCourierId: null,
        autoCreateOrder: false,
        autoSchedulePickup: false,
        defaultDimensions: {
          length: 15,
          breadth: 10,
          height: 5,
          weight: 0.1,
        },
      }
      return NextResponse.json(defaultResponse)
    }

    const settings = data

    // Check if token is valid
    let tokenValid = false
    if (settings.auth_token && settings.token_expires_at) {
      const expiry = new Date(settings.token_expires_at)
      tokenValid = expiry.getTime() > Date.now()
    }

    // Return settings without sensitive data (password)
    const response: ShipRocketSettingsResponse = {
      enabled: settings.enabled,
      hasCredentials: Boolean(settings.api_email && settings.api_password),
      tokenValid,
      tokenExpiresAt: settings.token_expires_at,
      pickupLocation: settings.pickup_address
        ? {
            name: settings.pickup_location_name,
            address: settings.pickup_address,
            address_2: settings.pickup_address_2,
            city: settings.pickup_city,
            state: settings.pickup_state,
            pincode: settings.pickup_pincode,
            phone: settings.pickup_phone,
            email: settings.pickup_email,
          }
        : null,
      autoAssignCourier: settings.auto_assign_courier,
      preferredCourierId: settings.preferred_courier_id,
      autoCreateOrder: settings.auto_create_order,
      autoSchedulePickup: settings.auto_schedule_pickup,
      defaultDimensions: {
        length: Number(settings.default_length),
        breadth: Number(settings.default_breadth),
        height: Number(settings.default_height),
        weight: Number(settings.default_weight),
      },
    }

    const jsonResponse = NextResponse.json(response)
    // Prevent caching
    jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    jsonResponse.headers.set('Pragma', 'no-cache')
    jsonResponse.headers.set('Expires', '0')
    return jsonResponse
  } catch (error) {
    console.error('Error in GET /api/admin/shiprocket/settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ShipRocket settings' },
      { status: 500 }
    )
  }
}

// PUT - Update ShipRocket settings
export async function PUT(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const body: ShipRocketSettingsInput = await request.json()
    console.log('PUT received body:', body)

    const supabase = getSupabaseAdmin()

    // Check how many rows exist (for debugging)
    const { count } = await supabase
      .from('shiprocket_settings' as never)
      .select('*', { count: 'exact', head: true })

    console.log('PUT - Total rows in shiprocket_settings:', count)

    // Check if settings exist - always order by created_at for consistency
    const { data: existingRows } = await supabase
      .from('shiprocket_settings' as never)
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)

    const existing = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null
    console.log('PUT - Existing row ID:', existing ? (existing as { id: string }).id : 'none')

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {}

    if (body.api_email !== undefined) updateData.api_email = body.api_email
    if (body.api_password !== undefined) updateData.api_password = body.api_password
    if (body.pickup_location_name !== undefined) updateData.pickup_location_name = body.pickup_location_name
    if (body.pickup_address !== undefined) updateData.pickup_address = body.pickup_address
    if (body.pickup_address_2 !== undefined) updateData.pickup_address_2 = body.pickup_address_2
    if (body.pickup_city !== undefined) updateData.pickup_city = body.pickup_city
    if (body.pickup_state !== undefined) updateData.pickup_state = body.pickup_state
    if (body.pickup_pincode !== undefined) updateData.pickup_pincode = body.pickup_pincode
    if (body.pickup_phone !== undefined) updateData.pickup_phone = body.pickup_phone
    if (body.pickup_email !== undefined) updateData.pickup_email = body.pickup_email
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.auto_assign_courier !== undefined) updateData.auto_assign_courier = body.auto_assign_courier
    if (body.preferred_courier_id !== undefined) updateData.preferred_courier_id = body.preferred_courier_id
    if (body.auto_create_order !== undefined) updateData.auto_create_order = body.auto_create_order
    if (body.auto_schedule_pickup !== undefined) updateData.auto_schedule_pickup = body.auto_schedule_pickup
    if (body.default_length !== undefined) updateData.default_length = body.default_length
    if (body.default_breadth !== undefined) updateData.default_breadth = body.default_breadth
    if (body.default_height !== undefined) updateData.default_height = body.default_height
    if (body.default_weight !== undefined) updateData.default_weight = body.default_weight
    if (body.webhook_secret !== undefined) updateData.webhook_secret = body.webhook_secret

    // If credentials changed, reset the cached client and clear token
    if (body.api_email !== undefined || body.api_password !== undefined) {
      updateData.auth_token = null
      updateData.token_expires_at = null
      resetShipRocketClient()
    }

    let result

    if (existing) {
      // Update existing settings
      console.log('Updating existing with updateData:', updateData)
      const { data, error } = await supabase
        .from('shiprocket_settings' as never)
        .update(updateData as never)
        .eq('id', (existing as { id: string }).id)
        .select()
        .single()

      console.log('Update result - data:', data, 'error:', error)

      if (error) {
        console.error('Error updating ShipRocket settings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Verify the update actually persisted by re-fetching
      const { data: verifyData } = await supabase
        .from('shiprocket_settings' as never)
        .select('*')
        .eq('id', (existing as { id: string }).id)
        .single()

      console.log('Verification fetch after update:', JSON.stringify(verifyData, null, 2))

      result = data
    } else {
      // Validate required fields for new record - only credentials are required initially
      if (!body.api_email || !body.api_password) {
        return NextResponse.json(
          { error: 'API email and password are required' },
          { status: 400 }
        )
      }

      // Create new settings with credentials (pickup location can be added later)
      const { data, error } = await supabase
        .from('shiprocket_settings' as never)
        .insert(updateData as never)
        .select()
        .single()

      if (error) {
        // If duplicate key error, try to update instead
        if (error.code === '23505') {
          const { data: updateResult, error: updateError } = await supabase
            .from('shiprocket_settings' as never)
            .update(updateData as never)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating ShipRocket settings after duplicate:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }
          result = updateResult
        } else {
          console.error('Error creating ShipRocket settings:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } else {
        result = data
      }
    }

    const settings = result as ShipRocketSettings

    // Check if token is valid
    let tokenValid = false
    if (settings.auth_token && settings.token_expires_at) {
      const expiry = new Date(settings.token_expires_at)
      tokenValid = expiry.getTime() > Date.now()
    }

    // Return updated settings without sensitive data
    const response: ShipRocketSettingsResponse = {
      enabled: settings.enabled,
      hasCredentials: Boolean(settings.api_email && settings.api_password),
      tokenValid,
      tokenExpiresAt: settings.token_expires_at,
      pickupLocation: settings.pickup_address
        ? {
            name: settings.pickup_location_name,
            address: settings.pickup_address,
            address_2: settings.pickup_address_2,
            city: settings.pickup_city,
            state: settings.pickup_state,
            pincode: settings.pickup_pincode,
            phone: settings.pickup_phone,
            email: settings.pickup_email,
          }
        : null,
      autoAssignCourier: settings.auto_assign_courier,
      preferredCourierId: settings.preferred_courier_id,
      autoCreateOrder: settings.auto_create_order,
      autoSchedulePickup: settings.auto_schedule_pickup,
      defaultDimensions: {
        length: Number(settings.default_length),
        breadth: Number(settings.default_breadth),
        height: Number(settings.default_height),
        weight: Number(settings.default_weight),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PUT /api/admin/shiprocket/settings:', error)
    return NextResponse.json(
      { error: 'Failed to update ShipRocket settings' },
      { status: 500 }
    )
  }
}
