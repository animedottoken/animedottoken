-- Create storage bucket for collection images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collection-images', 'collection-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for collection images
CREATE POLICY IF NOT EXISTS "Anyone can view collection images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'collection-images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload collection images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'collection-images');

CREATE POLICY IF NOT EXISTS "Users can update their own collection images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'collection-images');

CREATE POLICY IF NOT EXISTS "Users can delete their own collection images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'collection-images');