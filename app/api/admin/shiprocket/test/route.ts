import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getShipRocketClientForTest, resetShipRocketClient } from '@/lib/shiprocket/client'
import type { ShipRocketSettings } from '@/lib/shiprocket/types'

// Force dynamic
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

// POST - Test ShipRocket connection
export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    let apiEmail = email
    let apiPassword = password

    // If credentials not provided, use saved credentials
    if (!apiEmail || !apiPassword) {
      const { data: settings, error } = await supabaseAdmin
        .from('shiprocket_settings' as never)
        .select('api_email, api_password')
        .limit(1)
        .maybeSingle()

      if (error || !settings) {
        return NextResponse.json(
          { error: 'No credentials provided and no saved credentials found.' },
          { status: 400 }
        )
      }

      const typedSettings = settings as ShipRocketSettings
      apiEmail = typedSettings.api_email
      apiPassword = typedSettings.api_password
    }

    if (!apiEmail || !apiPassword) {
      return NextResponse.json(
        { error: 'API email and password are required.' },
        { status: 400 }
      )
    }

    // Test authentication
    const client = await getShipRocketClientForTest(apiEmail, apiPassword)
    const tokenInfo = client.getTokenInfo()

    // If test successful, save the token to database
    const { data: existingSettings } = await supabaseAdmin
      .from('shiprocket_settings' as never)
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existingSettings) {
      await supabaseAdmin
        .from('shiprocket_settings' as never)
        .update({
          auth_token: tokenInfo.token,
          token_expires_at: tokenInfo.expiresAt?.toISOString(),
        } as never)
        .eq('id', (existingSettings as { id: string }).id)

      // Reset client to use new token
      resetShipRocketClient()
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful! ShipRocket API credentials are valid.',
      tokenExpiresAt: tokenInfo.expiresAt?.toISOString(),
    })
  } catch (error) {
    console.error('ShipRocket test connection error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Provide user-friendly error messages
    let userMessage = 'Failed to connect to ShipRocket API.'

    if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
      userMessage = 'Invalid credentials. Please check your API email and password.'
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userMessage = 'Network error. Please check your internet connection.'
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'Connection timed out. Please try again.'
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: errorMessage,
      },
      { status: 400 }
    )
  }
}
