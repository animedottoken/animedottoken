-- Fix security warnings: Function search path mutable

-- Fix audit function security
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive operations on user profiles, collections, and NFTs
  INSERT INTO public.security_audit_log (
    table_name, 
    operation, 
    user_wallet, 
    old_data, 
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(
      NEW.wallet_address, 
      NEW.creator_address, 
      NEW.owner_address,
      OLD.wallet_address, 
      OLD.creator_address, 
      OLD.owner_address
    ),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix rate limiting function security
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_wallet TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_window TIMESTAMP WITH TIME ZONE;
  request_count INTEGER;
BEGIN
  -- Calculate current window (round down to the minute)
  current_window := date_trunc('minute', now()) - (extract(minute from now())::INTEGER % p_window_minutes) * interval '1 minute';
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (user_wallet, endpoint, window_start)
  VALUES (p_user_wallet, p_endpoint, current_window)
  ON CONFLICT (user_wallet, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    created_at = now();
  
  -- Check if limit exceeded
  SELECT request_count INTO request_count
  FROM public.rate_limits
  WHERE user_wallet = p_user_wallet 
    AND endpoint = p_endpoint 
    AND window_start = current_window;
  
  RETURN request_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create triggers for audit logging (if they don't exist)
DROP TRIGGER IF EXISTS audit_user_profiles_trigger ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_collections_trigger ON public.collections;
CREATE TRIGGER audit_collections_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_nfts_trigger ON public.nfts;
CREATE TRIGGER audit_nfts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.nfts
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();