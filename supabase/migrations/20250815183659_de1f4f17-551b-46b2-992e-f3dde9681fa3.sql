-- Create enum types first
CREATE TYPE edition_type AS ENUM ('standard', 'limited', 'exclusive');
CREATE TYPE theme_type AS ENUM ('anime', 'digital_culture', 'meme', 'ai', 'new_internet_money');

-- Add new columns to community_submissions table with proper types
ALTER TABLE public.community_submissions 
ADD COLUMN author_bio TEXT,
ADD COLUMN contact TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN edition_type edition_type DEFAULT 'standard',
ADD COLUMN theme theme_type;

-- Add constraints for tags (max 3)
ALTER TABLE public.community_submissions 
ADD CONSTRAINT tags_max_three CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 3);

-- Add constraint for author bio length (1-2 sentences, reasonable max)
ALTER TABLE public.community_submissions 
ADD CONSTRAINT author_bio_length CHECK (author_bio IS NULL OR length(author_bio) <= 200);