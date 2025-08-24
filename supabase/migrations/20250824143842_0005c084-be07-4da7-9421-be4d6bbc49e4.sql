-- Enable real-time for nft_likes table
ALTER TABLE public.nft_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nft_likes;

-- Enable real-time for creator_follows table  
ALTER TABLE public.creator_follows REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_follows;

-- Enable real-time for user_profiles table (for creator stats updates)
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;