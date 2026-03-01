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
  status             text default 'pending_verification' check (status in ('active', 'sold', 'draft', 'pending_verification')),
  ownership_verified boolean default false,
  ownership_verification_method text check (ownership_verification_method in ('repo', 'domain', 'manual')),
  ownership_verified_at timestamptz,
  featured           boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table listings enable row level security;

create policy "listings_public_read" on listings for select using (status = 'active' or seller_id = auth.uid()::text);
create policy "listings_owner_insert" on listings for insert with check (seller_id = auth.uid()::text);
create policy "listings_owner_update" on listings for update using (seller_id = auth.uid()::text);
create policy "listings_owner_delete" on listings for delete using (seller_id = auth.uid()::text);

-- Backfill columns / checks for existing projects where listings table already exists
alter table listings add column if not exists ownership_verified boolean default false;
alter table listings add column if not exists ownership_verification_method text;
alter table listings add column if not exists ownership_verified_at timestamptz;

do $$ begin
  alter table listings drop constraint if exists listings_status_check;
  alter table listings add constraint listings_status_check check (
    status in ('active', 'sold', 'draft', 'pending_verification')
  );
exception
  when duplicate_object then null;
end $$;

alter table listings alter column status set default 'pending_verification';

do $$ begin
  alter table listings drop constraint if exists listings_ownership_verification_method_check;
  alter table listings add constraint listings_ownership_verification_method_check check (
    ownership_verification_method in ('repo', 'domain', 'manual') or ownership_verification_method is null
  );
exception
  when duplicate_object then null;
end $$;

-- ─── LISTING OWNERSHIP VERIFICATION ───────────────────────────────────────────
create table if not exists listing_ownership_verifications (
  id               uuid primary key default gen_random_uuid(),
  listing_id       text not null references listings(id) on delete cascade,
  seller_id        text not null references profiles(clerk_user_id) on delete cascade,
  method           text not null check (method in ('repo', 'domain', 'manual')),
  target           text,
  challenge_token  text,
  status           text not null default 'pending' check (status in ('pending', 'verified', 'manual_requested', 'rejected')),
  note             text,
  last_error       text,
  created_at       timestamptz default now(),
  verified_at      timestamptz
);

create index if not exists idx_listing_ownership_verifications_listing_created
  on listing_ownership_verifications(listing_id, created_at desc);

alter table listing_ownership_verifications enable row level security;
drop policy if exists "listing_ownership_verifications_owner_select" on listing_ownership_verifications;
drop policy if exists "listing_ownership_verifications_owner_insert" on listing_ownership_verifications;
drop policy if exists "listing_ownership_verifications_owner_update" on listing_ownership_verifications;
drop policy if exists "listing_ownership_verifications_owner_delete" on listing_ownership_verifications;

create policy "listing_ownership_verifications_owner_select" on listing_ownership_verifications
  for select using (seller_id = auth.uid()::text);
create policy "listing_ownership_verifications_owner_insert" on listing_ownership_verifications
  for insert with check (seller_id = auth.uid()::text);
create policy "listing_ownership_verifications_owner_update" on listing_ownership_verifications
  for update using (seller_id = auth.uid()::text);
create policy "listing_ownership_verifications_owner_delete" on listing_ownership_verifications
  for delete using (seller_id = auth.uid()::text);

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
  reward_type           text default 'cash' check (reward_type in ('cash', 'premium_access')),
  reward_currency       text default 'INR',
  reward_amount_minor   bigint default 0,
  reward_pool_total_minor bigint default 0,
  reward_pool_funded_minor bigint default 0,
  reward_pool_status    text default 'not_required' check (reward_pool_status in ('not_required', 'pending', 'partial', 'funded')),
  reward_pool_order_id  text,
  reward_pool_payment_id text,
  reward_pool_funded_at timestamptz,
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

