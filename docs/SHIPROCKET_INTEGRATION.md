# ShipRocket Integration Documentation

## Table of Contents

1. [Overview](#overview)
2. [ShipRocket API Reference](#shiprocket-api-reference)
3. [Current System Analysis](#current-system-analysis)
4. [Integration Architecture](#integration-architecture)
5. [Database Schema Changes](#database-schema-changes)
6. [API Routes Structure](#api-routes-structure)
7. [Implementation Components](#implementation-components)
8. [UI Components](#ui-components)
9. [Order Flow & Status Mapping](#order-flow--status-mapping)
10. [Configuration Guide](#configuration-guide)
11. [Implementation Phases](#implementation-phases)
12. [Error Handling](#error-handling)
13. [Testing Guide](#testing-guide)

---

## Overview

This document outlines the complete integration of ShipRocket shipping API with the Hot Wheels e-commerce platform. ShipRocket provides access to 17+ courier partners, automated shipping workflows, and real-time tracking capabilities.

### Key Features to Implement

- Real-time pincode serviceability check
- Dynamic shipping rate calculation
- Automated order creation in ShipRocket
- AWB (Air Waybill) generation
- Shipping label generation
- Pickup scheduling
- Real-time tracking via webhooks
- COD remittance handling
- Return order management

---

## ShipRocket API Reference

### Base URL

```
https://apiv2.shiprocket.in/v1/external
```

### Authentication

ShipRocket uses **Bearer Token authentication**.

#### Getting API Credentials

1. Navigate to ShipRocket Panel → Settings → API → Configure → Create An API User
2. Enter a unique email and password (different from main account)
3. Generate API credentials via: `https://app.shiprocket.in/api-user`

#### Authentication Endpoint

```http
POST /auth/login
Content-Type: application/json

{
  "email": "api_user@example.com",
  "password": "your_password"
}
```

#### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 123456,
  "first_name": "API",
  "last_name": "User",
  "email": "api_user@example.com",
  "company_id": 789
}
```

#### Token Details

| Property | Value |
|----------|-------|
| Validity | 240 hours (10 days) |
| Header Format | `Authorization: Bearer <token>` |
| Best Practice | Store in database, refresh before expiry |

---

### Core API Endpoints

#### 1. Check Serviceability

Check if delivery is available between two pincodes.

```http
GET /courier/serviceability/
Authorization: Bearer <token>

Query Parameters:
- pickup_postcode: string (origin pincode)
- delivery_postcode: string (destination pincode)
- weight: number (in kg)
- cod: 0 | 1 (1 for COD orders)
- declared_value: number (optional, order value)
```

#### Response

```json
{
  "status": 200,
  "data": {
    "available_courier_companies": [
      {
        "courier_company_id": 1,
        "courier_name": "Bluedart",
        "freight_charge": 85.50,
        "cod_charges": 35.00,
        "coverage_charges": 0,
        "estimated_delivery_days": "2-3",
        "etd": "2024-01-15",
        "rating": 4.5,
        "min_weight": 0.5,
        "rto_charges": 85.50,
        "is_surface": false,
        "is_rto_address_available": true
      },
      {
        "courier_company_id": 2,
        "courier_name": "Delhivery",
        "freight_charge": 65.00,
        "cod_charges": 30.00,
        "estimated_delivery_days": "3-4",
        "etd": "2024-01-16",
        "rating": 4.2
      }
    ],
    "currency": "INR"
  }
}
```

---

#### 2. Create Order

Create a new order in ShipRocket.

```http
POST /orders/create/adhoc
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Payload

```json
{
  "order_id": "ORD-12345",
  "order_date": "2024-01-10 14:30",
  "pickup_location": "Primary Warehouse",
  "channel_id": "",
  "comment": "Handle with care",

  "billing_customer_name": "John",
  "billing_last_name": "Doe",
  "billing_address": "123, Main Street, Sector 5",
  "billing_address_2": "Near City Mall",
  "billing_city": "Mumbai",
  "billing_pincode": "400001",
  "billing_state": "Maharashtra",
  "billing_country": "India",
  "billing_email": "john.doe@email.com",
  "billing_phone": "9876543210",
  "billing_alternate_phone": "",

  "shipping_is_billing": true,

  "shipping_customer_name": "John",
  "shipping_last_name": "Doe",
  "shipping_address": "123, Main Street, Sector 5",
  "shipping_address_2": "Near City Mall",
  "shipping_city": "Mumbai",
  "shipping_pincode": "400001",
  "shipping_state": "Maharashtra",
  "shipping_country": "India",
  "shipping_email": "john.doe@email.com",
  "shipping_phone": "9876543210",

  "order_items": [
    {
      "name": "Hot Wheels - '69 Camaro Z28",
      "sku": "HW-CAMARO-69-001",
      "units": 2,
      "selling_price": 299,
      "discount": 0,
      "tax": 0,
      "hsn": 9503
    },
    {
      "name": "Hot Wheels - Batmobile",
      "sku": "HW-BATMOBILE-001",
      "units": 1,
      "selling_price": 499,
      "discount": 50,
      "tax": 0,
      "hsn": 9503
    }
  ],

  "payment_method": "Prepaid",
  "shipping_charges": 0,
  "giftwrap_charges": 0,
  "transaction_charges": 0,
  "total_discount": 50,
  "sub_total": 1047,

  "length": 15,
  "breadth": 10,
  "height": 5,
  "weight": 0.3
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | string | Yes | Your unique order identifier |
| order_date | string | Yes | Format: "YYYY-MM-DD HH:mm" |
| pickup_location | string | Yes | Registered pickup location name |
| billing_customer_name | string | Yes | Customer first name |
| billing_last_name | string | No | Customer last name |
| billing_address | string | Yes | Address line 1 (max 80 chars) |
| billing_address_2 | string | No | Address line 2 (max 80 chars) |
| billing_city | string | Yes | City name (max 30 chars) |
| billing_pincode | string | Yes | 6-digit pincode |
| billing_state | string | Yes | Full state name |
| billing_country | string | Yes | "India" |
| billing_email | string | Yes | Valid email address |
| billing_phone | string | Yes | 10-digit phone number |
| shipping_is_billing | boolean | Yes | true if same as billing |
| order_items | array | Yes | Array of items |
| payment_method | string | Yes | "Prepaid" or "COD" |
| sub_total | number | Yes | Order subtotal |
| length | number | Yes | Package length in cm |
| breadth | number | Yes | Package breadth in cm |
| height | number | Yes | Package height in cm |
| weight | number | Yes | Package weight in kg |

#### Response

```json
{
  "order_id": 123456789,
  "shipment_id": 987654321,
  "status": "NEW",
  "status_code": 1,
  "onboarding_completed_now": 0,
  "awb_code": "",
  "courier_company_id": "",
  "courier_name": ""
}
```

---

#### 3. Generate AWB (Air Waybill)

Assign a courier and generate AWB for the shipment.

```http
POST /courier/assign/awb
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipment_id": 987654321,
  "courier_id": 1
}
```

#### Response

```json
{
  "response": {
    "data": {
      "awb_code": "12345678901",
      "courier_company_id": 1,
      "courier_name": "Bluedart",
      "assigned_date_time": {
        "date": "2024-01-10 15:00:00"
      }
    }
  }
}
```

---

#### 4. Schedule Pickup

Request pickup for the shipment.

```http
POST /courier/generate/pickup
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipment_id": [987654321]
}
```

#### Response

```json
{
  "pickup_status": 1,
  "response": {
    "pickup_scheduled_date": "2024-01-11",
    "pickup_token_number": "PKP123456",
    "status": 1,
    "others": "",
    "pickup_generated_date": {
      "date": "2024-01-10 15:30:00"
    }
  }
}
```

---

#### 5. Generate Shipping Label

Generate printable shipping label.

```http
POST /courier/generate/label
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipment_id": [987654321]
}
```

#### Response

```json
{
  "label_created": 1,
  "response": "success",
  "label_url": "https://shiprocket-labels.s3.amazonaws.com/...",
  "not_created": []
}
```

---

#### 6. Generate Manifest

Generate manifest for handover to courier.

```http
POST /manifests/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipment_id": [987654321]
}
```

#### Response

```json
{
  "manifest_url": "https://shiprocket-manifests.s3.amazonaws.com/..."
}
```

---

#### 7. Track Shipment

Track shipment by AWB or shipment ID.

```http
GET /courier/track/awb/{awb_code}
Authorization: Bearer <token>
```

OR

```http
GET /courier/track/shipment/{shipment_id}
Authorization: Bearer <token>
```

#### Response

```json
{
  "tracking_data": {
    "track_status": 1,
    "shipment_status": 7,
    "shipment_status_id": 7,
    "shipment_track": [
      {
        "id": 1,
        "awb_code": "12345678901",
        "courier_company_id": 1,
        "shipment_id": 987654321,
        "order_id": 123456789,
        "pickup_date": "2024-01-11",
        "delivered_date": "",
        "weight": "0.30",
        "packages": 1,
        "current_status": "In Transit",
        "delivered_to": "",
        "destination": "Mumbai",
        "consignee_name": "John Doe",
        "origin": "Delhi",
        "courier_agent_details": null,
        "edd": "2024-01-14"
      }
    ],
    "shipment_track_activities": [
      {
        "date": "2024-01-11 10:30:00",
        "status": "Picked Up",
        "activity": "Shipment picked up from seller",
        "location": "Delhi Hub",
        "sr-status": "6",
        "sr-status-label": "PICKED UP"
      },
      {
        "date": "2024-01-11 18:00:00",
        "status": "In Transit",
        "activity": "Shipment in transit to destination",
        "location": "Delhi Airport",
        "sr-status": "18",
        "sr-status-label": "IN TRANSIT"
      }
    ],
    "track_url": "https://shiprocket.co/tracking/12345678901",
    "etd": "2024-01-14 23:59:00"
  }
}
```

---

#### 8. Cancel Order

Cancel a ShipRocket order.

```http
POST /orders/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [123456789]
}
```

#### Response

```json
{
  "status": 200,
  "message": "Order(s) cancelled successfully"
}
```

---

#### 9. Create Return Order

Create a return/reverse pickup order.

```http
POST /orders/create/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": "RET-12345",
  "order_date": "2024-01-15 10:00",
  "pickup_customer_name": "John Doe",
  "pickup_address": "123, Main Street",
  "pickup_city": "Mumbai",
  "pickup_state": "Maharashtra",
  "pickup_pincode": "400001",
  "pickup_phone": "9876543210",
  "shipping_customer_name": "Hot Wheels Store",
  "shipping_address": "Warehouse Address",
  "shipping_city": "Delhi",
  "shipping_state": "Delhi",
  "shipping_pincode": "110001",
  "shipping_phone": "9876543210",
  "order_items": [...],
  "payment_method": "Prepaid",
  "sub_total": 1047,
  "length": 15,
  "breadth": 10,
  "height": 5,
  "weight": 0.3
}
```

---

### Webhook Events

ShipRocket sends webhook notifications for shipment status updates.

#### Webhook Payload Structure

```json
{
  "awb": "12345678901",
  "courier_name": "Bluedart",
  "current_status": "Delivered",
  "current_status_id": 7,
  "shipment_status": "DELIVERED",
  "shipment_status_id": 7,
  "order_id": "ORD-12345",
  "sr_order_id": 123456789,
  "scans": [
    {
      "date": "2024-01-14 14:30:00",
      "activity": "Delivered to consignee",
      "location": "Mumbai"
    }
  ],
  "etd": "2024-01-14",
  "delivered_date": "2024-01-14 14:30:00"
}
```

#### Status Codes Reference

| Status ID | Status | Description |
|-----------|--------|-------------|
| 1 | AWB Assigned | AWB number assigned |
| 2 | Label Generated | Shipping label created |
| 3 | Pickup Scheduled | Pickup requested |
| 4 | Pickup Queued | Pickup in queue |
| 5 | Manifest Generated | Manifest created |
| 6 | Picked Up | Shipment picked up |
| 7 | Delivered | Successfully delivered |
| 8 | Cancelled | Order cancelled |
| 9 | RTO Initiated | Return to origin started |
| 10 | RTO Delivered | Returned to seller |
| 17 | Out For Delivery | With delivery agent |
| 18 | In Transit | Shipment moving |
| 19 | Lost | Shipment lost |
| 20 | Pickup Error | Pickup failed |
| 21 | RTO Acknowledged | RTO accepted |
| 22 | Pickup Rescheduled | New pickup date |
| 23 | Cancellation Requested | Cancel in progress |
| 38 | Reached Destination Hub | At final hub |
| 39 | Misrouted | Wrong routing |
| 40 | RTO In Transit | Return shipment moving |
| 41 | Disposed Off | Shipment disposed |
| 42 | Customs Cleared | International cleared |
| 43 | RTO_OFD | RTO out for delivery |
| 44 | RTO_NDR | RTO not delivered |
| 45 | Self Fulfilled | Fulfilled by seller |
| 46 | Delayed | Shipment delayed |
| 47 | Partially Delivered | Some items delivered |
| 48 | Fulfilled | Order completed |

---

## Current System Analysis

### Existing Order Structure

**Order Table Fields:**
```typescript
{
  id: string                    // UUID primary key
  user_id: string               // Reference to users table
  status: OrderStatus           // pending | confirmed | processing | shipped | delivered | cancelled
  payment_status: PaymentStatus // pending | verification_pending | verified | failed | cod
  payment_method: PaymentMethod // cod | online
  transaction_id: string | null
  payment_screenshot: string | null
  total: number
  discount_amount: number
  shipping_address: {           // JSONB
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  shipping_charges: number | null
  shipping_payment_screenshot: string | null
  shipping_payment_status: 'pending' | 'verified' | null
  created_at: string
  updated_at: string
}
```

### Existing Product Structure

```typescript
{
  id: string
  name: string
  series: string
  price: number
  year: number
  color: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Treasure Hunt'
  image: string
  images: string[] | null
  rating: number
  review_count: number
  description: string | null
  stock: number
  featured: boolean
  created_at: string
  updated_at: string
}
```

### Current Checkout Flow

1. User enters shipping details (name, email, phone, address, city, state, pincode)
2. User selects payment method (COD or Online)
3. If COD and shipping collection enabled, user pays shipping upfront
4. If Online, user scans QR, enters transaction ID and uploads screenshot
5. Order created with `status: 'pending'`
6. Admin verifies payment and updates status

### Missing for ShipRocket Integration

1. **Product dimensions and weight** - Not currently stored
2. **ShipRocket order tracking fields** - Need to add
3. **Pickup location configuration** - Need to add
4. **Real-time serviceability check** - Not implemented
5. **Automated courier assignment** - Not implemented
6. **Tracking webhooks** - Not implemented

---

## Integration Architecture

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORDER PLACEMENT FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Customer Checkout                                                           │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐   │
│  │ Enter Pincode   │────▶│ Check Shiprocket │────▶│ Show Available      │   │
│  │                 │     │ Serviceability   │     │ Couriers & Rates    │   │
│  └─────────────────┘     └──────────────────┘     └─────────────────────┘   │
│                                                              │               │
│                                                              ▼               │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐   │
│  │ Order Created   │◀────│ Select Courier   │◀────│ Complete Address    │   │
│  │ (status:pending)│     │ (optional)       │     │ & Payment           │   │
│  └────────┬────────┘     └──────────────────┘     └─────────────────────┘   │
│           │                                                                  │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN FULFILLMENT FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐   │
│  │ Verify Payment  │────▶│ Create Shiprocket│────▶│ Assign AWB &        │   │
│  │ (if online)     │     │ Order            │     │ Courier             │   │
│  └─────────────────┘     └──────────────────┘     └─────────────────────┘   │
│                                                              │               │
│                                                              ▼               │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐   │
│  │ Order Shipped   │◀────│ Generate Label   │◀────│ Schedule Pickup     │   │
│  │                 │     │ & Manifest       │     │                     │   │
│  └────────┬────────┘     └──────────────────┘     └─────────────────────┘   │
│           │                                                                  │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TRACKING & DELIVERY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐   │
│  │ Webhook Updates │────▶│ Update Order     │────▶│ Customer            │   │
│  │ from Shiprocket │     │ Status           │     │ Notification        │   │
│  └─────────────────┘     └──────────────────┘     └─────────────────────┘   │
│                                                                              │
│  Customer can track: /orders/[id]/track ──▶ Shiprocket Tracking API         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         FRONTEND (Next.js)                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │  Checkout   │  │   Admin     │  │  Tracking   │  │   Orders   │  │    │
│  │  │  Page       │  │   Panel     │  │   Page      │  │   Page     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          API ROUTES (Next.js)                        │    │
│  │  ┌──────────────────────┐     ┌──────────────────────────────────┐  │    │
│  │  │  /api/shiprocket/*   │     │  /api/admin/shiprocket/*         │  │    │
│  │  │  - serviceability    │     │  - settings                      │  │    │
│  │  │  - rates             │     │  - orders/create                 │  │    │
│  │  │  - webhook           │     │  - orders/[id]/awb               │  │    │
│  │  └──────────────────────┘     │  - orders/[id]/pickup            │  │    │
│  │                               │  - orders/[id]/label             │  │    │
│  │                               │  - orders/[id]/track             │  │    │
│  │                               └──────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      SHIPROCKET SERVICE LAYER                        │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  ShipRocketClient (/lib/shiprocket/client.ts)                 │  │    │
│  │  │  - authenticate()      - createOrder()     - trackByAWB()     │  │    │
│  │  │  - getValidToken()     - generateAWB()     - cancelOrder()    │  │    │
│  │  │  - checkServiceability()  - schedulePickup()                  │  │    │
│  │  │  - generateLabel()     - generateManifest()                   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│           ┌──────────────────────────┴───────────────────────┐              │
│           ▼                                                  ▼              │
│  ┌─────────────────────────┐               ┌─────────────────────────────┐  │
│  │     SUPABASE DATABASE   │               │     SHIPROCKET API          │  │
│  │  ┌───────────────────┐  │               │  https://apiv2.shiprocket.  │  │
│  │  │ orders            │  │               │           in/v1/external    │  │
│  │  │ shiprocket_settings│ │               └─────────────────────────────┘  │
│  │  │ shipping_tracking │  │                                                │
│  │  └───────────────────┘  │                                                │
│  └─────────────────────────┘                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### 1. Modify `orders` Table

Add new columns for ShipRocket integration:

```sql
-- Add ShipRocket related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_awb_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_courier_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_scheduled_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_awb ON orders(shiprocket_awb_code);
```

### 2. Create `shiprocket_settings` Table

Store ShipRocket API configuration:

```sql
CREATE TABLE IF NOT EXISTS shiprocket_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- API Credentials
  api_email TEXT NOT NULL,
  api_password TEXT NOT NULL,
  auth_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Pickup Location (Primary)
  pickup_location_name TEXT NOT NULL DEFAULT 'Primary Warehouse',
  pickup_address TEXT NOT NULL,
  pickup_address_2 TEXT,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_pincode TEXT NOT NULL,
  pickup_phone TEXT NOT NULL,
  pickup_email TEXT,

  -- Settings
  enabled BOOLEAN DEFAULT false,
  auto_assign_courier BOOLEAN DEFAULT true,
  preferred_courier_id INTEGER,
  auto_create_order BOOLEAN DEFAULT false,
  auto_schedule_pickup BOOLEAN DEFAULT false,

  -- Default Package Dimensions (for Hot Wheels)
  default_length DECIMAL(10,2) DEFAULT 15,
  default_breadth DECIMAL(10,2) DEFAULT 10,
  default_height DECIMAL(10,2) DEFAULT 5,
  default_weight DECIMAL(10,3) DEFAULT 0.1,

  -- Webhook
  webhook_secret TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one settings row
CREATE UNIQUE INDEX IF NOT EXISTS idx_shiprocket_settings_singleton ON shiprocket_settings ((true));

-- RLS Policies
ALTER TABLE shiprocket_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to manage shiprocket settings"
ON shiprocket_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

### 3. Create `shipping_tracking` Table

Store tracking events from webhooks:

```sql
CREATE TABLE IF NOT EXISTS shipping_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  awb_code TEXT NOT NULL,

  -- Status Information
  status TEXT NOT NULL,
  status_code INTEGER,
  status_id INTEGER,

  -- Event Details
  activity TEXT,
  location TEXT,
  event_time TIMESTAMPTZ,
  remarks TEXT,

  -- Raw Payload (for debugging)
  raw_payload JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_order_id ON shipping_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_awb ON shipping_tracking(awb_code);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_event_time ON shipping_tracking(event_time DESC);

-- RLS Policies
ALTER TABLE shipping_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own order tracking
CREATE POLICY "Users can view own order tracking"
ON shipping_tracking
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = shipping_tracking.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Admins can view all tracking
CREATE POLICY "Admins can view all tracking"
ON shipping_tracking
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Service role can insert (for webhooks)
CREATE POLICY "Service role can insert tracking"
ON shipping_tracking
FOR INSERT
TO service_role
WITH CHECK (true);
```

### 4. Modify `products` Table (Optional)

Add weight and dimensions if you want per-product shipping calculations:

```sql
-- Optional: Add shipping dimensions to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) DEFAULT 0.1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS breadth DECIMAL(10,2) DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT '9503';
```

### Complete Migration Script

```sql
-- ============================================
-- SHIPROCKET INTEGRATION MIGRATION
-- ============================================

-- 1. Add columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_awb_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_courier_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_scheduled_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_token TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_awb ON orders(shiprocket_awb_code);

-- 2. Create shiprocket_settings table
CREATE TABLE IF NOT EXISTS shiprocket_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_email TEXT NOT NULL,
  api_password TEXT NOT NULL,
  auth_token TEXT,
  token_expires_at TIMESTAMPTZ,
  pickup_location_name TEXT NOT NULL DEFAULT 'Primary Warehouse',
  pickup_address TEXT NOT NULL,
  pickup_address_2 TEXT,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_pincode TEXT NOT NULL,
  pickup_phone TEXT NOT NULL,
  pickup_email TEXT,
  enabled BOOLEAN DEFAULT false,
  auto_assign_courier BOOLEAN DEFAULT true,
  preferred_courier_id INTEGER,
  auto_create_order BOOLEAN DEFAULT false,
  auto_schedule_pickup BOOLEAN DEFAULT false,
  default_length DECIMAL(10,2) DEFAULT 15,
  default_breadth DECIMAL(10,2) DEFAULT 10,
  default_height DECIMAL(10,2) DEFAULT 5,
  default_weight DECIMAL(10,3) DEFAULT 0.1,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shiprocket_settings_singleton ON shiprocket_settings ((true));

ALTER TABLE shiprocket_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to manage shiprocket settings"
ON shiprocket_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 3. Create shipping_tracking table
CREATE TABLE IF NOT EXISTS shipping_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  awb_code TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INTEGER,
  status_id INTEGER,
  activity TEXT,
  location TEXT,
  event_time TIMESTAMPTZ,
  remarks TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_tracking_order_id ON shipping_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_awb ON shipping_tracking(awb_code);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_event_time ON shipping_tracking(event_time DESC);

ALTER TABLE shipping_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order tracking"
ON shipping_tracking FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = shipping_tracking.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Admins can view all tracking"
ON shipping_tracking FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 4. Optional: Add product dimensions
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) DEFAULT 0.1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS breadth DECIMAL(10,2) DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT '9503';
```

---

## API Routes Structure

### Directory Structure

```
app/
├── api/
│   ├── shiprocket/
│   │   ├── serviceability/
│   │   │   └── route.ts          # Check pincode serviceability
│   │   ├── rates/
│   │   │   └── route.ts          # Get shipping rates
│   │   ├── track/
│   │   │   └── [awb]/
│   │   │       └── route.ts      # Public tracking by AWB
│   │   └── webhook/
│   │       └── route.ts          # Webhook handler
│   │
│   └── admin/
│       └── shiprocket/
│           ├── settings/
│           │   └── route.ts      # GET/PUT settings
│           ├── orders/
│           │   ├── route.ts      # List orders with SR status
│           │   └── [orderId]/
│           │       ├── create/
│           │       │   └── route.ts  # Create SR order
│           │       ├── awb/
│           │       │   └── route.ts  # Generate AWB
│           │       ├── pickup/
│           │       │   └── route.ts  # Schedule pickup
│           │       ├── label/
│           │       │   └── route.ts  # Generate label
│           │       ├── manifest/
│           │       │   └── route.ts  # Generate manifest
│           │       ├── track/
│           │       │   └── route.ts  # Get tracking details
│           │       └── cancel/
│           │           └── route.ts  # Cancel shipment
│           └── couriers/
│               └── route.ts      # List available couriers
```

### API Endpoint Specifications

#### Public Endpoints

##### 1. Check Serviceability

```typescript
// POST /api/shiprocket/serviceability
// Check if delivery is available to a pincode

Request:
{
  deliveryPincode: string      // Required: 6-digit destination pincode
  weight?: number              // Optional: Package weight in kg (default from settings)
  isCOD?: boolean              // Optional: Is COD order (default: false)
  declaredValue?: number       // Optional: Order value for insurance
}

Response (Success):
{
  success: true
  available: true
  couriers: [
    {
      id: number
      name: string
      freightCharge: number
      codCharges: number
      estimatedDays: string
      etd: string              // Estimated delivery date
      rating: number
      isSurface: boolean
    }
  ]
  cheapest: { id, name, charge }
  fastest: { id, name, days }
}

Response (Not Available):
{
  success: true
  available: false
  message: "Delivery not available to this pincode"
}
```

##### 2. Get Shipping Rates

```typescript
// POST /api/shiprocket/rates
// Get detailed shipping rates for order

Request:
{
  deliveryPincode: string
  items: [
    { quantity: number, weight?: number }
  ]
  isCOD: boolean
  declaredValue: number
}

Response:
{
  success: true
  rates: [
    {
      courierId: number
      courierName: string
      freight: number
      cod: number
      total: number
      estimatedDays: string
      etd: string
    }
  ]
  recommended: {
    courierId: number
    courierName: string
    total: number
    reason: "cheapest" | "fastest" | "best_rated"
  }
}
```

##### 3. Public Tracking

```typescript
// GET /api/shiprocket/track/[awb]
// Get tracking information by AWB

Response:
{
  success: true
  tracking: {
    awb: string
    courier: string
    status: string
    currentLocation: string
    estimatedDelivery: string
    deliveredAt: string | null
    events: [
      {
        date: string
        time: string
        status: string
        activity: string
        location: string
      }
    ]
  }
}
```

##### 4. Webhook Handler

```typescript
// POST /api/shiprocket/webhook
// Handle ShipRocket status updates

Headers:
{
  "X-Shiprocket-Signature": string  // HMAC signature for verification
}

Request: ShipRocket webhook payload

Response:
{
  success: true
  message: "Webhook processed"
}

// Internal processing:
// 1. Verify signature
// 2. Find order by SR order ID or AWB
// 3. Update order status
// 4. Log tracking event
// 5. (Optional) Send customer notification
```

#### Admin Endpoints

##### 1. Settings Management

```typescript
// GET /api/admin/shiprocket/settings
// Get current ShipRocket settings

Response:
{
  success: true
  settings: {
    enabled: boolean
    pickupLocation: {
      name: string
      address: string
      city: string
      state: string
      pincode: string
      phone: string
    }
    autoAssignCourier: boolean
    preferredCourierId: number | null
    defaultDimensions: {
      length: number
      breadth: number
      height: number
      weight: number
    }
    hasCredentials: boolean      // Don't expose actual credentials
    tokenValid: boolean
    tokenExpiresAt: string | null
  }
}

// PUT /api/admin/shiprocket/settings
// Update ShipRocket settings

Request:
{
  apiEmail?: string
  apiPassword?: string
  enabled?: boolean
  pickupLocation?: { ... }
  autoAssignCourier?: boolean
  preferredCourierId?: number
  defaultDimensions?: { ... }
}
```

##### 2. Create ShipRocket Order

```typescript
// POST /api/admin/shiprocket/orders/[orderId]/create
// Create order in ShipRocket

Response:
{
  success: true
  shiprocket: {
    orderId: number
    shipmentId: number
    status: string
  }
}

// Errors:
// - 400: Order already has ShipRocket ID
// - 400: Order not in valid status for shipping
// - 404: Order not found
// - 500: ShipRocket API error
```

##### 3. Generate AWB

```typescript
// POST /api/admin/shiprocket/orders/[orderId]/awb
// Assign courier and generate AWB

Request:
{
  courierId?: number    // Optional: specific courier, otherwise auto-assign
}

Response:
{
  success: true
  awb: {
    code: string
    courierId: number
    courierName: string
    assignedAt: string
  }
}
```

##### 4. Schedule Pickup

```typescript
// POST /api/admin/shiprocket/orders/[orderId]/pickup
// Schedule pickup for shipment

Response:
{
  success: true
  pickup: {
    scheduledDate: string
    tokenNumber: string
    status: string
  }
}
```

##### 5. Generate Label

```typescript
// GET /api/admin/shiprocket/orders/[orderId]/label
// Generate and get shipping label

Response:
{
  success: true
  label: {
    url: string           // Direct download URL
    generated: boolean
  }
}
```

##### 6. Get Tracking Details

```typescript
// GET /api/admin/shiprocket/orders/[orderId]/track
// Get detailed tracking for admin

Response:
{
  success: true
  tracking: {
    awb: string
    courier: string
    currentStatus: string
    pickupDate: string
    deliveredDate: string | null
    estimatedDelivery: string
    events: [...]
    trackingUrl: string
  }
}
```

##### 7. Cancel Shipment

```typescript
// POST /api/admin/shiprocket/orders/[orderId]/cancel
// Cancel ShipRocket shipment

Response:
{
  success: true
  message: "Shipment cancelled successfully"
}
```

---

## Implementation Components

### 1. ShipRocket Client Service

```typescript
// /lib/shiprocket/client.ts

import { createClient } from '@supabase/supabase-js'

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

// Types
interface ShipRocketConfig {
  email: string
  password: string
}

interface CourierOption {
  courier_company_id: number
  courier_name: string
  freight_charge: number
  cod_charges: number
  estimated_delivery_days: string
  etd: string
  rating: number
  min_weight: number
  rto_charges: number
  is_surface: boolean
}

interface ServiceabilityResponse {
  available: boolean
  couriers: CourierOption[]
}

interface CreateOrderPayload {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
    discount: number
    tax: number
    hsn: number
  }>
  payment_method: 'Prepaid' | 'COD'
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

interface CreateOrderResponse {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
}

interface AWBResponse {
  awb_code: string
  courier_company_id: number
  courier_name: string
  assigned_date_time: string
}

interface TrackingEvent {
  date: string
  status: string
  activity: string
  location: string
}

interface TrackingResponse {
  awb: string
  courier: string
  current_status: string
  current_status_id: number
  shipment_status: string
  events: TrackingEvent[]
  etd: string
  delivered_date: string | null
}

export class ShipRocketClient {
  private token: string | null = null
  private tokenExpiry: Date | null = null

  constructor(private config: ShipRocketConfig) {}

  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Authenticate with ShipRocket API
   */
  async authenticate(): Promise<string> {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    this.token = data.token

    // Token valid for 10 days (240 hours)
    this.tokenExpiry = new Date(Date.now() + 240 * 60 * 60 * 1000)

    return this.token
  }

  /**
   * Get valid token, refreshing if needed
   */
  async getValidToken(): Promise<string> {
    // Check if token is valid (with 1 hour buffer)
    const bufferTime = 60 * 60 * 1000 // 1 hour
    const isExpired = !this.token ||
      !this.tokenExpiry ||
      this.tokenExpiry.getTime() - Date.now() < bufferTime

    if (isExpired) {
      await this.authenticate()
    }

    return this.token!
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getValidToken()

    const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || `API request failed: ${response.status}`
      )
    }

    return response.json()
  }

  // ============================================
  // SERVICEABILITY
  // ============================================

  /**
   * Check if delivery is available between pincodes
   */
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    isCOD: boolean = false,
    declaredValue?: number
  ): Promise<ServiceabilityResponse> {
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: weight.toString(),
      cod: isCOD ? '1' : '0',
    })

    if (declaredValue) {
      params.append('declared_value', declaredValue.toString())
    }

    const response = await this.request<{
      data: { available_courier_companies: CourierOption[] }
    }>(`/courier/serviceability/?${params}`)

    const couriers = response.data?.available_courier_companies || []

    return {
      available: couriers.length > 0,
      couriers,
    }
  }

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  /**
   * Create order in ShipRocket
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderIds: number[]): Promise<void> {
    await this.request('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: orderIds }),
    })
  }

  // ============================================
  // AWB & SHIPPING
  // ============================================

  /**
   * Generate AWB and assign courier
   */
  async generateAWB(
    shipmentId: number,
    courierId?: number
  ): Promise<AWBResponse> {
    const body: { shipment_id: number; courier_id?: number } = {
      shipment_id: shipmentId,
    }

    if (courierId) {
      body.courier_id = courierId
    }

    const response = await this.request<{
      response: { data: AWBResponse }
    }>('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return response.response.data
  }

  /**
   * Schedule pickup
   */
  async schedulePickup(shipmentIds: number[]): Promise<{
    pickup_scheduled_date: string
    pickup_token_number: string
  }> {
    const response = await this.request<{
      response: {
        pickup_scheduled_date: string
        pickup_token_number: string
      }
    }>('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    })

    return response.response
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentIds: number[]): Promise<string> {
    const response = await this.request<{
      label_url: string
    }>('/courier/generate/label', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    })

    return response.label_url
  }

  /**
   * Generate manifest
   */
  async generateManifest(shipmentIds: number[]): Promise<string> {
    const response = await this.request<{
      manifest_url: string
    }>('/manifests/generate', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    })

    return response.manifest_url
  }

  // ============================================
  // TRACKING
  // ============================================

  /**
   * Track shipment by AWB
   */
  async trackByAWB(awbCode: string): Promise<TrackingResponse> {
    const response = await this.request<{
      tracking_data: {
        track_status: number
        shipment_track: Array<{
          awb_code: string
          courier_company_id: number
          current_status: string
          edd: string
          delivered_date: string | null
        }>
        shipment_track_activities: TrackingEvent[]
        track_url: string
      }
    }>(`/courier/track/awb/${awbCode}`)

    const track = response.tracking_data.shipment_track[0]

    return {
      awb: track.awb_code,
      courier: '',
      current_status: track.current_status,
      current_status_id: 0,
      shipment_status: track.current_status,
      events: response.tracking_data.shipment_track_activities,
      etd: track.edd,
      delivered_date: track.delivered_date,
    }
  }

  /**
   * Track shipment by Shipment ID
   */
  async trackByShipmentId(shipmentId: number): Promise<TrackingResponse> {
    const response = await this.request<{
      tracking_data: {
        shipment_track: Array<{
          awb_code: string
          current_status: string
          edd: string
          delivered_date: string | null
        }>
        shipment_track_activities: TrackingEvent[]
      }
    }>(`/courier/track/shipment/${shipmentId}`)

    const track = response.tracking_data.shipment_track[0]

    return {
      awb: track.awb_code,
      courier: '',
      current_status: track.current_status,
      current_status_id: 0,
      shipment_status: track.current_status,
      events: response.tracking_data.shipment_track_activities,
      etd: track.edd,
      delivered_date: track.delivered_date,
    }
  }

  // ============================================
  // RETURNS
  // ============================================

  /**
   * Create return order
   */
  async createReturnOrder(payload: {
    order_id: string
    order_date: string
    pickup_customer_name: string
    pickup_address: string
    pickup_city: string
    pickup_state: string
    pickup_pincode: string
    pickup_phone: string
    shipping_customer_name: string
    shipping_address: string
    shipping_city: string
    shipping_state: string
    shipping_pincode: string
    shipping_phone: string
    order_items: Array<{
      name: string
      sku: string
      units: number
      selling_price: number
    }>
    payment_method: 'Prepaid'
    sub_total: number
    length: number
    breadth: number
    height: number
    weight: number
  }): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/orders/create/return', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let clientInstance: ShipRocketClient | null = null

export async function getShipRocketClient(): Promise<ShipRocketClient> {
  if (clientInstance) {
    return clientInstance
  }

  // Fetch credentials from database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: settings, error } = await supabase
    .from('shiprocket_settings')
    .select('api_email, api_password, auth_token, token_expires_at')
    .single()

  if (error || !settings) {
    throw new Error('ShipRocket settings not configured')
  }

  clientInstance = new ShipRocketClient({
    email: settings.api_email,
    password: settings.api_password,
  })

  // If we have a cached token that's still valid, use it
  if (settings.auth_token && settings.token_expires_at) {
    const expiry = new Date(settings.token_expires_at)
    if (expiry > new Date()) {
      (clientInstance as any).token = settings.auth_token
      (clientInstance as any).tokenExpiry = expiry
    }
  }

  return clientInstance
}

// Reset client (useful when settings change)
export function resetShipRocketClient(): void {
  clientInstance = null
}
```

### 2. TypeScript Types

```typescript
// /lib/shiprocket/types.ts

// ============================================
// API Response Types
// ============================================

export interface ShipRocketAuthResponse {
  token: string
  id: number
  first_name: string
  last_name: string
  email: string
  company_id: number
}

export interface CourierCompany {
  courier_company_id: number
  courier_name: string
  freight_charge: number
  cod_charges: number
  coverage_charges: number
  estimated_delivery_days: string
  etd: string
  rating: number
  min_weight: number
  rto_charges: number
  is_surface: boolean
  is_rto_address_available: boolean
  blocked: number
  charge_weight: number
  city: string
  state: string
  postcode: string
  region: number
  delivery_performance: number
  pickup_performance: number
  is_custom: number
  pod_available: number
  qc_courier: number
  call_before_delivery: number
  seconds: number
  mode: number
  suppress_date: string
  suppress_text: string
  recommended_by: {
    id: number
    title: string
  }
}

export interface ServiceabilityData {
  available_courier_companies: CourierCompany[]
  currency: string
  is_recommendation_enabled: boolean
}

export interface OrderItem {
  name: string
  sku: string
  units: number
  selling_price: number
  discount?: number
  tax?: number
  hsn?: number
}

export interface CreateOrderRequest {
  order_id: string
  order_date: string
  pickup_location: string
  channel_id?: string
  comment?: string
  reseller_name?: string
  company_name?: string
  billing_customer_name: string
  billing_last_name?: string
  billing_address: string
  billing_address_2?: string
  billing_isd_code?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  billing_alternate_phone?: string
  shipping_is_billing: boolean
  shipping_customer_name?: string
  shipping_last_name?: string
  shipping_address?: string
  shipping_address_2?: string
  shipping_city?: string
  shipping_pincode?: string
  shipping_country?: string
  shipping_state?: string
  shipping_email?: string
  shipping_phone?: string
  order_items: OrderItem[]
  payment_method: 'Prepaid' | 'COD'
  shipping_charges?: number
  giftwrap_charges?: number
  transaction_charges?: number
  total_discount?: number
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
  ewaybill_no?: string
  customer_gstin?: string
  invoice_number?: string
  order_type?: string
}

export interface CreateOrderResponse {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
  onboarding_completed_now: number
  awb_code: string
  courier_company_id: string
  courier_name: string
}

export interface AWBAssignResponse {
  response: {
    data: {
      awb_code: string
      courier_company_id: number
      courier_name: string
      assigned_date_time: {
        date: string
        timezone_type: number
        timezone: string
      }
      routing_code: string
      pickup_scheduled_date: string
      applied_weight: number
      is_custom: number
    }
  }
}

export interface PickupResponse {
  pickup_status: number
  response: {
    pickup_scheduled_date: string
    pickup_token_number: string
    status: number
    others: string
    pickup_generated_date: {
      date: string
    }
  }
}

export interface LabelResponse {
  label_created: number
  response: string
  label_url: string
  not_created: any[]
}

export interface ManifestResponse {
  manifest_url: string
}

export interface TrackingActivity {
  date: string
  status: string
  activity: string
  location: string
  'sr-status': string
  'sr-status-label': string
}

export interface ShipmentTrack {
  id: number
  awb_code: string
  courier_company_id: number
  shipment_id: number
  order_id: number
  pickup_date: string
  delivered_date: string | null
  weight: string
  packages: number
  current_status: string
  delivered_to: string
  destination: string
  consignee_name: string
  origin: string
  courier_agent_details: any
  edd: string
}

export interface TrackingData {
  track_status: number
  shipment_status: number
  shipment_status_id: number
  shipment_track: ShipmentTrack[]
  shipment_track_activities: TrackingActivity[]
  track_url: string
  etd: string
  qc_response: any
}

export interface TrackingResponse {
  tracking_data: TrackingData
}

// ============================================
// Webhook Types
// ============================================

export interface WebhookPayload {
  awb: string
  courier_name: string
  current_status: string
  current_status_id: number
  shipment_status: string
  shipment_status_id: number
  order_id: string
  sr_order_id: number
  etd: string
  delivered_date: string | null
  scans: Array<{
    date: string
    activity: string
    location: string
  }>
}

// ============================================
// Internal Types
// ============================================

export interface ShipRocketSettings {
  id: string
  api_email: string
  api_password: string
  auth_token: string | null
  token_expires_at: string | null
  pickup_location_name: string
  pickup_address: string
  pickup_address_2: string | null
  pickup_city: string
  pickup_state: string
  pickup_pincode: string
  pickup_phone: string
  pickup_email: string | null
  enabled: boolean
  auto_assign_courier: boolean
  preferred_courier_id: number | null
  auto_create_order: boolean
  auto_schedule_pickup: boolean
  default_length: number
  default_breadth: number
  default_height: number
  default_weight: number
  webhook_secret: string | null
  created_at: string
  updated_at: string
}

export interface ShippingTrackingEvent {
  id: string
  order_id: string
  awb_code: string
  status: string
  status_code: number | null
  status_id: number | null
  activity: string | null
  location: string | null
  event_time: string | null
  remarks: string | null
  raw_payload: any
  created_at: string
}

// ============================================
// Status Mappings
// ============================================

export const SHIPROCKET_STATUS_MAP: Record<number, string> = {
  1: 'AWB_ASSIGNED',
  2: 'LABEL_GENERATED',
  3: 'PICKUP_SCHEDULED',
  4: 'PICKUP_QUEUED',
  5: 'MANIFEST_GENERATED',
  6: 'PICKED_UP',
  7: 'DELIVERED',
  8: 'CANCELLED',
  9: 'RTO_INITIATED',
  10: 'RTO_DELIVERED',
  17: 'OUT_FOR_DELIVERY',
  18: 'IN_TRANSIT',
  19: 'LOST',
  20: 'PICKUP_ERROR',
  21: 'RTO_ACKNOWLEDGED',
  22: 'PICKUP_RESCHEDULED',
  38: 'REACHED_DESTINATION_HUB',
  40: 'RTO_IN_TRANSIT',
  43: 'RTO_OFD',
  44: 'RTO_NDR',
}

export const ORDER_STATUS_FROM_SHIPROCKET: Record<string, string> = {
  'PICKED_UP': 'shipped',
  'IN_TRANSIT': 'shipped',
  'OUT_FOR_DELIVERY': 'shipped',
  'REACHED_DESTINATION_HUB': 'shipped',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
  'RTO_INITIATED': 'cancelled',
  'RTO_DELIVERED': 'cancelled',
  'LOST': 'cancelled',
}
```

### 3. Utility Functions

```typescript
// /lib/shiprocket/utils.ts

import { format } from 'date-fns'

/**
 * Format date for ShipRocket API
 */
export function formatOrderDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd HH:mm')
}

/**
 * Generate unique order ID for ShipRocket
 */
export function generateShipRocketOrderId(orderId: string): string {
  // ShipRocket requires alphanumeric order IDs
  // Remove any special characters and add prefix
  const cleanId = orderId.replace(/[^a-zA-Z0-9]/g, '')
  return `HW-${cleanId}`
}

/**
 * Calculate total weight for order items
 */
export function calculateOrderWeight(
  items: Array<{ quantity: number; weight?: number }>,
  defaultWeight: number = 0.1
): number {
  return items.reduce((total, item) => {
    const itemWeight = item.weight || defaultWeight
    return total + (itemWeight * item.quantity)
  }, 0)
}

/**
 * Calculate package dimensions based on quantity
 */
export function calculatePackageDimensions(
  itemCount: number,
  defaults: { length: number; breadth: number; height: number }
): { length: number; breadth: number; height: number } {
  // For Hot Wheels, items can be stacked
  // Adjust height based on quantity
  const baseHeight = defaults.height
  const stackMultiplier = Math.ceil(itemCount / 4) // 4 items per layer

  return {
    length: defaults.length,
    breadth: defaults.breadth,
    height: baseHeight * stackMultiplier,
  }
}

/**
 * Split full name into first and last name
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(' ')

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * Validate Indian pincode
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode)
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces and country code
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+91/, '')
  return /^[6-9][0-9]{9}$/.test(cleaned)
}

/**
 * Clean phone number for ShipRocket
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^\+91/, '')
}

/**
 * Truncate address to max length
 */
export function truncateAddress(address: string, maxLength: number = 80): string {
  if (address.length <= maxLength) {
    return address
  }
  return address.substring(0, maxLength - 3) + '...'
}

/**
 * Get estimated delivery text from days
 */
export function getDeliveryText(days: string): string {
  if (!days) return 'Delivery date will be confirmed'

  const daysNum = parseInt(days.split('-')[0])

  if (daysNum <= 2) return 'Express Delivery (1-2 days)'
  if (daysNum <= 4) return 'Standard Delivery (3-4 days)'
  return `Delivery in ${days} days`
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * Map ShipRocket status to order status
 */
export function mapShipRocketStatus(
  srStatus: string | number
): 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' {
  const statusMap: Record<string, 'shipped' | 'delivered' | 'cancelled'> = {
    'PICKED_UP': 'shipped',
    'IN_TRANSIT': 'shipped',
    'OUT_FOR_DELIVERY': 'shipped',
    'REACHED_DESTINATION_HUB': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'RTO_INITIATED': 'cancelled',
    'RTO_DELIVERED': 'cancelled',
    'LOST': 'cancelled',
  }

  const normalizedStatus = typeof srStatus === 'number'
    ? getStatusLabel(srStatus)
    : srStatus.toUpperCase().replace(/ /g, '_')

  return statusMap[normalizedStatus] || 'processing'
}

/**
 * Get status label from status ID
 */
function getStatusLabel(statusId: number): string {
  const labels: Record<number, string> = {
    6: 'PICKED_UP',
    7: 'DELIVERED',
    8: 'CANCELLED',
    9: 'RTO_INITIATED',
    10: 'RTO_DELIVERED',
    17: 'OUT_FOR_DELIVERY',
    18: 'IN_TRANSIT',
    19: 'LOST',
    38: 'REACHED_DESTINATION_HUB',
  }

  return labels[statusId] || 'PROCESSING'
}
```

---

## UI Components

### Directory Structure

```
components/
├── checkout/
│   ├── pincode-checker.tsx        # Validate pincode & show serviceability
│   ├── courier-selector.tsx       # Display courier options
│   ├── delivery-estimate.tsx      # Show ETA badge
│   └── shipping-calculator.tsx    # Dynamic shipping cost display
│
├── tracking/
│   ├── tracking-page.tsx          # Full tracking view
│   ├── tracking-timeline.tsx      # Visual status timeline
│   └── tracking-badge.tsx         # Mini status indicator
│
└── admin/
    └── shiprocket/
        ├── shiprocket-settings.tsx    # Configuration form
        ├── order-fulfillment.tsx      # Fulfill order workflow
        ├── fulfillment-actions.tsx    # Action buttons
        ├── shipping-label-viewer.tsx  # View/print labels
        ├── tracking-timeline.tsx      # Admin tracking view
        └── bulk-shipment.tsx          # Bulk order processing
```

### Component Specifications

#### 1. Pincode Checker (`pincode-checker.tsx`)

```tsx
// Props
interface PincodeCheckerProps {
  value: string
  onChange: (value: string) => void
  onServiceabilityCheck: (result: ServiceabilityResult) => void
}

// Features:
// - Input field with 6-digit validation
// - Debounced API call on input
// - Loading state during check
// - Success state with green checkmark
// - Error state with red X and message
// - Shows cheapest and fastest courier options
```

#### 2. Courier Selector (`courier-selector.tsx`)

```tsx
// Props
interface CourierSelectorProps {
  couriers: CourierOption[]
  selectedId: number | null
  onSelect: (courierId: number) => void
  recommended?: number  // Recommended courier ID
}

// Features:
// - Radio button list of couriers
// - Shows for each: name, price, ETA, rating
// - Highlights recommended option
// - Auto-selects recommended if no selection
```

#### 3. Delivery Estimate (`delivery-estimate.tsx`)

```tsx
// Props
interface DeliveryEstimateProps {
  etd: string | null
  days: string | null
}

// Features:
// - Displays estimated delivery date
// - Shows "Express", "Standard", etc. labels
// - Truck icon with animation
```

#### 4. Tracking Timeline (`tracking-timeline.tsx`)

```tsx
// Props
interface TrackingTimelineProps {
  events: TrackingEvent[]
  currentStatus: string
  isDelivered: boolean
}

// Features:
// - Vertical timeline with dots
// - Green for completed steps
// - Animated current step
// - Shows date, time, location, activity
// - Expandable for more details
```

#### 5. ShipRocket Settings (`shiprocket-settings.tsx`)

```tsx
// Features:
// - API credentials form (email, password)
// - Test connection button
// - Pickup location form
// - Default package dimensions
// - Auto-assign courier toggle
// - Preferred courier dropdown
// - Enable/disable toggle
```

#### 6. Order Fulfillment (`order-fulfillment.tsx`)

```tsx
// Props
interface OrderFulfillmentProps {
  orderId: string
  order: Order
  onStatusChange: () => void
}

// Features:
// - Step-by-step fulfillment wizard
// - Step 1: Create ShipRocket Order
// - Step 2: Assign Courier / Generate AWB
// - Step 3: Schedule Pickup
// - Step 4: Generate Label (with download)
// - Progress indicator
// - Error handling with retry
```

---

## Order Flow & Status Mapping

### Complete Order Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE ORDER LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CUSTOMER JOURNEY                                                            │
│  ═══════════════                                                             │
│                                                                              │
│  1. Browse Products ──▶ 2. Add to Cart ──▶ 3. Checkout                      │
│                                                │                             │
│                                                ▼                             │
│                                    ┌─────────────────────┐                  │
│                                    │ Enter Pincode       │                  │
│                                    │ (Serviceability)    │                  │
│                                    └──────────┬──────────┘                  │
│                                               │                             │
│                          ┌────────────────────┴────────────────────┐        │
│                          │                                         │        │
│                    Available                               Not Available    │
│                          │                                         │        │
│                          ▼                                         ▼        │
│               ┌─────────────────────┐              ┌────────────────────┐   │
│               │ Show Courier Options│              │ "Delivery not      │   │
│               │ Select Shipping     │              │  available" message│   │
│               └──────────┬──────────┘              └────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│               ┌─────────────────────┐                                       │
│               │ Complete Address    │                                       │
│               │ Select Payment      │                                       │
│               └──────────┬──────────┘                                       │
│                          │                                                  │
│               ┌──────────┴──────────┐                                       │
│               │                     │                                       │
│            Online                  COD                                      │
│               │                     │                                       │
│               ▼                     ▼                                       │
│     ┌─────────────────┐  ┌─────────────────────┐                           │
│     │ Pay via UPI     │  │ Pay Shipping Upfront│                           │
│     │ Upload Screenshot│  │ (if enabled)       │                           │
│     └────────┬────────┘  └──────────┬──────────┘                           │
│              │                      │                                       │
│              └──────────┬───────────┘                                       │
│                         │                                                   │
│                         ▼                                                   │
│              ┌─────────────────────┐                                        │
│              │   ORDER PLACED      │                                        │
│              │   status: pending   │                                        │
│              └──────────┬──────────┘                                        │
│                         │                                                   │
└─────────────────────────┼───────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN WORKFLOW                                                              │
│  ══════════════                                                              │
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │ View New Order      │                                                    │
│  │ status: pending     │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│     ┌───────┴───────┐                                                       │
│     │               │                                                       │
│  Online           COD                                                       │
│     │               │                                                       │
│     ▼               │                                                       │
│  ┌──────────────────┐                                                       │
│  │ Verify Payment   │                                                       │
│  │ Check Screenshot │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           └─────────┬───────────────────────────────────────┐              │
│                     │                                       │              │
│                     ▼                                       │              │
│          ┌─────────────────────┐                           │              │
│          │ CONFIRMED           │◀──────────────────────────┘              │
│          │ status: confirmed   │                                          │
│          │ payment: verified   │                                          │
│          └──────────┬──────────┘                                          │
│                     │                                                      │
│                     ▼                                                      │
│  ╔══════════════════════════════════════════════════════════╗             │
│  ║           SHIPROCKET INTEGRATION                         ║             │
│  ╠══════════════════════════════════════════════════════════╣             │
│  ║                                                          ║             │
│  ║  ┌─────────────────────┐                                 ║             │
│  ║  │ 1. Create SR Order  │                                 ║             │
│  ║  │    API: /orders/    │                                 ║             │
│  ║  │    create/adhoc     │                                 ║             │
│  ║  └──────────┬──────────┘                                 ║             │
│  ║             │                                            ║             │
│  ║             ▼                                            ║             │
│  ║  ┌─────────────────────┐                                 ║             │
│  ║  │ 2. Assign Courier   │                                 ║             │
│  ║  │    Generate AWB     │                                 ║             │
│  ║  │    API: /courier/   │                                 ║             │
│  ║  │    assign/awb       │                                 ║             │
│  ║  └──────────┬──────────┘                                 ║             │
│  ║             │                                            ║             │
│  ║             ▼                                            ║             │
│  ║  ┌─────────────────────┐                                 ║             │
│  ║  │ status: processing  │                                 ║             │
│  ║  │ AWB: 12345678901    │                                 ║             │
│  ║  └──────────┬──────────┘                                 ║             │
│  ║             │                                            ║             │
│  ║             ▼                                            ║             │
│  ║  ┌─────────────────────┐                                 ║             │
│  ║  │ 3. Schedule Pickup  │                                 ║             │
│  ║  │    API: /courier/   │                                 ║             │
│  ║  │    generate/pickup  │                                 ║             │
│  ║  └──────────┬──────────┘                                 ║             │
│  ║             │                                            ║             │
│  ║             ▼                                            ║             │
│  ║  ┌─────────────────────┐                                 ║             │
│  ║  │ 4. Generate Label   │                                 ║             │
│  ║  │    Print & Pack     │                                 ║             │
│  ║  │    API: /courier/   │                                 ║             │
│  ║  │    generate/label   │                                 ║             │
│  ║  └──────────┬──────────┘                                 ║             │
│  ║             │                                            ║             │
│  ╚═════════════╪════════════════════════════════════════════╝             │
│                │                                                          │
│                ▼                                                          │
│     ┌─────────────────────┐                                               │
│     │ AWAITING PICKUP     │                                               │
│     │ status: processing  │                                               │
│     └──────────┬──────────┘                                               │
│                │                                                          │
└────────────────┼──────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  COURIER JOURNEY (via Webhooks)                                              │
│  ══════════════════════════════                                              │
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │ PICKED UP           │                                                    │
│  │ status: shipped     │◀──── Webhook: PICKED_UP                           │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│             ▼                                                               │
│  ┌─────────────────────┐                                                    │
│  │ IN TRANSIT          │◀──── Webhook: IN_TRANSIT                          │
│  │ status: shipped     │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│             ▼                                                               │
│  ┌─────────────────────┐                                                    │
│  │ OUT FOR DELIVERY    │◀──── Webhook: OUT_FOR_DELIVERY                    │
│  │ status: shipped     │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│     ┌───────┴───────┐                                                       │
│     │               │                                                       │
│  Success         Failed                                                     │
│     │               │                                                       │
│     ▼               ▼                                                       │
│  ┌──────────────┐  ┌──────────────────┐                                    │
│  │ DELIVERED    │  │ NDR / RTO        │                                    │
│  │ status:      │  │ status:          │                                    │
│  │ delivered    │  │ cancelled        │                                    │
│  └──────────────┘  └──────────────────┘                                    │
│         │                   │                                               │
│         ▼                   ▼                                               │
│  ┌──────────────┐  ┌──────────────────┐                                    │
│  │ COD Amount   │  │ Handle Return    │                                    │
│  │ Remitted     │  │ Refund Customer  │                                    │
│  │ (D+10)       │  │                  │                                    │
│  └──────────────┘  └──────────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Mapping Table

| Your Status | Payment Status | ShipRocket Status | Description |
|-------------|---------------|-------------------|-------------|
| `pending` | `pending` / `verification_pending` | - | Order placed, awaiting payment verification |
| `confirmed` | `verified` / `cod` | - | Payment verified, ready for fulfillment |
| `processing` | `verified` / `cod` | AWB_ASSIGNED | ShipRocket order created, AWB assigned |
| `shipped` | `verified` / `cod` | PICKED_UP / IN_TRANSIT / OUT_FOR_DELIVERY | Courier has picked up package |
| `delivered` | `verified` / `cod` | DELIVERED | Successfully delivered to customer |
| `cancelled` | `failed` | CANCELLED / RTO_DELIVERED / LOST | Order cancelled or returned |

---

## Configuration Guide

### Environment Variables

```env
# .env.local

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ShipRocket (optional - can also be stored in database)
SHIPROCKET_API_EMAIL=api_user@youremail.com
SHIPROCKET_API_PASSWORD=your_api_password
SHIPROCKET_WEBHOOK_SECRET=your_webhook_secret
```

### ShipRocket Dashboard Setup

1. **Create API User**
   - Go to: Settings → API → Configure → Create An API User
   - Create unique email/password for API access
   - Note: This is separate from your login credentials

2. **Configure Pickup Location**
   - Go to: Settings → Pickup Addresses
   - Add your warehouse/store address
   - Note the exact "Pickup Location Name" - you'll need this

3. **Set Up Webhook**
   - Go to: Settings → API → Webhook
   - Add webhook URL: `https://yourdomain.com/api/shiprocket/webhook`
   - Configure webhook secret
   - Enable desired events

4. **Get Channel ID (Optional)**
   - Go to: Settings → Channels
   - Note your channel ID for multi-channel orders

### Admin Settings Configuration

After deploying, configure via Admin Panel:

1. Navigate to: `/admin/settings/shiprocket`
2. Enter API credentials
3. Click "Test Connection"
4. Configure pickup location
5. Set default package dimensions for Hot Wheels
6. Enable/disable auto-assign courier
7. Toggle ShipRocket integration on/off

---

## Implementation Phases

### Phase 1: Core Setup (Foundation)

**Goals:** Set up database, create ShipRocket client, basic admin settings

**Tasks:**
1. Run database migrations
   - Add columns to `orders` table
   - Create `shiprocket_settings` table
   - Create `shipping_tracking` table

2. Create ShipRocket client service
   - `/lib/shiprocket/client.ts`
   - `/lib/shiprocket/types.ts`
   - `/lib/shiprocket/utils.ts`

3. Create admin settings API
   - `GET/PUT /api/admin/shiprocket/settings`

4. Create admin settings UI
   - Credentials form
   - Test connection
   - Pickup location config

**Deliverables:**
- Database ready for ShipRocket data
- Admin can configure ShipRocket credentials
- ShipRocket client can authenticate

---

### Phase 2: Order Integration (Admin Fulfillment)

**Goals:** Admin can create ShipRocket orders, generate AWB, schedule pickup

**Tasks:**
1. Create order fulfillment APIs
   - `POST /api/admin/shiprocket/orders/[orderId]/create`
   - `POST /api/admin/shiprocket/orders/[orderId]/awb`
   - `POST /api/admin/shiprocket/orders/[orderId]/pickup`
   - `GET /api/admin/shiprocket/orders/[orderId]/label`

2. Create order fulfillment UI
   - Fulfillment wizard component
   - Step indicators
   - Label download button

3. Update admin orders page
   - Show ShipRocket status
   - Add fulfillment actions

**Deliverables:**
- Admin can process orders through ShipRocket
- AWB codes assigned to orders
- Labels can be generated and downloaded

---

### Phase 3: Checkout Enhancement

**Goals:** Real-time serviceability check, dynamic shipping rates

**Tasks:**
1. Create public APIs
   - `POST /api/shiprocket/serviceability`
   - `POST /api/shiprocket/rates`

2. Create checkout components
   - Pincode checker
   - Courier selector
   - Delivery estimate badge

3. Update checkout page
   - Add pincode validation
   - Show available couriers
   - Dynamic shipping calculation

4. Update order creation
   - Store selected courier
   - Store estimated delivery date

**Deliverables:**
- Customers see delivery availability before ordering
- Real shipping rates based on location
- Better checkout experience

---

### Phase 4: Tracking & Webhooks

**Goals:** Real-time status updates, customer tracking page

**Tasks:**
1. Create webhook handler
   - `POST /api/shiprocket/webhook`
   - Signature verification
   - Status mapping
   - Tracking event logging

2. Create tracking APIs
   - `GET /api/shiprocket/track/[awb]`
   - `GET /api/admin/shiprocket/orders/[orderId]/track`

3. Create tracking UI
   - Customer tracking page
   - Tracking timeline component
   - Status badges

4. Update orders pages
   - Show tracking information
   - Link to detailed tracking

**Deliverables:**
- Automatic status updates via webhooks
- Customers can track their orders
- Full visibility into shipment journey

---

### Phase 5: Advanced Features (Optional)

**Goals:** Bulk processing, returns, analytics

**Tasks:**
1. Bulk shipment processing
   - Select multiple orders
   - Batch create ShipRocket orders
   - Bulk label generation

2. Return order management
   - Create return order API
   - Return tracking

3. Shipping analytics
   - Courier performance stats
   - Delivery success rates
   - Average delivery times

4. Notifications
   - Email notifications for status updates
   - SMS via Shiprocket (optional)

**Deliverables:**
- Efficient bulk order processing
- Complete return order workflow
- Data-driven courier selection

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid/expired token | Re-authenticate, check credentials |
| `Invalid Phone Number` | Phone format issues | Remove spaces, ensure 10 digits |
| `Invalid Address` | Address too long | Truncate to 80 chars per field |
| `City Name Error` | City > 30 chars | Truncate city name |
| `Pincode Not Configured` | Pincode not in ShipRocket | Check serviceability first |
| `Order Already Exists` | Duplicate order_id | Use unique order IDs |
| `Weight Mismatch` | Actual > volumetric | Recalculate dimensions |

### Error Handling Strategy

```typescript
// Example error handling in API route
try {
  const client = await getShipRocketClient()
  const result = await client.createOrder(payload)
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('ShipRocket API Error:', error)

  // Parse error message
  const message = error instanceof Error ? error.message : 'Unknown error'

  // Map to user-friendly message
  let userMessage = 'Failed to process shipment'
  if (message.includes('401')) {
    userMessage = 'ShipRocket authentication failed. Please check settings.'
  } else if (message.includes('pincode')) {
    userMessage = 'Delivery not available to this pincode.'
  } else if (message.includes('phone')) {
    userMessage = 'Invalid phone number format.'
  }

  return NextResponse.json(
    { success: false, error: userMessage },
    { status: 400 }
  )
}
```

### Retry Logic

```typescript
// Retry wrapper for transient failures
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on auth or validation errors
      if (error instanceof Error) {
        if (error.message.includes('401') ||
            error.message.includes('Invalid')) {
          throw error
        }
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError
}
```

---

## Testing Guide

### API Testing with Postman

1. **Import ShipRocket Collection**
   - Visit: [ShipRocket Postman Collection](https://www.postman.com/shiprocketdev)
   - Import to your workspace

2. **Set Environment Variables**
   ```
   base_url: https://apiv2.shiprocket.in/v1/external
   token: (from auth response)
   ```

3. **Test Sequence**
   - Authenticate → Get token
   - Check serviceability
   - Create test order
   - Generate AWB
   - Track shipment

### Local Testing

```typescript
// /scripts/test-shiprocket.ts

import { ShipRocketClient } from '../lib/shiprocket/client'

async function testShipRocket() {
  const client = new ShipRocketClient({
    email: process.env.SHIPROCKET_API_EMAIL!,
    password: process.env.SHIPROCKET_API_PASSWORD!,
  })

  // Test authentication
  console.log('Testing authentication...')
  const token = await client.authenticate()
  console.log('✓ Authentication successful')

  // Test serviceability
  console.log('Testing serviceability...')
  const serviceability = await client.checkServiceability(
    '110001', // Delhi
    '400001', // Mumbai
    0.5,
    false
  )
  console.log(`✓ Found ${serviceability.couriers.length} couriers`)

  // More tests...
}

testShipRocket().catch(console.error)
```

### Webhook Testing

1. **Use ngrok for local testing**
   ```bash
   ngrok http 3000
   ```

2. **Configure webhook URL in ShipRocket**
   - Use ngrok URL + `/api/shiprocket/webhook`

3. **Trigger test events**
   - Create a test order
   - Monitor webhook logs

---

## Resources & References

### Official Documentation
- [ShipRocket API Docs](https://apidocs.shiprocket.in/)
- [ShipRocket Developer Portal](https://www.shiprocket.in/developers/)
- [ShipRocket Support](https://support.shiprocket.in/)

### Postman Collections
- [ShipRocket Public Workspace](https://www.postman.com/shiprocketdev/shiprocket-dev-s-public-workspace/)

### SDKs & Libraries
- [Laravel ShipRocket SDK](https://github.com/seshac/laravel-shiprocket-api)

### Support Contacts
- ShipRocket Support Email: support@shiprocket.in
- API Support: api@shiprocket.in

---

## Appendix

### A. State Abbreviations (India)

| State | Code |
|-------|------|
| Andhra Pradesh | AP |
| Delhi | DL |
| Gujarat | GJ |
| Karnataka | KA |
| Maharashtra | MH |
| Tamil Nadu | TN |
| Uttar Pradesh | UP |
| West Bengal | WB |
| ... | ... |

### B. HSN Codes for Hot Wheels

| Product Type | HSN Code |
|--------------|----------|
| Toy vehicles | 9503 |
| Die-cast models | 9503.00.10 |
| Collectible toys | 9503.00.90 |

### C. Default Package Dimensions for Hot Wheels

| Items | Length (cm) | Breadth (cm) | Height (cm) | Weight (kg) |
|-------|-------------|--------------|-------------|-------------|
| 1-4 | 15 | 10 | 5 | 0.1-0.4 |
| 5-10 | 15 | 10 | 10 | 0.5-1.0 |
| 11-20 | 20 | 15 | 10 | 1.0-2.0 |
| 20+ | 25 | 20 | 15 | 2.0+ |

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Author: Claude AI Assistant*
