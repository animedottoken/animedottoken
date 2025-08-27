-- Fix audit_sensitive_operations to avoid referencing non-existent columns on various tables
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_json jsonb;
  old_json jsonb;
  actor_wallet text;
BEGIN
  -- Convert NEW/OLD to jsonb safely depending on operation
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    new_json := to_jsonb(NEW);
  ELSE
    new_json := NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    old_json := to_jsonb(OLD);
  ELSE
    old_json := NULL;
  END IF;

  -- Safely extract a wallet-like identifier from available fields
  actor_wallet := COALESCE(
    new_json ->> 'wallet_address',
    new_json ->> 'creator_address',
    new_json ->> 'owner_address',
    old_json ->> 'wallet_address',
    old_json ->> 'creator_address',
    old_json ->> 'owner_address'
  );

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
    actor_wallet,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;