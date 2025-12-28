-- Migration: Remove rarity field from products table
-- This field is no longer used in the application

-- Drop the rarity column from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS rarity;
