-- Fix all existing NFTs to have explicit_content: false as agreed
UPDATE nfts 
SET attributes = CASE 
  WHEN attributes IS NULL THEN '{"explicit_content": false}'::jsonb
  ELSE jsonb_set(
    COALESCE(attributes, '{}'::jsonb), 
    '{explicit_content}', 
    'false'::jsonb
  )
END;