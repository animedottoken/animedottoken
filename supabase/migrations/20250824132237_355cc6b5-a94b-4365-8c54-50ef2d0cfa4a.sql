-- First, let's create a view that properly calculates NFT likes count for creators
CREATE OR REPLACE VIEW creator_nft_likes_stats AS
SELECT 
  n.creator_address as creator_wallet,
  COUNT(nl.id) as nft_likes_count
FROM nfts n
LEFT JOIN nft_likes nl ON n.id = nl.nft_id
GROUP BY n.creator_address;

-- Now update the creators_public_stats view to properly join with follow and like stats
CREATE OR REPLACE VIEW creators_public_stats AS
SELECT 
  up.wallet_address,
  COALESCE(cf.follower_count, 0) as follower_count,
  COALESCE(cnl.nft_likes_count, 0) as nft_likes_count
FROM user_profiles up
LEFT JOIN (
  SELECT 
    creator_wallet,
    COUNT(*) as follower_count
  FROM creator_follows
  GROUP BY creator_wallet
) cf ON up.wallet_address = cf.creator_wallet
LEFT JOIN creator_nft_likes_stats cnl ON up.wallet_address = cnl.creator_wallet;