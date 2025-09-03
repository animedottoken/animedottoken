-- Fix functions missing SET search_path TO 'public'

-- Recreate validate_secondary_wallet_limit function with proper search_path
CREATE OR REPLACE FUNCTION public.validate_secondary_wallet_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only check for secondary wallets
  IF NEW.wallet_type = 'secondary' THEN
    -- Check if user would exceed the limit of 10 secondary wallets
    IF (SELECT COUNT(*) FROM public.user_wallets 
        WHERE user_id = NEW.user_id AND wallet_type = 'secondary' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) >= 10 THEN
      RAISE EXCEPTION 'User cannot have more than 10 secondary wallets';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate audit_sensitive_operations function with proper search_path
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Recreate set_creator_user_id function with proper search_path
CREATE OR REPLACE FUNCTION public.set_creator_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    NEW.creator_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate collections_set_slug function with proper search_path
CREATE OR REPLACE FUNCTION public.collections_set_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only generate slug if it's null or empty
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_collection_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$function$;