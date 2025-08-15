-- Add new enum values for submission_type
ALTER TYPE submission_type ADD VALUE IF NOT EXISTS 'picture';
ALTER TYPE submission_type ADD VALUE IF NOT EXISTS 'music'; 
ALTER TYPE submission_type ADD VALUE IF NOT EXISTS 'other';