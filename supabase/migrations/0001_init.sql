-- Wandr V1 — Phase 2 backend schema
-- Source of truth: docs/backend_plan_wandr_v1.md §2
--
-- Deviations from the plan's DDL are marked [+]. They exist because the shipped
-- `Destination` type (src/types/index.ts) carries fields the plan's table omitted;
-- dropping them would mean the API could not rehydrate a card the frontend already
-- renders. Fields that are genuinely per-turn LLM output — matchScore,
-- matchRationale, curiosityHook — are correctly absent: they are not KB facts.

create extension if not exists pgcrypto;

-- ── Layer 1 Knowledge Base ────────────────────────────────────────────────
create table if not exists destinations (
  id                   text primary key,          -- stable slug, e.g. 'spiti_valley'
  name                 text not null,
  country              text not null default 'India',  -- [+] shipped type has `country`
  state                text not null,             -- Indian state
  region               text not null,             -- display string, e.g. 'Rajasthan, North India'
  tagline              text not null,
  hero_image_url       text not null,
  gallery_urls         text[] not null,
  vibe_tags            text[] not null,
  categories           text[] not null,           -- taxonomy for negative filtering (FR-3.3.2)
  travel_zone          text not null,             -- mirrors the shipped TravelZone union
  best_months          text[] not null,
  temp_range_c         text not null,             -- [+] WeatherInfo.tempRangeC
  seasonality_notes    text not null,             -- [+] WeatherInfo.seasonalityNotes
  best_time            text not null,             -- [+] QuickStats.bestTime display string
  avg_daily_cost_inr   integer not null,
  ground_cost_tier     text not null check (ground_cost_tier in ('₹','₹₹','₹₹₹','₹₹₹₹')),
  transit_cost_tier    text not null check (transit_cost_tier in ('₹','₹₹','₹₹₹','₹₹₹₹')),
  transit_hours        numeric(4,1) not null,     -- door-to-door from a major metro
  primary_mode         text not null check (primary_mode in ('flight','flight_plus_road','rail','road')),
  nearest_access       text not null,             -- airport or railhead that explains transit_hours
  overview_summary     text not null,
  best_for_tags        text[] not null,
  why_love_it          text[] not null,
  what_to_know         text[] not null,
  experience_highlights jsonb not null default '[]',  -- [+] ExperienceHighlight[]
  hidden_fees          jsonb not null default '[]',
  last_verified_date   date not null,
  is_uncertain         boolean not null default false,
  uncertainty_notes    text,

  -- [+] TC-NFR-805: when the LLM times out or returns zero selections, the server
  -- serves curated static cards. Non-null marks a card as fallback-eligible and
  -- orders it; keeping this in the KB avoids a second hardcoded list in app code.
  fallback_rank        integer,

  -- FR-6.2.5 enforced in the database, not left to the LLM to remember
  constraint what_to_know_min_two check (array_length(what_to_know, 1) >= 2)
);

create index if not exists destinations_travel_zone_idx on destinations (travel_zone);
create index if not exists destinations_categories_idx on destinations using gin (categories);
create index if not exists destinations_fallback_rank_idx
  on destinations (fallback_rank) where fallback_rank is not null;

-- ── Origin-aware transit (replaces the global RegionBucket matrix) ────────
create table if not exists origin_cities (
  id    text primary key,        -- 'delhi_ncr', 'mumbai', 'bengaluru', …
  label text not null            -- must match the OriginCity union in src/types/index.ts
);

create table if not exists transit_routes (
  origin_city_id     text not null references origin_cities(id),
  destination_id     text not null references destinations(id) on delete cascade,
  mode               text not null check (mode in ('flight','train','bus','self_drive')),
  typical_cost_inr   integer not null,
  duration_hours     numeric(4,1) not null,
  notes              text,
  -- [+] estimates and owner-verified fares live in the same table; the cost engine
  -- treats them identically but the UI must be able to say which is which.
  is_estimate        boolean not null default true,
  last_verified_date date not null,
  primary key (origin_city_id, destination_id, mode)
);

create index if not exists transit_routes_destination_idx on transit_routes (destination_id);

-- ── 48-hour sessions (FR-5.3.x) ──────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '48 hours',
  state       jsonb not null,        -- mirrors the PersistedSession TS type
  share_token text unique
);

create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- ── Reaction signals, split out for analytics (Epic 5) ────────────────────
create table if not exists session_reactions (
  id             bigserial primary key,
  session_id     uuid not null references sessions(id) on delete cascade,
  destination_id text not null references destinations(id),
  reaction       text not null check (reaction in ('liked','saved','dismissed')),
  reason_chip    text,
  created_at     timestamptz not null default now()
);

create index if not exists session_reactions_session_idx on session_reactions (session_id);

-- ── RLS (§7) ──────────────────────────────────────────────────────────────
-- The browser never talks to Postgres directly. Enabling RLS with no permissive
-- policy means anon/authenticated get nothing; the service role bypasses RLS, and
-- only the Next.js route handlers hold that key.
alter table sessions          enable row level security;
alter table session_reactions enable row level security;

-- `destinations`, `origin_cities` and `transit_routes` are public read-only reference
-- data. RLS on with a select-only policy, so a leaked anon key exposes the catalogue
-- (which ships to the client anyway) and nothing else.
alter table destinations   enable row level security;
alter table origin_cities  enable row level security;
alter table transit_routes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'destinations' and policyname = 'destinations_public_read') then
    create policy destinations_public_read on destinations for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'origin_cities' and policyname = 'origin_cities_public_read') then
    create policy origin_cities_public_read on origin_cities for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'transit_routes' and policyname = 'transit_routes_public_read') then
    create policy transit_routes_public_read on transit_routes for select using (true);
  end if;
end $$;
