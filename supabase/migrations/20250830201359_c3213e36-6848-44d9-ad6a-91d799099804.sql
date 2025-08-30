-- Fix newsletter security vulnerability by removing overly permissive public policies
-- The newsletter should only be accessible via edge functions using service role

-- Drop the overly permissive public policies
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public can confirm subscriptions" ON public.newsletter_subscribers;

-- The "Service role can manage all subscribers" policy should remain
-- This ensures only the newsletter edge functions can interact with the table

-- Add a comment to document the security model
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter subscribers table. Access restricted to service role only. Public interaction via newsletter-subscribe, newsletter-confirm, and newsletter-unsubscribe edge functions only.';