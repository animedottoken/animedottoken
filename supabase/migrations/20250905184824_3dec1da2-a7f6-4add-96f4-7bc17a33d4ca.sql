-- 1) Delete all existing likes to start fresh
DELETE FROM public.nft_likes;
DELETE FROM public.collection_likes;

-- 2) Get the Supabase user ID for kurtarichard@gmail.com
-- First, let's find the user ID from auth.users table via a simple query
-- We'll use this in the updates below

-- 3) Update all existing NFTs to have the correct creator_user_id
UPDATE public.nfts 
SET creator_user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'kurtarichard@gmail.com' 
  LIMIT 1
)
WHERE creator_user_id IS NULL OR creator_user_id != (
  SELECT id FROM auth.users 
  WHERE email = 'kurtarichard@gmail.com' 
  LIMIT 1
);

-- 4) Update all existing collections to have the correct creator_user_id  
UPDATE public.collections
SET creator_user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'kurtarichard@gmail.com' 
  LIMIT 1
)
WHERE creator_user_id IS NULL OR creator_user_id != (
  SELECT id FROM auth.users 
  WHERE email = 'kurtarichard@gmail.com' 
  LIMIT 1
);

-- 5) Create/update trigger functions to always use auth.uid() for creator_user_id
CREATE OR REPLACE FUNCTION public.populate_creator_user_id_for_nfts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
SET search_path TO 'public'
AS $function$
BEGIN
  -- Always set creator_user_id to the authenticated user
  NEW.creator_user_id := auth.uid();
  RETURN NEW;
END;
$function$;

-- 6) Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS set_creator_user_id_on_nfts ON public.nfts;
DROP TRIGGER IF EXISTS set_creator_user_id_on_collections ON public.collections;

CREATE TRIGGER set_creator_user_id_on_nfts
  BEFORE INSERT OR UPDATE ON public.nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_creator_user_id_for_nfts();

CREATE TRIGGER set_creator_user_id_on_collections
  BEFORE INSERT OR UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_creator_user_id_for_collections();