-- Add RLS policy to allow public viewing of approved community submissions
-- This excludes sensitive fields like contact info
CREATE POLICY "Public can view approved submissions" 
ON public.community_submissions 
FOR SELECT 
USING (status = 'approved'::submission_status);