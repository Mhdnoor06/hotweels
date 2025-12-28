-- Fix reviews foreign key references
-- This migration fixes the foreign keys to reference public.users instead of auth.users

-- Drop existing foreign key constraints
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.review_votes DROP CONSTRAINT IF EXISTS review_votes_user_id_fkey;

-- Add correct foreign key constraints referencing public.users
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.review_votes
  ADD CONSTRAINT review_votes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;
