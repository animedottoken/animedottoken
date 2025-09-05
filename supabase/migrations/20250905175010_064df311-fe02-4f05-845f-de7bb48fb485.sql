
-- 1) Backfill creator_user_id for existing NFTs and Collections
UPDATE public.nfts n
SET creator_user_id = up.user_id
FROM public.user_profiles up
WHERE n.creator_user_id IS NULL
  AND up.user_id IS NOT NULL
  AND up.wallet_address = n.creator_address;

UPDATE public.collections c
SET creator_user_id = up.user_id
FROM public.user_profiles up
WHERE c.creator_user_id IS NULL
  AND up.user_id IS NOT NULL
  AND up.wallet_address = c.creator_address;

-- 2) Create trigger functions to auto-populate creator_user_id

CREATE OR REPLACE FUNCTION public.populate_creator_user_id_for_nfts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mapped_user_id uuid;
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    -- Prefer the authenticated user id if available
    NEW.creator_user_id := auth.uid();
    IF NEW.creator_user_id IS NULL THEN
      -- Fallback: map by creator_address -> user_profiles.wallet_address
      SELECT up.user_id INTO mapped_user_id
      FROM public.user_profiles up
      WHERE up.wallet_address = NEW.creator_address
      LIMIT 1;

      IF mapped_user_id IS NOT NULL THEN
        NEW.creator_user_id := mapped_user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_creator_user_id_for_collections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mapped_user_id uuid;
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    -- Prefer the authenticated user id if available
    NEW.creator_user_id := auth.uid();
    IF NEW.creator_user_id IS NULL THEN
      -- Fallback: map by creator_address -> user_profiles.wallet_address
      SELECT up.user_id INTO mapped_user_id
      FROM public.user_profiles up
      WHERE up.wallet_address = NEW.creator_address
      LIMIT 1;

      IF mapped_user_id IS NOT NULL THEN
        NEW.creator_user_id := mapped_user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Attach triggers (for inserts and when creator_address changes)

DROP TRIGGER IF EXISTS nfts_set_creator_user_id ON public.nfts;
CREATE TRIGGER nfts_set_creator_user_id
BEFORE INSERT OR UPDATE OF creator_address ON public.nfts
FOR EACH ROW
EXECUTE FUNCTION public.populate_creator_user_id_for_nfts();

DROP TRIGGER IF EXISTS collections_set_creator_user_id ON public.collections;
CREATE TRIGGER collections_set_creator_user_id
BEFORE INSERT OR UPDATE OF creator_address ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.populate_creator_user_id_for_collections();

-- 4) Helpful indexes for stats lookups
CREATE INDEX IF NOT EXISTS idx_nfts_creator_user_id ON public.nfts (creator_user_id);
CREATE INDEX IF NOT EXISTS idx_collections_creator_user_id ON public.collections (creator_user_id);
