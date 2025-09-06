-- Enhanced security policies for user_profiles table to prevent any unauthorized access

-- First, drop any potentially permissive policies and recreate with explicit restrictions
DROP POLICY IF EXISTS "Public profiles are not accessible" ON public.user_profiles;
DROP POLICY IF EXISTS "Anonymous users cannot access profiles" ON public.user_profiles;

-- Create explicit DENY policy for anonymous/public access to sensitive data
CREATE POLICY "Block anonymous access to user profiles"
ON public.user_profiles
FOR ALL
TO anon
USING (false);

-- Create explicit policy for authenticated users to only access their own data
CREATE POLICY "Users can only access their own profile data"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
);

-- Ensure service role maintains full access for system operations
CREATE POLICY "Service role full access to user profiles"
ON public.user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add audit trigger to log any sensitive data access attempts
CREATE OR REPLACE FUNCTION public.audit_user_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile access attempts for security monitoring
  INSERT INTO public.security_audit_log (
    table_name,
    operation,
    user_wallet,
    old_data,
    new_data
  ) VALUES (
    'user_profiles_access',
    TG_OP,
    COALESCE(NEW.wallet_address, OLD.wallet_address),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;