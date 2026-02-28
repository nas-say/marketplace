-- SideFlip schema
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor → New query)

-- ─── PROFILES ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id               uuid primary key default gen_random_uuid(),
  clerk_user_id    text unique not null,
  display_name     text,
  bio              text,
  location         text,
  website          text,
  twitter          text,
  github           text,
  verified         boolean default false,
  total_sales      integer default 0,
  total_earnings   bigint default 0,
  feedback_given   integer default 0,
  beta_tests_completed integer default 0,
  created_at       timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_owner_update" on profiles for update using (auth.uid()::text = clerk_user_id);
create policy "profiles_owner_insert" on profiles for insert with check (auth.uid()::text = clerk_user_id);

-- ─── LISTINGS ───────────────────────────────────────────────────────────────
create table if not exists listings (
  id                 text primary key default 'lst_' || substr(gen_random_uuid()::text, 1, 8),
  title              text not null,
  pitch              text not null,
  description        text,
  category           text not null,
  tech_stack         text[] default '{}',
  asking_price       bigint not null,
  open_to_offers     boolean default false,
  mrr                bigint default 0,
  monthly_profit     bigint default 0,
  monthly_visitors   integer default 0,
  registered_users   integer default 0,
  age                text default '<6mo',
  revenue_trend      text default 'flat' check (revenue_trend in ('up', 'flat', 'down')),
  assets_included    text[] default '{}',
  seller_id          text references profiles(clerk_user_id) on delete cascade,
  status             text default 'active' check (status in ('active', 'sold', 'draft')),
  featured           boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table listings enable row level security;

create policy "listings_public_read" on listings for select using (status = 'active' or seller_id = auth.uid()::text);
create policy "listings_owner_insert" on listings for insert with check (seller_id = auth.uid()::text);
create policy "listings_owner_update" on listings for update using (seller_id = auth.uid()::text);
create policy "listings_owner_delete" on listings for delete using (seller_id = auth.uid()::text);

-- ─── BETA TESTS ─────────────────────────────────────────────────────────────
create table if not exists beta_tests (
  id                    text primary key default 'bt_' || substr(gen_random_uuid()::text, 1, 8),
  title                 text not null,
  description           text,
  category              text,
  platform              text[] default '{}',
  feedback_types        text[] default '{}',
  spots_total           integer default 20,
  spots_filled          integer default 0,
  reward_description    text,
  testing_instructions  text,
  requirements          text,
  deadline              date,
  status                text default 'accepting' check (status in ('accepting', 'almost_full', 'closed')),
  creator_id            text references profiles(clerk_user_id) on delete cascade,
  created_at            timestamptz default now()
);

alter table beta_tests enable row level security;

create policy "beta_tests_public_read" on beta_tests for select using (true);
create policy "beta_tests_owner_insert" on beta_tests for insert with check (creator_id = auth.uid()::text);
create policy "beta_tests_owner_update" on beta_tests for update using (creator_id = auth.uid()::text);

-- ─── WATCHLIST ───────────────────────────────────────────────────────────────
create table if not exists watchlist (
  clerk_user_id  text not null,
  listing_id     text references listings(id) on delete cascade,
  created_at     timestamptz default now(),
  primary key (clerk_user_id, listing_id)
);

alter table watchlist enable row level security;

create policy "watchlist_owner_all" on watchlist using (clerk_user_id = auth.uid()::text);

-- ─── BETA APPLICATIONS ───────────────────────────────────────────────────────
create table if not exists beta_applications (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  beta_test_id   text references beta_tests(id) on delete cascade,
  status         text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at     timestamptz default now(),
  unique (clerk_user_id, beta_test_id)
);

alter table beta_applications enable row level security;

create policy "applications_owner_all" on beta_applications using (clerk_user_id = auth.uid()::text);
create policy "applications_creator_read" on beta_applications for select using (
  beta_test_id in (select id from beta_tests where creator_id = auth.uid()::text)
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_updated_at
  before update on listings
  for each row execute function update_updated_at();

-- ─── INCREMENT SPOTS FILLED ──────────────────────────────────────────────────
create or replace function increment_spots_filled(beta_test_id text)
returns void as $$
begin
  update beta_tests
  set spots_filled = spots_filled + 1,
      status = case
        when (spots_filled + 1) >= spots_total then 'closed'
        when (spots_filled + 1) >= spots_total * 0.8 then 'almost_full'
        else status
      end
  where id = beta_test_id;
end;
$$ language plpgsql security definer;
