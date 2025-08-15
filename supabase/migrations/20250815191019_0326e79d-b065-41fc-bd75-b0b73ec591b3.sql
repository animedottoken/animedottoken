-- Update existing records to use new type values
UPDATE community_submissions 
SET type = 'picture' 
WHERE type = 'art';

UPDATE community_submissions 
SET type = 'other' 
WHERE type IN ('meme', 'story');