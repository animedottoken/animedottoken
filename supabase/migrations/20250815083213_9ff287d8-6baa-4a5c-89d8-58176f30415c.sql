-- Clear existing featured content
DELETE FROM public.featured_content;

-- Add new sample submissions with the requested layout
INSERT INTO public.community_submissions (image_url, caption, author, type, status, submission_source) VALUES
('/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png', 'Epic ANIME fan art shared from our Discord community! 🎨✨', '@DiscordArtist', 'art', 'approved', 'discord'),
('/lovable-uploads/b964ec40-31a7-483d-9cf3-f2fbd588edb8.png', 'When ANIME hits different! Diamond hands forever! 💎🙌 #ANIME', '@TwitterMemer', 'meme', 'approved', 'twitter');

-- Feature submissions in positions 1 and 3 (leaving middle slot empty)
INSERT INTO public.featured_content (submission_id, position) 
SELECT id, CASE 
  WHEN submission_source = 'discord' THEN 1 
  WHEN submission_source = 'twitter' THEN 3 
END as position
FROM public.community_submissions 
WHERE status = 'approved' AND submission_source IN ('discord', 'twitter');