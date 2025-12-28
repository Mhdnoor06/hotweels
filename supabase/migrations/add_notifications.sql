-- ============================================
-- NOTIFICATIONS TABLE
-- Stores in-app notifications for users
-- Notifications are automatically deleted after 15 days
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_status', 'payment', 'shipping', 'promo', 'system')),

  -- Optional reference to related entities
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Metadata (for additional data like tracking URL, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Auto-expiry after 15 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days')
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications (for backend operations)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can manage all notifications
CREATE POLICY "Service role can manage notifications"
ON public.notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- AUTO-DELETE OLD NOTIFICATIONS (15 days)
-- ============================================

-- Create function to delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
END;
$$;

-- Enable pg_cron extension (if not already enabled)
-- Note: This needs to be enabled in Supabase dashboard under Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run daily at midnight UTC
-- This will delete all notifications older than 15 days
SELECT cron.schedule(
  'delete-expired-notifications',  -- job name
  '0 0 * * *',                     -- cron schedule (daily at midnight)
  'SELECT delete_expired_notifications()'
);

-- Alternative: If pg_cron is not available, you can also filter in queries
-- The API already filters by expires_at, so old notifications won't show up
