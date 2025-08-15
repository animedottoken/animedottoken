-- Create enum types for community submissions
CREATE TYPE submission_type AS ENUM ('art', 'meme', 'story');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE submission_source AS ENUM ('discord', 'twitter', 'form');

-- Create community_submissions table
CREATE TABLE public.community_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  author TEXT NOT NULL,
  type submission_type NOT NULL DEFAULT 'art',
  status submission_status NOT NULL DEFAULT 'pending',
  submission_source submission_source NOT NULL DEFAULT 'form',
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create featured_content table
CREATE TABLE public.featured_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.community_submissions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 3),
  featured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(position)
);

-- Enable Row Level Security
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_submissions
CREATE POLICY "Anyone can view approved submissions" 
ON public.community_submissions 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Anyone can create submissions" 
ON public.community_submissions 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for featured_content
CREATE POLICY "Anyone can view featured content" 
ON public.featured_content 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_community_submissions_updated_at
BEFORE UPDATE ON public.community_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_community_submissions_status ON public.community_submissions(status);
CREATE INDEX idx_community_submissions_type ON public.community_submissions(type);
CREATE INDEX idx_featured_content_position ON public.featured_content(position);

-- Insert some sample data
INSERT INTO public.community_submissions (image_url, caption, author, type, status) VALUES
('/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png', 'Amazing ANIME fan art showcasing the vibrant community spirit!', '@CryptoArtist', 'art', 'approved'),
('/lovable-uploads/b964ec40-31a7-483d-9cf3-f2fbd588edb8.png', 'Diamond hands forever! 💎🙌', '@AnimeHodler', 'meme', 'approved');

-- Feature the sample submissions
INSERT INTO public.featured_content (submission_id, position) 
SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) 
FROM public.community_submissions 
WHERE status = 'approved' 
LIMIT 2;