
-- 1) Boosted listings table
create table if not exists public.boosted_listings (
  id uuid primary key default gen_random_uuid(),
  nft_id uuid not null,
  bidder_wallet text not null,
  bid_amount numeric not null check (bid_amount >= 0),
  token_mint text not null,                 -- SPL token mint for $ANIME
  tx_signature text not null,               -- on-chain proof
  start_time timestamptz not null default now(),
  end_time timestamptz,                     -- will default via trigger to start_time + interval '24 hours'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_boost_nft foreign key (nft_id) references public.nfts(id) on delete cascade
);

-- Keep updated_at fresh
create or replace function public.update_boosted_listings_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_boosted_listings_updated_at on public.boosted_listings;
create trigger trg_boosted_listings_updated_at
before update on public.boosted_listings
for each row execute function public.update_boosted_listings_updated_at();

-- Validation + default end_time
create or replace function public.validate_boosted_listing()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- default end_time to 24h after start_time
  if new.end_time is null then
    new.end_time := (coalesce(new.start_time, now()) + interval '24 hours');
  end if;

  -- ensure logical times
  if new.end_time <= coalesce(new.start_time, now()) then
    raise exception 'end_time must be after start_time';
  end if;

  -- enforce only one active boost per NFT at a time (optional but helpful)
  if new.is_active is true then
    if exists (
      select 1 from public.boosted_listings bl
      where bl.nft_id = new.nft_id
        and bl.is_active = true
        and (tg_op = 'INSERT' or bl.id <> new.id)
    ) then
      raise exception 'An active boost already exists for this NFT';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_boosted_listings_validate on public.boosted_listings;
create trigger trg_boosted_listings_validate
before insert or update on public.boosted_listings
for each row execute function public.validate_boosted_listing();

-- Helpful indexes
create index if not exists idx_boosted_active_amount on public.boosted_listings (is_active, bid_amount desc);
create index if not exists idx_boosted_end_time on public.boosted_listings (end_time);
create index if not exists idx_boosted_nft on public.boosted_listings (nft_id);
create index if not exists idx_boosted_bidder_wallet on public.boosted_listings (bidder_wallet);

-- 2) RLS: Only owners can create boosts for their NFTs; everyone can read; updates by service role
alter table public.boosted_listings enable row level security;

-- View (read) for everyone
drop policy if exists "Boosts are viewable by everyone" on public.boosted_listings;
create policy "Boosts are viewable by everyone"
  on public.boosted_listings
  for select
  using (true);

-- Insert: only if caller owns the NFT via wallet_address in JWT
drop policy if exists "Owners can create boosts for their NFTs" on public.boosted_listings;
create policy "Owners can create boosts for their NFTs"
  on public.boosted_listings
  for insert
  with check (
    exists (
      select 1 from public.nfts n
      where n.id = boosted_listings.nft_id
        and n.owner_address = (auth.jwt() ->> 'wallet_address')
    )
  );

-- Update/Delete: system only (edge functions run with service_role)
drop policy if exists "System can manage boosts" on public.boosted_listings;
create policy "System can manage boosts"
  on public.boosted_listings
  for all
  to authenticated
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 3) Leaderboard view with rank and tier
create or replace view public.boosted_leaderboard as
select
  bl.id,
  bl.nft_id,
  bl.bid_amount,
  bl.token_mint,
  bl.bidder_wallet,
  bl.tx_signature,
  bl.start_time,
  bl.end_time,
  bl.is_active,
  n.name as nft_name,
  n.image_url as nft_image_url,
  n.owner_address,
  rank() over (order by bl.bid_amount desc, bl.start_time asc) as bid_rank,
  case
    when rank() over (order by bl.bid_amount desc, bl.start_time asc) between 1 and 3 then 'god'
    when rank() over (order by bl.bid_amount desc, bl.start_time asc) between 4 and 10 then 'top'
    else 'boosted'
  end as tier
from public.boosted_listings bl
join public.nfts n on n.id = bl.nft_id
where bl.is_active = true
  and now() < bl.end_time;

