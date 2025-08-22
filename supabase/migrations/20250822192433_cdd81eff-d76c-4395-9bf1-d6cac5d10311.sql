-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT,
  site_description TEXT,
  onchain_description TEXT,
  image_url TEXT,
  banner_image_url TEXT,
  creator_address TEXT NOT NULL,
  treasury_wallet TEXT,
  mint_price DECIMAL DEFAULT 0,
  max_supply INTEGER DEFAULT 1000,
  items_available INTEGER DEFAULT 0,
  items_redeemed INTEGER DEFAULT 0,
  royalty_percentage DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_live BOOLEAN DEFAULT false,
  whitelist_enabled BOOLEAN DEFAULT false,
  go_live_date TIMESTAMP WITH TIME ZONE,
  mint_end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  candy_machine_id TEXT,
  slug TEXT,
  external_links JSONB DEFAULT '[]'::jsonb,
  collection_mint_address TEXT,
  verified BOOLEAN DEFAULT false,
  category TEXT,
  explicit_content BOOLEAN DEFAULT false,
  supply_mode TEXT DEFAULT 'fixed',
  locked_fields JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Users can view all collections" 
ON public.collections 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid()::text = creator_address);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid()::text = creator_address);

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid()::text = creator_address);

-- Create storage bucket for collection images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collection-images', 'collection-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for collection images
CREATE POLICY "Collection images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'collection-images');

CREATE POLICY "Users can upload collection images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'collection-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update collection images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'collection-images' AND auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();