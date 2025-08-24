
-- 1) Table for collection likes
create table if not exists public.collection_likes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_wallet text not null
);

-- Prevent duplicate likes per (collection, wallet)
create unique index if not exists collection_likes_collection_wallet_uniq
  on public.collection_likes (collection_id, user_wallet);

-- Helpful indexes
create index if not exists collection_likes_collection_id_idx
  on public.collection_likes (collection_id);

create index if not exists collection_likes_user_wallet_idx
  on public.collection_likes (user_wallet);

-- Enable RLS and add policies mirroring nft_likes
alter table public.collection_likes enable row level security;

-- Anyone can view likes
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'collection_likes'
      and policyname = 'Anyone can view collection likes'
  ) then
    create policy "Anyone can view collection likes"
      on public.collection_likes
      for select
      using (true);
  end if;
end$$;

-- Users can like collections (or service role)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'collection_likes'
      and policyname = 'Users can like collections'
  ) then
    create policy "Users can like collections"
      on public.collection_likes
      for insert
      with check ((user_wallet = (auth.jwt() ->> 'wallet_address')) or (auth.role() = 'service_role'));
  end if;
end$$;

-- Users can unlike collections (or service role)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'collection_likes'
      and policyname = 'Users can unlike collections'
  ) then
    create policy "Users can unlike collections"
      on public.collection_likes
      for delete
      using ((user_wallet = (auth.jwt() ->> 'wallet_address')) or (auth.role() = 'service_role'));
  end if;
end$$;

-- 2) View: like counts per collection
create or replace view public.collection_like_counts as
select
  cl.collection_id,
  count(*)::bigint as like_count
from public.collection_likes cl
group by cl.collection_id;

-- 3) View: aggregate collection-like counts per creator (optional, useful for headers)
create or replace view public.creator_collection_like_stats as
select
  c.creator_address as creator_wallet,
  count(*)::bigint as collection_likes_count
from public.collection_likes cl
join public.collections c on c.id = cl.collection_id
group by c.creator_address;
