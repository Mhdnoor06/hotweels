# Shiprocket Webhook Integration Issue

## Project Overview
- **Project**: HotWeels - E-commerce website
- **Framework**: Next.js (App Router)
- **Hosting**: Vercel
- **Domain**: https://wheelsframe.vercel.app

## Goal
Configure Shiprocket webhook to receive real-time shipment tracking updates.

## Current Webhook Endpoint
```
https://wheelsframe.vercel.app/api/webhooks/tracking
```

**File location**: `app/api/webhooks/tracking/route.ts`

---

## The Problem

When trying to save/test the webhook URL in Shiprocket dashboard:
- **Error 1**: "Not Allowed" toast when clicking Test button
- **Error 2**: "Could not test your endpoint, http_code from curl request is 0, Curl error: , Please try again later"
- **Error 3**: "Please check your endpoint, unable to send request to mentioned api"

**Key finding**: webhook.site URL works perfectly with Shiprocket, but our Vercel deployment doesn't.

---

## What We've Verified

### 1. Endpoint is accessible and working
```bash
# GET request works
curl -X GET "https://wheelsframe.vercel.app/api/webhooks/tracking"
# Response: {"status":"ok","message":"ShipRocket webhook endpoint is active"}

# POST request works
curl -X POST "https://wheelsframe.vercel.app/api/webhooks/tracking" \
  -H "Content-Type: application/json" \
  -d '{"awb":"test123","current_status":"IN TRANSIT","current_status_id":18}'
# Response: {"success":true,"message":"Order not found, webhook acknowledged"}

# Returns HTTP 200 with proper headers
```

### 2. CORS headers are configured
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}
```

### 3. OPTIONS preflight handler exists
```typescript
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
```

### 4. All responses return HTTP 200 (per Shiprocket requirement)

---

## Shiprocket Webhook Requirements (from their docs)

1. **Method**: POST
2. **Content-Type**: application/json
3. **URL restrictions**: Must NOT contain keywords like "shiprocket", "kartrocket", "sr", or "kr"
4. **Security token header**: `x-api-key` (optional)
5. **Response**: Must return only status code 200

---

## Changes Made

### 1. Renamed webhook route
- **Before**: `/api/webhooks/shiprocket`
- **After**: `/api/webhooks/tracking`
- **Reason**: Shiprocket docs say URL must not contain "shiprocket" keyword

### 2. Updated security header
- **Before**: `x-shiprocket-signature`
- **After**: `x-api-key`
- **Reason**: Per Shiprocket documentation

### 3. Changed all error responses to return HTTP 200
- All `status: 401`, `status: 400`, `status: 500` changed to `status: 200`
- **Reason**: Shiprocket requires all responses to be 200

### 4. Added CORS support
- Added `corsHeaders` to all responses
- Added `OPTIONS` handler for preflight requests

### 5. Created vercel.json
```json
{
  "functions": {
    "app/api/webhooks/tracking/route.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## Suspected Root Cause

**Geographic/Network routing issue** between Shiprocket servers (India) and Vercel's edge network.

Evidence:
- webhook.site works with Shiprocket ✅
- Our Vercel endpoint works when tested from other locations ✅
- Shiprocket returns "http_code 0" which means connection couldn't be established at all

---

## Potential Solutions to Try

### Option 1: Force Vercel region to India/Asia
Add to `app/api/webhooks/tracking/route.ts`:
```typescript
export const preferredRegion = ['bom1', 'sin1']  // Mumbai, Singapore
```

### Option 2: Use Edge Runtime (faster response)
```typescript
export const runtime = 'edge'
export const preferredRegion = ['bom1', 'sin1']
```
**Note**: May cause issues if Supabase admin client uses Node.js-only features

### Option 3: Use a webhook relay service
- Set up webhook.site or similar as intermediary
- webhook.site forwards to our Vercel endpoint

### Option 4: Use Vercel's Mumbai region specifically
In `vercel.json`:
```json
{
  "regions": ["bom1"]
}
```

### Option 5: Contact Shiprocket Support
- Email: integration@shiprocket.com
- Ask them to check if they can reach the endpoint from their servers
- They might need to whitelist the domain

---

## Current Webhook Code

**File**: `app/api/webhooks/tracking/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// CORS headers for webhook
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST handler - receives tracking updates
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = request.headers.get('x-api-key')
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 200, headers: corsHeaders })
    }

    const payload = await request.json()

    if (!payload.awb) {
      return NextResponse.json({ error: 'Missing AWB' }, { status: 200, headers: corsHeaders })
    }

    // Find and update order by AWB code
    // ... (order update logic)

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200, headers: corsHeaders }
    )
  }
}

// GET handler - health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is active'
  }, { headers: corsHeaders })
}
```

---

## Sample Shiprocket Webhook Payload

```json
{
  "awb": "19041424751540",
  "courier_name": "Delhivery Surface",
  "current_status": "IN TRANSIT",
  "current_status_id": 20,
  "shipment_status": "IN TRANSIT",
  "shipment_status_id": 18,
  "current_timestamp": "23 05 2023 11:43:52",
  "order_id": "1373900_150876814",
  "sr_order_id": 348456385,
  "awb_assigned_date": "2023-05-19 11:59:16",
  "pickup_scheduled_date": "2023-05-19 11:59:17",
  "etd": "2023-05-23 15:40:19",
  "scans": [...],
  "is_return": 0,
  "channel_id": 3422553,
  "pod_status": "OTP Based Delivery",
  "pod": "Not Available"
}
```

---

## Next Steps

1. Try adding `preferredRegion` to the route file
2. Redeploy to Vercel
3. Test webhook in Shiprocket again
4. If still failing, contact Shiprocket support with this documentation
