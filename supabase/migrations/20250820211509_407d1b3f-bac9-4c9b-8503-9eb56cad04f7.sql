-- Create storage bucket for NFT media
INSERT INTO storage.buckets (id, name, public) VALUES ('nft-media', 'nft-media', true);

-- Create storage policies for NFT media uploads
CREATE POLICY "Anyone can view NFT media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'nft-media');

CREATE POLICY "Authenticated users can upload NFT media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'nft-media' AND auth.jwt() IS NOT NULL);