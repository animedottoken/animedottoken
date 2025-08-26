-- Fix Security Definer Views by changing ownership to authenticator role
-- This ensures views run with invoker rights, not definer rights

-- Change ownership of all views from postgres to authenticator
ALTER VIEW public.boosted_leaderboard OWNER TO authenticator;
ALTER VIEW public.collection_like_counts OWNER TO authenticator;
ALTER VIEW public.collections_public OWNER TO authenticator;
ALTER VIEW public.creator_collection_like_stats OWNER TO authenticator;
ALTER VIEW public.creator_follow_stats OWNER TO authenticator;
ALTER VIEW public.creator_nft_like_stats OWNER TO authenticator;
ALTER VIEW public.creator_nft_likes_stats OWNER TO authenticator;
ALTER VIEW public.creators_public_stats OWNER TO authenticator;

-- Ensure proper permissions for the authenticator role on all underlying tables
GRANT SELECT ON public.boosted_listings TO authenticator;
GRANT SELECT ON public.nfts TO authenticator;
GRANT SELECT ON public.collection_likes TO authenticator;
GRANT SELECT ON public.collections TO authenticator;
GRANT SELECT ON public.creator_follows TO authenticator;
GRANT SELECT ON public.nft_likes TO authenticator;

-- Grant usage on views to anon and authenticated users
GRANT SELECT ON public.boosted_leaderboard TO anon, authenticated;
GRANT SELECT ON public.collection_like_counts TO anon, authenticated;
GRANT SELECT ON public.collections_public TO anon, authenticated;
GRANT SELECT ON public.creator_collection_like_stats TO anon, authenticated;
GRANT SELECT ON public.creator_follow_stats TO anon, authenticated;
GRANT SELECT ON public.creator_nft_like_stats TO anon, authenticated;
GRANT SELECT ON public.creator_nft_likes_stats TO anon, authenticated;
GRANT SELECT ON public.creators_public_stats TO anon, authenticated;