-- Update submission_type enum to include new values
ALTER TYPE submission_type ADD VALUE IF NOT EXISTS 'picture';
ALTER TYPE submission_type ADD VALUE IF NOT EXISTS 'music';
ALTER TYPE submission_type ADD VALUE IF NOT EXISTS 'other';

-- Update existing records that use old values to map to new ones
UPDATE community_submissions 
SET type = 'picture' 
WHERE type = 'art';

UPDATE community_submissions 
SET type = 'other' 
WHERE type IN ('meme', 'story');