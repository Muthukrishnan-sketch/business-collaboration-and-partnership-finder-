-- ============================================================
-- Threadwork — B2B Partnership Matchmaking Platform
-- Postgres schema (Supabase)
-- Enable PostGIS for geospatial queries
-- ============================================================

create extension if not exists postgis;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- fuzzy text search on business names/categories

-- ----------------------------
-- Enums
-- ----------------------------
create type business_category as enum (
  'photography', 'videography', 'catering', 'decor', 'makeup_artist',
  'venue', 'florist', 'gym', 'nutritionist', 'physiotherapist',
  'event_planner', 'dj_music', 'bakery', 'salon', 'other'
);

create type connection_status as enum ('pending', 'accepted', 'declined', 'blocked');
create type message_type as enum ('text', 'proposal', 'system');

-- ----------------------------
-- Businesses (core entity, 1:1 with auth.users via Clerk/Auth.js user id)
-- ----------------------------
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id text not null unique, -- external auth provider id (Clerk/Auth.js sub)
  name text not null,
  slug text unique,
  category business_category not null,
  secondary_categories business_category[] default '{}',
  description text,
  location geography(point, 4326) not null, -- lng/lat
  address text,
  city text,
  google_place_id text,
  instagram_handle text,
  website text,
  phone text,
  avg_rating numeric(2,1) default 0,
  review_count integer default 0,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_businesses_location on businesses using gist (location);
create index idx_businesses_category on businesses (category);
create index idx_businesses_name_trgm on businesses using gin (name gin_trgm_ops);

-- ----------------------------
-- Compatibility scores (precomputed / cached AI + rule-based scores)
-- ----------------------------
create table compatibility_scores (
  id uuid primary key default uuid_generate_v4(),
  business_a_id uuid not null references businesses(id) on delete cascade,
  business_b_id uuid not null references businesses(id) on delete cascade,
  overall_score numeric(4,1) not null, -- 0-100
  proximity_score numeric(4,1),
  category_fit_score numeric(4,1),
  sentiment_overlap_score numeric(4,1),
  social_engagement_score numeric(4,1),
  reasoning jsonb, -- AI-generated "why this match" tags/explanation
  computed_at timestamptz default now(),
  unique (business_a_id, business_b_id)
);

create index idx_compat_business_a on compatibility_scores (business_a_id, overall_score desc);

-- ----------------------------
-- Connection requests (partnership requests between businesses)
-- ----------------------------
create table connections (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references businesses(id) on delete cascade,
  recipient_id uuid not null references businesses(id) on delete cascade,
  status connection_status not null default 'pending',
  message text,
  created_at timestamptz default now(),
  responded_at timestamptz,
  unique (requester_id, recipient_id)
);

create index idx_connections_recipient on connections (recipient_id, status);

-- ----------------------------
-- Messages (real-time chat between connected businesses)
-- ----------------------------
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references connections(id) on delete cascade,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_business_id uuid not null references businesses(id) on delete cascade,
  type message_type not null default 'text',
  content text not null,
  metadata jsonb, -- e.g. generated proposal payload
  created_at timestamptz default now()
);

create index idx_messages_conversation on messages (conversation_id, created_at);

-- ----------------------------
-- AI-generated collaboration proposals
-- ----------------------------
create table proposals (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references connections(id) on delete cascade,
  generated_by uuid references businesses(id),
  title text not null,
  summary text,
  terms jsonb,
  pdf_url text, -- Supabase Storage path
  created_at timestamptz default now()
);

-- ----------------------------
-- Reviews (mutual customer sentiment, ingested/analyzed data)
-- ----------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  source text not null default 'google_places', -- google_places | instagram | manual
  author_name text,
  rating numeric(2,1),
  text text,
  sentiment_score numeric(3,2), -- -1..1, from AI analysis
  mentions_partner_business_id uuid references businesses(id), -- if review mentions another vendor
  raw_data jsonb,
  fetched_at timestamptz default now()
);

create index idx_reviews_business on reviews (business_id);

-- ----------------------------
-- Row Level Security (Supabase)
-- ----------------------------
alter table businesses enable row level security;
alter table connections enable row level security;
alter table messages enable row level security;
alter table proposals enable row level security;

-- Example policies (tighten per-auth-provider in production)
create policy "Businesses are publicly readable"
  on businesses for select using (true);

create policy "Owners can update their own business"
  on businesses for update using (owner_user_id = auth.jwt() ->> 'sub');

create policy "Participants can read their connections"
  on connections for select using (
    requester_id in (select id from businesses where owner_user_id = auth.jwt() ->> 'sub')
    or recipient_id in (select id from businesses where owner_user_id = auth.jwt() ->> 'sub')
  );

create policy "Participants can read their messages"
  on messages for select using (
    conversation_id in (
      select c.id from conversations c
      join connections co on co.id = c.connection_id
      where co.requester_id in (select id from businesses where owner_user_id = auth.jwt() ->> 'sub')
         or co.recipient_id in (select id from businesses where owner_user_id = auth.jwt() ->> 'sub')
    )
  );

-- ----------------------------
-- Helper function: nearby businesses within radius (meters)
-- ----------------------------
create or replace function nearby_businesses(
  origin_lat double precision,
  origin_lng double precision,
  radius_meters integer default 15000,
  target_category business_category default null
)
returns table (
  id uuid,
  name text,
  category business_category,
  distance_meters double precision
) language sql stable as $$
  select
    b.id,
    b.name,
    b.category,
    st_distance(b.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography) as distance_meters
  from businesses b
  where (target_category is null or b.category = target_category)
    and st_dwithin(b.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography, radius_meters)
  order by distance_meters asc;
$$;
