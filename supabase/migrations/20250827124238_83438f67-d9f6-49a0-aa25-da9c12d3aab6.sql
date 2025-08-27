-- Create profile-banners bucket for user banner images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-banners', 'profile-banners', true);

-- Create RLS policies for profile banners
CREATE POLICY "Users can upload their own banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Banner images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-banners');