-- Backfill columns for existing projects where beta_tests table already exists
alter table beta_tests add column if not exists reward_type text default 'cash';
alter table beta_tests add column if not exists reward_currency text default 'INR';
alter table beta_tests add column if not exists reward_amount_minor bigint default 0;
alter table beta_tests add column if not exists reward_pool_total_minor bigint default 0;
alter table beta_tests add column if not exists reward_pool_funded_minor bigint default 0;
alter table beta_tests add column if not exists reward_pool_status text default 'not_required';
alter table beta_tests add column if not exists reward_pool_order_id text;
alter table beta_tests add column if not exists reward_pool_payment_id text;
alter table beta_tests add column if not exists reward_pool_funded_at timestamptz;

-- Normalize legacy reward types from older schema variants.
update beta_tests
set reward_type = 'premium_access'
where reward_type in ('credits', 'free_access');

do $$ begin
  alter table beta_tests drop constraint if exists beta_tests_reward_type_check;
  alter table beta_tests add constraint beta_tests_reward_type_check check (
    reward_type in ('cash', 'premium_access')
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table beta_tests add constraint beta_tests_reward_pool_status_check check (reward_pool_status in ('not_required', 'pending', 'partial', 'funded'));
exception
  when duplicate_object then null;
end $$;

-- ─── WATCHLIST ───────────────────────────────────────────────────────────────
create table if not exists watchlist (
  clerk_user_id  text not null,
  listing_id     text references listings(id) on delete cascade,
  created_at     timestamptz default now(),
  primary key (clerk_user_id, listing_id)
);

alter table watchlist enable row level security;

create policy "watchlist_owner_all" on watchlist using (clerk_user_id = auth.uid()::text);

-- ─── CONNECTS ────────────────────────────────────────────────────────────────
create table if not exists connects_balance (
  clerk_user_id  text primary key,
  balance        integer not null default 0 check (balance >= 0),
  updated_at     timestamptz default now()
);

create table if not exists unlocked_listings (
  clerk_user_id  text not null,
  listing_id     text references listings(id) on delete cascade,
  created_at     timestamptz default now(),
  primary key (clerk_user_id, listing_id)
);

create table if not exists connects_transactions (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  amount         integer not null,
  type           text not null,
  description    text,
  listing_id     text references listings(id) on delete set null,
  created_at     timestamptz default now()
);

create index if not exists idx_connects_transactions_user_created_at
  on connects_transactions(clerk_user_id, created_at desc);

create index if not exists idx_listings_seller_id
  on listings(seller_id);

alter table connects_balance enable row level security;
alter table unlocked_listings enable row level security;
alter table connects_transactions enable row level security;

create policy "connects_balance_owner_all" on connects_balance using (clerk_user_id = auth.uid()::text);
create policy "unlocked_listings_owner_all" on unlocked_listings using (clerk_user_id = auth.uid()::text);
create policy "connects_transactions_owner_read" on connects_transactions for select using (clerk_user_id = auth.uid()::text);

-- ─── PAYMENT INTEREST SIGNALS ────────────────────────────────────────────────
create table if not exists payment_interest_signals (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  feature        text not null,
  country_code   text,
  currency       text,
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz default now()
);

create index if not exists idx_payment_interest_signals_created_at
  on payment_interest_signals(created_at desc);
create index if not exists idx_payment_interest_signals_guard_lookup
  on payment_interest_signals(clerk_user_id, feature, created_at desc);

alter table payment_interest_signals enable row level security;
create policy "payment_interest_signals_owner_read" on payment_interest_signals for select using (
  clerk_user_id = auth.uid()::text
);

-- ─── BETA APPLICATIONS ───────────────────────────────────────────────────────
create table if not exists beta_applications (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  beta_test_id   text references beta_tests(id) on delete cascade,
  status         text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  upi_id         text,
  applicant_email text,
  payout_gross_minor bigint,
  payout_fee_minor bigint,
  payout_net_minor bigint,
  payout_status  text default 'pending' check (payout_status in ('pending', 'paid', 'failed')),
  payout_paid_at timestamptz,
  payout_note    text,
  created_at     timestamptz default now(),
  unique (clerk_user_id, beta_test_id)
);

alter table beta_applications enable row level security;

create policy "applications_owner_all" on beta_applications using (clerk_user_id = auth.uid()::text);
create policy "applications_creator_read" on beta_applications for select using (
  beta_test_id in (select id from beta_tests where creator_id = auth.uid()::text)
);

create index if not exists idx_beta_applications_status_payout_created
  on beta_applications(beta_test_id, status, payout_status, created_at desc);

-- ─── BETA PAYOUT AUDIT LOG (IMMUTABLE) ─────────────────────────────────────
create table if not exists beta_payout_audit_log (
  id                 uuid primary key default gen_random_uuid(),
  beta_test_id       text not null references beta_tests(id) on delete cascade,
  applicant_user_id  text not null,
  previous_status    text not null check (previous_status in ('pending', 'paid', 'failed')),
  next_status        text not null check (next_status in ('pending', 'paid', 'failed')),
  payout_note        text,
  admin_user_id      text not null,
  created_at         timestamptz default now()
);
alter table beta_payout_audit_log enable row level security;

create index if not exists idx_beta_payout_audit_log_created
  on beta_payout_audit_log(created_at desc);
create index if not exists idx_beta_payout_audit_log_lookup
  on beta_payout_audit_log(beta_test_id, applicant_user_id, created_at desc);

-- ─── ADMIN NOTIFICATIONS (PERSISTENT OPS INBOX) ─────────────────────────────
create table if not exists admin_notifications (
  id             uuid primary key default gen_random_uuid(),
  dedupe_key     text unique,
  source         text not null default 'manual',
  level          text not null default 'info' check (level in ('critical', 'warning', 'info', 'success')),
  title          text not null,
  message        text not null,
  href           text,
  status         text not null default 'open' check (status in ('open', 'snoozed', 'resolved')),
  snoozed_until  timestamptz,
  resolved_at    timestamptz,
  resolved_by    text,
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists idx_admin_notifications_status_created
  on admin_notifications(status, created_at desc);
create index if not exists idx_admin_notifications_source_created
  on admin_notifications(source, created_at desc);

alter table admin_notifications enable row level security;

-- ─── BETA FEEDBACK ───────────────────────────────────────────────────────────
create table if not exists beta_feedback (
  id             uuid primary key default gen_random_uuid(),
  beta_test_id   text references beta_tests(id) on delete cascade,
  clerk_user_id  text not null,
  rating         integer check (rating >= 1 and rating <= 5),
  comment        text,
  feedback_type  text,
  created_at     timestamptz default now()
);

create index if not exists idx_beta_feedback_test
  on beta_feedback(beta_test_id, created_at desc);

alter table beta_feedback enable row level security;
drop policy if exists "beta_feedback_tester_insert" on beta_feedback;
drop policy if exists "beta_feedback_tester_read" on beta_feedback;
drop policy if exists "beta_feedback_creator_read" on beta_feedback;

create policy "beta_feedback_tester_insert" on beta_feedback
  for insert with check (clerk_user_id = auth.uid()::text);

create policy "beta_feedback_tester_read" on beta_feedback
  for select using (clerk_user_id = auth.uid()::text);

create policy "beta_feedback_creator_read" on beta_feedback
  for select using (
    beta_test_id in (select id from beta_tests where creator_id = auth.uid()::text)
  );

-- ─── BETA REWARD PAYMENTS ─────────────────────────────────────────────────────
create table if not exists beta_reward_payments (
  id             uuid primary key default gen_random_uuid(),
  beta_test_id   text references beta_tests(id) on delete cascade,
  creator_id     text not null,
  order_id       text not null,
  payment_id     text not null unique,
  amount_minor   bigint not null,
  currency       text not null default 'INR',
  status         text not null default 'captured',
  created_at     timestamptz default now()
);

create index if not exists idx_beta_reward_payments_test
  on beta_reward_payments(beta_test_id, created_at desc);

alter table beta_reward_payments enable row level security;
create policy "beta_reward_payments_creator_read" on beta_reward_payments for select using (
  creator_id = auth.uid()::text
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
  where id = beta_test_id
    and spots_filled < spots_total;
end;
$$ language plpgsql security definer;

-- ─── ATOMIC BETA APPLY ───────────────────────────────────────────────────────
create or replace function apply_to_beta_test_atomic(
  p_clerk_user_id text,
  p_beta_test_id text
)
returns text as $$
declare
  v_reward_type text;
  v_pool_total_minor bigint;
  v_pool_status text;
  v_spots_filled integer;
  v_spots_total integer;
  v_status text;
begin
  select
    reward_type,
    coalesce(reward_pool_total_minor, 0),
    coalesce(reward_pool_status, 'not_required'),
    coalesce(spots_filled, 0),
    coalesce(spots_total, 0),
    coalesce(status, 'accepting')
  into
    v_reward_type,
    v_pool_total_minor,
    v_pool_status,
    v_spots_filled,
    v_spots_total,
    v_status
  from beta_tests
  where id = p_beta_test_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_reward_type = 'cash' and v_pool_total_minor > 0 and v_pool_status <> 'funded' then
    return 'funding_locked';
  end if;

  if v_status = 'closed' or v_spots_filled >= v_spots_total then
    return 'full';
  end if;

  insert into beta_applications (clerk_user_id, beta_test_id)
  values (p_clerk_user_id, p_beta_test_id)
  on conflict (clerk_user_id, beta_test_id) do nothing;

  if not found then
    return 'already_applied';
  end if;

  update beta_tests
  set spots_filled = spots_filled + 1,
      status = case
        when (spots_filled + 1) >= spots_total then 'closed'
        when (spots_filled + 1) >= spots_total * 0.8 then 'almost_full'
        else status
      end
  where id = p_beta_test_id
    and spots_filled < spots_total;

  if not found then
    delete from beta_applications
    where clerk_user_id = p_clerk_user_id
      and beta_test_id = p_beta_test_id;
    return 'full';
  end if;

  return 'applied';
end;
$$ language plpgsql security definer set search_path = public;

-- ─── ATOMIC LISTING UNLOCK ───────────────────────────────────────────────────
create or replace function unlock_listing_atomic(
  p_clerk_user_id text,
  p_listing_id text,
  p_cost integer
)
returns text as $$
declare
  v_balance integer;
begin
  if p_cost <= 0 then
    return 'already_unlocked';
  end if;

  if exists (
    select 1
    from unlocked_listings
    where clerk_user_id = p_clerk_user_id
      and listing_id = p_listing_id
  ) then
    return 'already_unlocked';
  end if;

  insert into connects_balance (clerk_user_id, balance, updated_at)
  values (p_clerk_user_id, 0, now())
  on conflict (clerk_user_id) do nothing;

  select balance
  into v_balance
  from connects_balance
  where clerk_user_id = p_clerk_user_id
  for update;

  if coalesce(v_balance, 0) < p_cost then
    return 'insufficient';
  end if;

  update connects_balance
  set balance = balance - p_cost,
      updated_at = now()
  where clerk_user_id = p_clerk_user_id;

  insert into unlocked_listings (clerk_user_id, listing_id)
  values (p_clerk_user_id, p_listing_id)
  on conflict (clerk_user_id, listing_id) do nothing;

  if not found then
    update connects_balance
    set balance = balance + p_cost,
        updated_at = now()
    where clerk_user_id = p_clerk_user_id;
    return 'already_unlocked';
  end if;

  insert into connects_transactions (clerk_user_id, amount, type, description, listing_id)
  values (p_clerk_user_id, -p_cost, 'unlock', 'Seller info unlocked', p_listing_id);

  return 'unlocked';
end;
$$ language plpgsql security definer set search_path = public;

-- ─── MIGRATIONS: UPI / EMAIL ON APPLICATIONS ─────────────────────────────────
-- Run these in Supabase SQL Editor if upgrading an existing database.
alter table beta_applications add column if not exists upi_id text;
alter table beta_applications add column if not exists applicant_email text;
alter table beta_applications add column if not exists payout_status text default 'pending';
alter table beta_applications add column if not exists payout_paid_at timestamptz;
alter table beta_applications add column if not exists payout_note text;
alter table beta_applications add column if not exists payout_gross_minor bigint;
alter table beta_applications add column if not exists payout_fee_minor bigint;
alter table beta_applications add column if not exists payout_net_minor bigint;
update beta_applications set payout_status = 'pending' where payout_status is null;

update beta_applications as ba
set
  payout_gross_minor = bt.reward_amount_minor,
  payout_fee_minor = ceil(bt.reward_amount_minor * 0.05)::bigint,
  payout_net_minor = greatest(bt.reward_amount_minor - ceil(bt.reward_amount_minor * 0.05)::bigint, 0)
from beta_tests bt
where
  ba.beta_test_id = bt.id
  and ba.status = 'accepted'
  and bt.reward_type = 'cash'
  and (
    ba.payout_gross_minor is null
    or ba.payout_fee_minor is null
    or ba.payout_net_minor is null
  );

do $$ begin
  alter table beta_applications drop constraint if exists beta_applications_payout_status_check;
  alter table beta_applications add constraint beta_applications_payout_status_check check (
    payout_status in ('pending', 'paid', 'failed')
  );
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_beta_applications_status_payout_created
  on beta_applications(beta_test_id, status, payout_status, created_at desc);

create table if not exists beta_payout_audit_log (
  id                 uuid primary key default gen_random_uuid(),
  beta_test_id       text not null references beta_tests(id) on delete cascade,
  applicant_user_id  text not null,
  previous_status    text not null check (previous_status in ('pending', 'paid', 'failed')),
  next_status        text not null check (next_status in ('pending', 'paid', 'failed')),
  payout_note        text,
  admin_user_id      text not null,
  created_at         timestamptz default now()
);
alter table beta_payout_audit_log enable row level security;

create index if not exists idx_beta_payout_audit_log_created
  on beta_payout_audit_log(created_at desc);
create index if not exists idx_beta_payout_audit_log_lookup
  on beta_payout_audit_log(beta_test_id, applicant_user_id, created_at desc);

alter table profiles add column if not exists upi_id text;

-- ─── MIGRATIONS: ADMIN NOTIFICATIONS ────────────────────────────────────────
create table if not exists admin_notifications (
  id             uuid primary key default gen_random_uuid(),
  dedupe_key     text unique,
  source         text not null default 'manual',
  level          text not null default 'info',
  title          text not null,
  message        text not null,
  href           text,
  status         text not null default 'open',
  snoozed_until  timestamptz,
  resolved_at    timestamptz,
  resolved_by    text,
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table admin_notifications add column if not exists dedupe_key text;
alter table admin_notifications add column if not exists source text default 'manual';
alter table admin_notifications add column if not exists level text default 'info';
alter table admin_notifications add column if not exists title text;
alter table admin_notifications add column if not exists message text;
alter table admin_notifications add column if not exists href text;
alter table admin_notifications add column if not exists status text default 'open';
alter table admin_notifications add column if not exists snoozed_until timestamptz;
alter table admin_notifications add column if not exists resolved_at timestamptz;
alter table admin_notifications add column if not exists resolved_by text;
alter table admin_notifications add column if not exists metadata jsonb default '{}'::jsonb;
alter table admin_notifications add column if not exists created_at timestamptz default now();
alter table admin_notifications add column if not exists updated_at timestamptz default now();

update admin_notifications set source = 'manual' where source is null;
update admin_notifications set level = 'info' where level is null;
update admin_notifications set status = 'open' where status is null;
update admin_notifications set title = coalesce(title, 'Admin notification') where title is null;
update admin_notifications set message = coalesce(message, '') where message is null;

do $$ begin
  alter table admin_notifications drop constraint if exists admin_notifications_level_check;
  alter table admin_notifications add constraint admin_notifications_level_check check (
    level in ('critical', 'warning', 'info', 'success')
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table admin_notifications drop constraint if exists admin_notifications_status_check;
  alter table admin_notifications add constraint admin_notifications_status_check check (
    status in ('open', 'snoozed', 'resolved')
  );
exception
  when duplicate_object then null;
end $$;

create unique index if not exists idx_admin_notifications_dedupe_key
  on admin_notifications(dedupe_key)
  where dedupe_key is not null;
create index if not exists idx_admin_notifications_status_created
  on admin_notifications(status, created_at desc);
create index if not exists idx_admin_notifications_source_created
  on admin_notifications(source, created_at desc);

alter table admin_notifications enable row level security;
