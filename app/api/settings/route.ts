import { NextResponse } from 'next/server'
import { getStoreSettings } from '@/lib/supabase/settings'
import { supabaseAdmin } from '@/lib/supabase/server'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// GET - Fetch store settings (public)
export async function GET() {
  try {
    // Use admin client to bypass RLS and get latest data
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      )
    }

    // Ensure new columns exist with defaults if missing
    const settingsData = data as any
    if (settingsData.shipping_charges_amount === null || settingsData.shipping_charges_amount === undefined) {
      settingsData.shipping_charges_amount = 50
    }
    if (settingsData.shipping_charges_collection_enabled === null || settingsData.shipping_charges_collection_enabled === undefined) {
      settingsData.shipping_charges_collection_enabled = false
    }

    console.log('Settings API returning - shipping_charges_amount:', settingsData.shipping_charges_amount)
    
    // Return with cache control headers to prevent caching
    return NextResponse.json(
      { settings: settingsData },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
