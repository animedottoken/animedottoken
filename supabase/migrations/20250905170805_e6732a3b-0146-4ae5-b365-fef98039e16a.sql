
-- 1) De-duplicate any existing follow rows before adding a unique constraint
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY follower_user_id, creator_user_id ORDER BY created_at, id) AS rn
  FROM public.creator_follows
)
DELETE FROM public.creator_follows cf
USING ranked r
WHERE cf.id = r.id
  AND r.rn > 1;

-- 2) Add a unique constraint so a user can follow another user only once
ALTER TABLE public.creator_follows
  ADD CONSTRAINT creator_follows_unique UNIQUE (follower_user_id, creator_user_id);

-- 3) Prevent self-follows at the DB layer
ALTER TABLE public.creator_follows
  ADD CONSTRAINT creator_follows_no_self_follow CHECK (follower_user_id <> creator_user_id);

-- 4) Add indexes to speed up follower/following lookups
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator_user
  ON public.creator_follows (creator_user_id);

CREATE INDEX IF NOT EXISTS idx_creator_follows_follower_user
  ON public.creator_follows (follower_user_id);
