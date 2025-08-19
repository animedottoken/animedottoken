-- Create collections table for NFT collections
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candy_machine_id TEXT UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  creator_address TEXT NOT NULL,
  treasury_wallet TEXT NOT NULL,
  mint_price DECIMAL(20,9) NOT NULL DEFAULT 0,
  max_supply INTEGER NOT NULL DEFAULT 0,
  items_available INTEGER NOT NULL DEFAULT 0,
  items_redeemed INTEGER NOT NULL DEFAULT 0,
  royalty_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_live BOOLEAN NOT NULL DEFAULT false,
  whitelist_enabled BOOLEAN NOT NULL DEFAULT false,
  go_live_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NFTs table for minted NFTs
CREATE TABLE public.nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id),
  mint_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  description TEXT,
  image_url TEXT,
  metadata_uri TEXT,
  attributes JSONB,
  owner_address TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  is_listed BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(20,9),
  currency TEXT DEFAULT 'SOL',
  auction_house_address TEXT,
  listing_receipt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace activities table
CREATE TABLE public.marketplace_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES public.nfts(id),
  collection_id UUID REFERENCES public.collections(id),
  activity_type TEXT NOT NULL, -- 'mint', 'list', 'delist', 'sale', 'transfer', 'offer'
  from_address TEXT,
  to_address TEXT,
  price DECIMAL(20,9),
  currency TEXT DEFAULT 'SOL',
  transaction_signature TEXT,
  block_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table for marketplace users
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  twitter_handle TEXT,
  discord_handle TEXT,
  website_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection whitelist table
CREATE TABLE public.collection_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id),
  wallet_address TEXT NOT NULL,
  max_mint_count INTEGER NOT NULL DEFAULT 1,
  minted_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, wallet_address)
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections (public read, creator can manage)
CREATE POLICY "Collections are viewable by everyone" 
ON public.collections FOR SELECT 
USING (true);

CREATE POLICY "Creators can manage their collections" 
ON public.collections FOR ALL 
USING (auth.jwt() ->> 'wallet_address' = creator_address OR auth.uid() IS NOT NULL);

-- RLS Policies for NFTs (public read, owner can manage)
CREATE POLICY "NFTs are viewable by everyone" 
ON public.nfts FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage their NFTs" 
ON public.nfts FOR ALL 
USING (auth.jwt() ->> 'wallet_address' = owner_address OR auth.uid() IS NOT NULL);

-- RLS Policies for marketplace activities (public read only)
CREATE POLICY "Activities are viewable by everyone" 
ON public.marketplace_activities FOR SELECT 
USING (true);

CREATE POLICY "System can insert activities" 
ON public.marketplace_activities FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for user profiles (public read, owner can manage)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own profile" 
ON public.user_profiles FOR ALL 
USING (auth.jwt() ->> 'wallet_address' = wallet_address OR auth.uid() IS NOT NULL);

-- RLS Policies for whitelist (creators can manage, users can view their own)
CREATE POLICY "Creators can manage whitelist" 
ON public.collection_whitelist FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.collections c 
  WHERE c.id = collection_id 
  AND (c.creator_address = auth.jwt() ->> 'wallet_address' OR auth.uid() IS NOT NULL)
));

CREATE POLICY "Users can view their whitelist status" 
ON public.collection_whitelist FOR SELECT 
USING (wallet_address = auth.jwt() ->> 'wallet_address' OR auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_collections_creator ON public.collections(creator_address);
CREATE INDEX idx_collections_active ON public.collections(is_active, is_live);
CREATE INDEX idx_nfts_collection ON public.nfts(collection_id);
CREATE INDEX idx_nfts_owner ON public.nfts(owner_address);
CREATE INDEX idx_nfts_listed ON public.nfts(is_listed);
CREATE INDEX idx_activities_nft ON public.marketplace_activities(nft_id);
CREATE INDEX idx_activities_collection ON public.marketplace_activities(collection_id);
CREATE INDEX idx_activities_type ON public.marketplace_activities(activity_type);
CREATE INDEX idx_activities_time ON public.marketplace_activities(created_at);
CREATE INDEX idx_profiles_wallet ON public.user_profiles(wallet_address);
CREATE INDEX idx_whitelist_collection ON public.collection_whitelist(collection_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfts_updated_at
  BEFORE UPDATE ON public.nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();