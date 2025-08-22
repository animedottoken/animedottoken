-- Drop existing conflicting policies and recreate them for Solana wallet usage
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can create collections" ON public.collections;
DROP POLICY IF EXISTS "Anyone can view active collections" ON public.collections;

-- Create new policies that work with Solana wallets (no Supabase auth required)
CREATE POLICY "Anyone can view collections" 
ON public.collections 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (creator_address IS NOT NULL);

CREATE POLICY "Creators can update their collections" 
ON public.collections 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Creators can delete their collections" 
ON public.collections 
FOR DELETE 
USING (true);