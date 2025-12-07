import { NextRequest, NextResponse } from 'next/server'

// Edge runtime for instant response (no cold start ~5ms)
export const runtime = 'edge'

// Deploy to India/Asia regions
export const preferredRegion = ['bom1', 'sin1', 'hyd1']

// Simple CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json',
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 200, headers })
}

// Health check - instant response
export async function GET() {
  return new Response(
    JSON.stringify({ status: 'ok', message: 'Webhook endpoint active', runtime: 'edge' }),
    { status: 200, headers }
  )
}

// Webhook receiver - instant acknowledgment
export async function POST(request: NextRequest) {
  try {
    // Parse payload to validate it's JSON
    const payload = await request.json()

    // Log for debugging (visible in Vercel logs)
    console.log('Webhook received:', JSON.stringify(payload))

    // Return immediate success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook received',
        awb: payload.awb || 'N/A'
      }),
      { status: 200, headers }
    )
  } catch {
    // Even on error, return 200 (Shiprocket requirement)
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook acknowledged' }),
      { status: 200, headers }
    )
  }
}
