-- Migration: Add support for admin-created reviews
-- This adds a reviewer_name column for admin reviews and creates a system user

-- Add reviewer_name column to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Create a system user for admin-created reviews if it doesn't exist
-- This user will be used as the author for manually added reviews
INSERT INTO public.users (id, email, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@hotwheelstore.com',
  'Verified Buyer',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add a comment to explain the purpose
COMMENT ON COLUMN public.reviews.reviewer_name IS 'Custom reviewer name for admin-created reviews. If set, this overrides the user name display.';
