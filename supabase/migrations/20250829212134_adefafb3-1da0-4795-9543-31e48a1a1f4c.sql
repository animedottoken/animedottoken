-- Phase 1: Database and Storage Changes

-- 1. Update user_profiles table to support Web2 identity
ALTER TABLE public.user_profiles 
ADD COLUMN user_id UUID UNIQUE,
ADD COLUMN nft_count INTEGER DEFAULT 0,
ADD COLUMN collection_count INTEGER DEFAULT 0;

-- Make wallet_address nullable (for Web2-only profiles)
ALTER TABLE public.user_profiles 
ALTER COLUMN wallet_address DROP NOT NULL;

-- 2. Create profile-avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-avatars', 'profile-avatars', true);

-- 3. Update RLS policies on user_profiles to support Web2 identity
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- New policies supporting both Web2 (user_id) and wallet-based access
CREATE POLICY "Users can view their own profile via auth or wallet" 
ON public.user_profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
);

CREATE POLICY "Users can update their own profile via auth or wallet" 
ON public.user_profiles 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
);

-- 4. Storage policies for profile-avatars
CREATE POLICY "Users can view all profile avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own profile avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Update existing profile-banners policies to use user_id path
DROP POLICY IF EXISTS "Users can upload their own banner" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own banner" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banner" ON storage.objects;

CREATE POLICY "Users can upload their own profile banner" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-banners' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile banner" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-banners' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile banner" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-banners' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Function to update cached asset counts
CREATE OR REPLACE FUNCTION public.update_user_asset_counts(p_wallet_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  nft_count_val INTEGER;
  collection_count_val INTEGER;
BEGIN
  -- Count NFTs owned by this wallet
  SELECT COUNT(*) INTO nft_count_val
  FROM public.nfts 
  WHERE owner_address = p_wallet_address;
  
  -- Count collections created by this wallet
  SELECT COUNT(*) INTO collection_count_val
  FROM public.collections 
  WHERE creator_address = p_wallet_address;
  
  -- Update the user profile with cached counts
  UPDATE public.user_profiles 
  SET 
    nft_count = nft_count_val,
    collection_count = collection_count_val,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;
END;
$$;

-- 7. Enhanced trigger for first-time PFP unlock
CREATE OR REPLACE FUNCTION public.handle_first_pfp_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If profile_image_url is being set for the first time, unlock PFP for free
  IF OLD.profile_image_url IS NULL AND NEW.profile_image_url IS NOT NULL AND OLD.pfp_unlock_status = false THEN
    NEW.pfp_unlock_status := true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_first_pfp_update
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_first_pfp_update();