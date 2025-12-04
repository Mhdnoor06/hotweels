import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'

// Force dynamic to ensure PUT method works
export const dynamic = 'force-dynamic'

type SettingsUpdate = Database['public']['Tables']['store_settings']['Update']

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

// GET - Get store settings (public read, but we'll still verify for consistency)
export async function GET(request: NextRequest) {
  // Settings can be read publicly - remove auth check for public access
  // Uncomment below if you want to require admin auth
  // const authError = await verifyAdminAuth(request)
  // if (authError) return authError
  const { data, error } = await supabaseAdmin
    .from('store_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no settings exist, return default settings
  if (!data) {
    const defaultSettings = {
      contact_phone: "",
      contact_email: "",
      contact_whatsapp: "",
      upi_qr_code: "",
      upi_id: "",
      cod_enabled: true,
      online_payment_enabled: true,
      cod_charges: 0,
      discount_enabled: false,
      discount_percentage: 0,
      discount_code: "",
      store_name: "Hot Wheels Store",
      store_address: "",
      shipping_charges_collection_enabled: false,
      shipping_charges_amount: 0,
    }
    return NextResponse.json(defaultSettings)
  }

  return NextResponse.json(data)
}

// PUT - Update store settings
export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()

    // Remove id, created_at, updated_at from body if present
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...updateData } = body as SettingsUpdate & {
      id?: string
      created_at?: string
      updated_at?: string
    }

    // Ensure boolean values are properly set
    const cleanUpdateData: Record<string, unknown> = {
      ...updateData,
      cod_enabled: typeof updateData.cod_enabled === 'boolean' ? updateData.cod_enabled : updateData.cod_enabled === 'true' || updateData.cod_enabled === true,
      online_payment_enabled: typeof updateData.online_payment_enabled === 'boolean' ? updateData.online_payment_enabled : updateData.online_payment_enabled === 'true' || updateData.online_payment_enabled === true,
      discount_enabled: typeof updateData.discount_enabled === 'boolean' ? updateData.discount_enabled : updateData.discount_enabled === 'true' || updateData.discount_enabled === true,
      shipping_charges_collection_enabled: typeof updateData.shipping_charges_collection_enabled === 'boolean' ? updateData.shipping_charges_collection_enabled : updateData.shipping_charges_collection_enabled === 'true' || updateData.shipping_charges_collection_enabled === true,
    }

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('store_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    const existingSettings = existing as { id: string } | null
    let result

    if (!existingSettings) {
      // Create new settings record if it doesn't exist
      const { data, error } = await supabaseAdmin
        .from('store_settings')
        .insert(cleanUpdateData as never)
        .select()
        .single()

      if (error) {
        console.error('Error creating settings:', error)
        return NextResponse.json(
          { error: error.message, details: error.details, hint: error.hint },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Update existing settings
      const { data, error } = await supabaseAdmin
        .from('store_settings')
        .update(cleanUpdateData as never)
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating settings:', error)
        console.error('Update data:', cleanUpdateData)
        return NextResponse.json(
          { error: error.message, details: error.details, hint: error.hint },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Invalid request body'
    return NextResponse.json(
      { error: errorMessage, type: 'unexpected_error' },
      { status: 400 }
    )
  }
}
