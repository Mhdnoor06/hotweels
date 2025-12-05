-- ============================================
-- SHIPROCKET INTEGRATION MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add ShipRocket columns to orders table
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_awb ON orders(shiprocket_awb_code);

-- 2. Create shiprocket_settings table
CREATE TABLE IF NOT EXISTS shiprocket_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- API Credentials
  api_email TEXT NOT NULL,
  api_password TEXT NOT NULL,
  auth_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Pickup Location (Primary) - nullable to allow step-by-step setup
  pickup_location_name TEXT DEFAULT 'Primary Warehouse',
  pickup_address TEXT,
  pickup_address_2 TEXT,
  pickup_city TEXT,
  pickup_state TEXT,
  pickup_pincode TEXT,
  pickup_phone TEXT,
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

-- Only allow one settings row (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shiprocket_settings_singleton ON shiprocket_settings ((true));

-- Enable RLS
ALTER TABLE shiprocket_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage shiprocket settings
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

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role full access to shiprocket settings"
ON shiprocket_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Create shipping_tracking table for webhook events
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

-- Indexes for shipping_tracking
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_order_id ON shipping_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_awb ON shipping_tracking(awb_code);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_event_time ON shipping_tracking(event_time DESC);

-- Enable RLS
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

-- Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage tracking"
ON shipping_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Optional: Add product dimensions (uncomment if needed)
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) DEFAULT 0.1;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 15;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS breadth DECIMAL(10,2) DEFAULT 10;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT 5;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT '9503';

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shiprocket_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shiprocket_settings
DROP TRIGGER IF EXISTS shiprocket_settings_updated_at ON shiprocket_settings;
CREATE TRIGGER shiprocket_settings_updated_at
  BEFORE UPDATE ON shiprocket_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_shiprocket_settings_updated_at();
