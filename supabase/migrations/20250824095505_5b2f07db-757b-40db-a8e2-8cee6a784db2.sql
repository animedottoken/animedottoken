
-- 1) Table to store per-user likes on NFTs
create table if not exists public.nft_likes (
  id uuid primary key default gen_random_uuid(),
  user_wallet text not null,
  nft_id uuid not null references public.nfts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_wallet, nft_id)
);

alter table public.nft_likes enable row level security;

-- Allow anyone to read like counts
create policy "Anyone can view nft likes"
  on public.nft_likes
  for select
  using (true);

-- Allow users to like NFTs (directly with JWT), or via service role
create policy "Users can like nfts"
  on public.nft_likes
  for insert
  with check (
    (user_wallet = (auth.jwt() ->> 'wallet_address')) or auth.role() = 'service_role'
  );

-- Allow users to unlike their own likes, or via service role
create policy "Users can unlike nfts"
  on public.nft_likes
  for delete
  using (
    (user_wallet = (auth.jwt() ->> 'wallet_address')) or auth.role() = 'service_role'
  );

-- Helpful indexes
create index if not exists idx_nft_likes_nft_id on public.nft_likes(nft_id);
create index if not exists idx_nft_likes_user_wallet on public.nft_likes(user_wallet);


-- 2) Table to store creator follows (followers)
create table if not exists public.creator_follows (
  id uuid primary key default gen_random_uuid(),
  follower_wallet text not null,
  creator_wallet text not null,
  created_at timestamptz not null default now(),
  unique (follower_wallet, creator_wallet)
);

alter table public.creator_follows enable row level security;

-- Anyone can read follower counts
create policy "Anyone can view creator follows"
  on public.creator_follows
  for select
  using (true);

-- Users can follow creators (directly with JWT), or via service role
create policy "Users can follow creators"
  on public.creator_follows
  for insert
  with check (
    (follower_wallet = (auth.jwt() ->> 'wallet_address')) or auth.role() = 'service_role'
  );

-- Users can unfollow creators (their own rows), or via service role
create policy "Users can unfollow creators"
  on public.creator_follows
  for delete
  using (
    (follower_wallet = (auth.jwt() ->> 'wallet_address')) or auth.role() = 'service_role'
  );

-- Helpful indexes
create index if not exists idx_creator_follows_creator on public.creator_follows(creator_wallet);
create index if not exists idx_creator_follows_follower on public.creator_follows(follower_wallet);


-- 3) Stats views

-- Followers per creator
create or replace view public.creator_follow_stats as
select
  cf.creator_wallet,
  count(*)::bigint as follower_count
from public.creator_follows cf
group by cf.creator_wallet;

-- Total likes across each creator's NFTs
create or replace view public.creator_nft_like_stats as
select
  n.creator_address as creator_wallet,
  count(l.id)::bigint as nft_likes_count
from public.nft_likes l
join public.nfts n on n.id = l.nft_id
group by n.creator_address;

-- Combined public creator stats
create or replace view public.creators_public_stats as
select
  up.wallet_address,
  coalesce(f.follower_count, 0) as follower_count,
  coalesce(l.nft_likes_count, 0) as nft_likes_count
from public.user_profiles up
left join public.creator_follow_stats f on f.creator_wallet = up.wallet_address
left join public.creator_nft_like_stats l on l.creator_wallet = up.wallet_address;
