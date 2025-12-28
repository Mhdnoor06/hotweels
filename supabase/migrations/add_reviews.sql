-- Migration: Add Reviews System
-- Description: Creates reviews and review_votes tables with triggers and RLS policies

-- Create review status enum type
DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create vote type enum
DO $$ BEGIN
    CREATE TYPE vote_type AS ENUM ('helpful', 'unhelpful');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    images TEXT[] DEFAULT '{}',
    status review_status NOT NULL DEFAULT 'pending',
    helpful_count INTEGER NOT NULL DEFAULT 0,
    unhelpful_count INTEGER NOT NULL DEFAULT 0,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Each user can only review a product once
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

-- Create review_votes table
CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Each user can only vote once per review
    CONSTRAINT unique_user_review_vote UNIQUE (review_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON public.reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- Trigger function to update reviews.updated_at
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on reviews
DROP TRIGGER IF EXISTS trigger_update_review_updated_at ON public.reviews;
CREATE TRIGGER trigger_update_review_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_updated_at();

-- Function to recalculate product rating and review count
CREATE OR REPLACE FUNCTION recalculate_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    total_reviews INTEGER;
    target_product_id UUID;
BEGIN
    -- Determine which product to update
    IF TG_OP = 'DELETE' THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    -- Calculate new average rating and count from approved reviews only
    SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        COUNT(*)
    INTO avg_rating, total_reviews
    FROM public.reviews
    WHERE product_id = target_product_id
    AND status = 'approved';

    -- Update the product
    UPDATE public.products
    SET
        rating = avg_rating,
        review_count = total_reviews,
        updated_at = NOW()
    WHERE id = target_product_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to recalculate product rating when reviews change
DROP TRIGGER IF EXISTS trigger_review_insert_rating ON public.reviews;
CREATE TRIGGER trigger_review_insert_rating
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION recalculate_product_rating();

DROP TRIGGER IF EXISTS trigger_review_update_rating ON public.reviews;
CREATE TRIGGER trigger_review_update_rating
    AFTER UPDATE ON public.reviews
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.rating IS DISTINCT FROM NEW.rating)
    EXECUTE FUNCTION recalculate_product_rating();

DROP TRIGGER IF EXISTS trigger_review_delete_rating ON public.reviews;
CREATE TRIGGER trigger_review_delete_rating
    AFTER DELETE ON public.reviews
    FOR EACH ROW
    WHEN (OLD.status = 'approved')
    EXECUTE FUNCTION recalculate_product_rating();

-- Function to update vote counts on review
CREATE OR REPLACE FUNCTION update_review_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id UUID;
BEGIN
    -- Determine which review to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;

    -- Recalculate vote counts
    UPDATE public.reviews
    SET
        helpful_count = (
            SELECT COUNT(*) FROM public.review_votes
            WHERE review_id = target_review_id AND vote_type = 'helpful'
        ),
        unhelpful_count = (
            SELECT COUNT(*) FROM public.review_votes
            WHERE review_id = target_review_id AND vote_type = 'unhelpful'
        )
    WHERE id = target_review_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update vote counts
DROP TRIGGER IF EXISTS trigger_vote_insert ON public.review_votes;
CREATE TRIGGER trigger_vote_insert
    AFTER INSERT ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_vote_counts();

DROP TRIGGER IF EXISTS trigger_vote_update ON public.review_votes;
CREATE TRIGGER trigger_vote_update
    AFTER UPDATE ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_vote_counts();

DROP TRIGGER IF EXISTS trigger_vote_delete ON public.review_votes;
CREATE TRIGGER trigger_vote_delete
    AFTER DELETE ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_vote_counts();

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews table

-- Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews"
    ON public.reviews
    FOR SELECT
    USING (status = 'approved');

-- Users can read their own reviews (any status)
CREATE POLICY "Users can read own reviews"
    ON public.reviews
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create reviews (verification of purchase done in application layer)
CREATE POLICY "Users can create reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews only
CREATE POLICY "Users can update own pending reviews"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
    ON public.reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for review_votes table

-- Anyone can read votes (for display purposes)
CREATE POLICY "Anyone can read votes"
    ON public.review_votes
    FOR SELECT
    USING (true);

-- Users can create votes
CREATE POLICY "Users can create votes"
    ON public.review_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
    ON public.review_votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
    ON public.review_votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.review_votes TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.review_votes TO anon;
