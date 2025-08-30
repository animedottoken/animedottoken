-- Add explicit RLS policies to prevent any public access to newsletter subscriber data
-- This ensures email addresses cannot be accessed by unauthorized users

-- Enable RLS if not already enabled (should already be enabled but being explicit)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Add explicit policy that blocks all public SELECT access
-- Only service role (edge functions) can read subscriber data
CREATE POLICY "Block all public SELECT access to subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Add explicit policy that blocks all public INSERT access (redundant but explicit)
CREATE POLICY "Block all public INSERT access to subscribers" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Add explicit policy that blocks all public UPDATE access (redundant but explicit)
CREATE POLICY "Block all public UPDATE access to subscribers" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add explicit policy that blocks all public DELETE access
CREATE POLICY "Block all public DELETE access to subscribers" 
ON public.newsletter_subscribers 
FOR DELETE 
USING (auth.role() = 'service_role');

-- Update table comment to reflect the strict security model
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter subscribers table with strict RLS. All operations (SELECT, INSERT, UPDATE, DELETE) restricted to service role only. Public interaction only via newsletter-subscribe, newsletter-confirm, and newsletter-unsubscribe edge functions.';