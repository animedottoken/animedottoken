-- Fix the search path security issues for the trigger functions
CREATE OR REPLACE FUNCTION public.populate_creator_user_id_for_nfts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Always set creator_user_id to the authenticated user
  NEW.creator_user_id := auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_creator_user_id_for_collections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Always set creator_user_id to the authenticated user
  NEW.creator_user_id := auth.uid();
  RETURN NEW;
END;
$function$;