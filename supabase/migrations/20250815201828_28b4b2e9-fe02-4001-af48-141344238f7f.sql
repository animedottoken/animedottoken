-- Add NFT address field to community_submissions table
ALTER TABLE community_submissions 
ADD COLUMN nft_address TEXT;