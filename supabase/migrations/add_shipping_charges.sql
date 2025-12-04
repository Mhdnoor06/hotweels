-- Migration: Add Shipping Charges Collection Feature
-- Run this in your Supabase SQL Editor

-- ============================================
-- ADD COLUMNS TO store_settings TABLE
-- ============================================
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS shipping_charges_collection_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shipping_charges_amount DECIMAL(10, 2) DEFAULT 0;

-- ============================================
-- ADD COLUMNS TO orders TABLE
-- ============================================
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_charges DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shipping_payment_screenshot TEXT,
ADD COLUMN IF NOT EXISTS shipping_payment_status TEXT CHECK (shipping_payment_status IN ('pending', 'verified') OR shipping_payment_status IS NULL);

-- ============================================
-- UPDATE EXISTING RECORDS (Optional)
-- ============================================
-- Set default values for existing store_settings
UPDATE public.store_settings
SET 
  shipping_charges_collection_enabled = false,
  shipping_charges_amount = 0
WHERE shipping_charges_collection_enabled IS NULL;

