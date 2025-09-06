-- Fix the function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;