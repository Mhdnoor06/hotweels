-- Add images column to products table for storing multiple images
-- This column will store an array of image URLs (max 4 images)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN public.products.images IS 'Array of up to 4 product image URLs. First image is also stored in the image field for backward compatibility.';DD COLUMN IF NOT EXISTS images TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN public.products.images IS 'Array of up to 4 product image URLs. First image is also stored in the image field for backward compatibility.';

