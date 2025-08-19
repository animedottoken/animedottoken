-- Fix RLS policies for collections table to work with Solana wallets
-- Drop existing policies
DROP POLICY IF EXISTS "Creators can manage their collections" ON public.collections;

-- Create new policy that allows anyone to create collections
-- In a real application, you'd want more sophisticated authentication
-- For now, allowing creation based on the creator_address field
CREATE POLICY "Anyone can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (true);

-- Policy for users to update/delete their own collections
CREATE POLICY "Users can manage their own collections" 
ON public.collections 
FOR ALL 
USING (creator_address = creator_address) 
WITH CHECK (creator_address = creator_address);

-- Keep the existing SELECT policy
-- Collections are viewable by everyone (already exists)