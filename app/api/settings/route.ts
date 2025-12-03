import { NextResponse } from 'next/server'
import { getStoreSettings } from '@/lib/supabase/settings'

// GET - Fetch store settings (public)
export async function GET() {
  try {
    const settings = await getStoreSettings()

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
