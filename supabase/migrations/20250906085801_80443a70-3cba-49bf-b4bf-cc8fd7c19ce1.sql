-- Fix function search path security issue by setting search_path for functions that don't have it

-- Fix get_marketplace_info_public function
CREATE OR REPLACE FUNCTION public.get_marketplace_info_public()
 RETURNS TABLE(platform_fee_percentage numeric, updated_at timestamp with time zone, is_paused boolean, allowlist_only boolean, pause_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ms.platform_fee_percentage,
    ms.updated_at,
    ms.is_paused,
    ms.allowlist_only,
    ms.pause_message
  FROM marketplace_settings ms
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$function$;

-- Fix get_marketplace_settings_authenticated function
CREATE OR REPLACE FUNCTION public.get_marketplace_settings_authenticated()
 RETURNS TABLE(id text, platform_fee_percentage numeric, platform_wallet_address text, created_at timestamp with time zone, updated_at timestamp with time zone, is_paused boolean, allowlist_only boolean, pause_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    ms.id::TEXT,
    ms.platform_fee_percentage,
    ms.platform_wallet_address,
    ms.created_at,
    ms.updated_at,
    ms.is_paused,
    ms.allowlist_only,
    ms.pause_message
  FROM marketplace_settings ms
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$function$;