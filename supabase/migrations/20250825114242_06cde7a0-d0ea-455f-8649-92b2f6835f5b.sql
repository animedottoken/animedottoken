-- Backfill existing NFTs with default values for listing streamlining
-- Set explicit_content to false where missing
UPDATE nfts 
SET attributes = jsonb_set(
  COALESCE(attributes, '{}'::jsonb), 
  '{explicit_content}', 
  'false'::jsonb, 
  true
) 
WHERE attributes->'explicit_content' IS NULL;

-- Set category to "Other" where missing or empty
UPDATE nfts 
SET attributes = jsonb_set(
  COALESCE(attributes, '{}'::jsonb), 
  '{category}', 
  '"Other"'::jsonb, 
  true
) 
WHERE (attributes->>'category' IS NULL OR TRIM(attributes->>'category') = '');

-- Set royalty_percentage to 0 where missing
UPDATE nfts 
SET attributes = jsonb_set(
  COALESCE(attributes, '{}'::jsonb), 
  '{royalty_percentage}', 
  '0'::jsonb, 
  true
) 
WHERE attributes->'royalty_percentage' IS NULL;