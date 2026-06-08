create table cams (
  id          text primary key,          -- slug, e.g. 'monterey-sea-otters'
  name        text not null,
  youtube_url text not null,
  enabled     boolean default true
);

create table sightings (
  id          uuid primary key default gen_random_uuid(),
  cam_id      text not null references cams (id),  -- detstream feed_id maps to this
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,               -- null while the otter is still on screen
  confidence  real,                      -- peak confidence during the sighting
  thumbnail   text,                      -- public URL of the triggering frame
  detector    text                       -- 'yolo-world' | 'grounding-dino' | 'yolo-ft'
);

create index sightings_started_at_idx on sightings (started_at desc);

-- The website subscribes to inserts and updates on this table
alter publication supabase_realtime add table sightings;

-- The site reads with the anon key only. Writes go through the detstream supabase sink's
-- service key, which bypasses RLS
alter table sightings enable row level security;
alter table cams enable row level security;

create policy "public read sightings" on sightings for select using (true);
create policy "public read cams" on cams for select using (true);
