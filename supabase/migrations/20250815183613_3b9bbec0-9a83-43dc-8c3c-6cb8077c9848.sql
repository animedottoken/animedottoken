-- Add new columns to community_submissions table for enhanced NFT submission
ALTER TABLE public.community_submissions 
ADD COLUMN author_bio TEXT,
ADD COLUMN contact TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN edition_type TEXT DEFAULT 'standard',
ADD COLUMN theme TEXT;

-- Create enum for edition types
CREATE TYPE edition_type AS ENUM ('standard', 'limited', 'exclusive');

-- Create enum for themes
CREATE TYPE theme_type AS ENUM ('anime', 'digital_culture', 'meme', 'ai', 'new_internet_money');

-- Update the column to use the enum
ALTER TABLE public.community_submissions 
ALTER COLUMN edition_type TYPE edition_type USING edition_type::edition_type,
ALTER COLUMN theme TYPE theme_type USING theme::theme_type;

-- Add constraints for tags (max 3)
ALTER TABLE public.community_submissions 
ADD CONSTRAINT tags_max_three CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 3);

-- Add constraint for author bio length (1-2 sentences, reasonable max)
ALTER TABLE public.community_submissions 
ADD CONSTRAINT author_bio_length CHECK (author_bio IS NULL OR length(author_bio) <= 200);

-- Update existing submission types to include more options
DROP TYPE submission_type;
CREATE TYPE submission_type AS ENUM ('art', 'meme', 'story', 'animation', 'video');

-- Update the column to use the new enum
ALTER TABLE public.community_submissions 
ALTER COLUMN type TYPE submission_type USING type::submission_type;