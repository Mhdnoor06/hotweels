import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

// Force dynamic to ensure PUT method works
export const dynamic = 'force-dynamic'

type SettingsUpdate = Database['public']['Tables']['store_settings']['Update']

// GET - Get store settings
export async function GET() {
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
    }
    return NextResponse.json(defaultSettings)
  }

  return NextResponse.json(data)
}

// PUT - Update store settings
export async function PUT(request: NextRequest) {
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
    const cleanUpdateData = {
      ...updateData,
      cod_enabled: typeof updateData.cod_enabled === 'boolean' ? updateData.cod_enabled : updateData.cod_enabled === 'true' || updateData.cod_enabled === true,
      online_payment_enabled: typeof updateData.online_payment_enabled === 'boolean' ? updateData.online_payment_enabled : updateData.online_payment_enabled === 'true' || updateData.online_payment_enabled === true,
      discount_enabled: typeof updateData.discount_enabled === 'boolean' ? updateData.discount_enabled : updateData.discount_enabled === 'true' || updateData.discount_enabled === true,
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
        return NextResponse.json({ error: error.message }, { status: 500 })
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
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
