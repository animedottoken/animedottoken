-- Fix RLS policies to allow public read access to collections for the minting interface
-- Drop restrictive policies and add more permissive ones

DROP POLICY IF EXISTS "Creators can view their own collections" ON public.collections;
DROP POLICY IF EXISTS "System can manage collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can create collections" ON public.collections;
DROP POLICY IF EXISTS "Creators can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.collections;
DROP POLICY IF EXISTS "Anyone can create collections" ON public.collections;

-- Create new policies that allow proper access
CREATE POLICY "Anyone can view active collections" 
ON public.collections 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'wallet_address' IS NOT NULL);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (creator_address = (auth.jwt() ->> 'wallet_address'))
WITH CHECK (creator_address = (auth.jwt() ->> 'wallet_address'));

CREATE POLICY "System can manage all collections" 
ON public.collections 
FOR ALL 
USING (auth.role() = 'service_role');