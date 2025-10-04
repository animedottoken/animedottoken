-- Phase 1 Critical Security Fixes (Corrected)

-- ============================================
-- 1. RESTRICT MARKETPLACE ACTIVITIES ACCESS
-- ============================================

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view marketplace activities" ON public.marketplace_activities;

-- Create secure masked function for public access
CREATE OR REPLACE FUNCTION public.get_marketplace_activities_public_masked()
RETURNS TABLE(
  id uuid,
  nft_id uuid,
  collection_id uuid,
  activity_type text,
  from_address_masked text,
  to_address_masked text,
  price numeric,
  currency text,
  transaction_signature_masked text,
  block_time timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ma.id, 
    ma.nft_id, 
    ma.collection_id, 
    ma.activity_type,
    CASE 
      WHEN ma.from_address IS NOT NULL THEN concat(left(ma.from_address, 4), '...', right(ma.from_address, 4))
      ELSE NULL 
    END as from_address_masked,
    CASE 
      WHEN ma.to_address IS NOT NULL THEN concat(left(ma.to_address, 4), '...', right(ma.to_address, 4))
      ELSE NULL 
    END as to_address_masked,
    ma.price, 
    ma.currency,
    CASE 
      WHEN ma.transaction_signature IS NOT NULL THEN concat(left(ma.transaction_signature, 8), '...', right(ma.transaction_signature, 8))
      ELSE NULL 
    END as transaction_signature_masked,
    ma.block_time, 
    ma.created_at
  FROM public.marketplace_activities ma
  ORDER BY ma.created_at DESC
  LIMIT 100;
$$;

-- Add authenticated-only policy for viewing marketplace activities
CREATE POLICY "Authenticated users can view marketplace activities"
ON public.marketplace_activities
FOR SELECT
TO authenticated
USING (true);

-- Add comment explaining the security reasoning
COMMENT ON POLICY "Authenticated users can view marketplace activities" 
ON public.marketplace_activities 
IS 'Restricts marketplace activity viewing to authenticated users to prevent public data harvesting and protect user privacy';

-- ============================================
-- 2. ENHANCE SECURITY EVENT LOGGING
-- ============================================

-- Create rate limiting table for security events
CREATE TABLE IF NOT EXISTS public.security_event_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT date_trunc('minute', now()),
  event_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, window_start)
);

-- Enable RLS on rate limits table
ALTER TABLE public.security_event_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.security_event_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create rate limit check function for security events
CREATE OR REPLACE FUNCTION public.check_security_event_rate_limit(
  p_user_id uuid,
  p_max_events integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamp with time zone;
  event_count integer;
BEGIN
  -- Calculate current window (round down to the minute)
  current_window := date_trunc('minute', now()) - 
    (extract(minute from now())::INTEGER % p_window_minutes) * interval '1 minute';
  
  -- Get or create rate limit record
  INSERT INTO public.security_event_rate_limits (user_id, window_start, event_count)
  VALUES (p_user_id, current_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET 
    event_count = security_event_rate_limits.event_count + 1,
    created_at = now()
  RETURNING security_event_rate_limits.event_count INTO event_count;
  
  -- Return true if under limit
  RETURN event_count <= p_max_events;
END;
$$;

-- Add index for rate limit cleanup
CREATE INDEX IF NOT EXISTS idx_security_event_rate_limits_created_at 
ON public.security_event_rate_limits(created_at);

-- ============================================
-- 3. NEWSLETTER SECURITY AUDIT
-- ============================================

-- Verify newsletter_subscribers table has proper RLS
-- (Already exists, just adding comment for documentation)
COMMENT ON TABLE public.newsletter_subscribers 
IS 'SECURITY: This table contains email addresses. All access must be via service role only. Never expose emails in public functions or logs.';

-- Add index for secure token lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token 
ON public.newsletter_subscribers(opt_in_token) 
WHERE status = 'pending';

-- ============================================
-- SECURITY AUDIT LOG
-- ============================================

-- Log these security policy changes (using 'low' severity which is valid)
INSERT INTO public.security_events (
  event_type,
  severity,
  metadata
) VALUES (
  'security_policies_updated',
  'low',
  jsonb_build_object(
    'changes', ARRAY[
      'Restricted marketplace_activities public access',
      'Created masked marketplace activities function',
      'Added security event rate limiting',
      'Enhanced newsletter security documentation'
    ],
    'timestamp', now(),
    'migration_version', '20250925_phase1_security_fixes'
  )
);