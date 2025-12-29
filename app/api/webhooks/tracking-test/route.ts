import { NextRequest } from 'next/server'

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

// Webhook receiver - instant acknowledgment + async forwarding
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log('Webhook received:', JSON.stringify(payload))

    // Forward to main endpoint asynchronously (fire and forget)
    // This processes the webhook in the background while we return 200 immediately
    const forwardUrl = new URL('/api/webhooks/tracking', request.url)

    // Use waitUntil pattern via fetch with no await for immediate response
    fetch(forwardUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.headers.get('x-api-key') || '',
        'x-forwarded-from': 'tracking-test'
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.error('Forward failed:', err)
    })

    // Return immediate success to Shiprocket
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook received and queued for processing',
        awb: payload.awb || 'N/A'
      }),
      { status: 200, headers }
    )
  } catch {
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook acknowledged' }),
      { status: 200, headers }
    )
  }
}
