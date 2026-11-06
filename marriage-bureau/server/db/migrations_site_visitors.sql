-- Run in the Supabase SQL editor to enable unique browser-visitor counting.
-- The API stores only a random first-party browser ID and first-seen timestamp.

CREATE TABLE IF NOT EXISTS public.site_visitors (
  visitor_id   uuid        PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_visitors_first_seen
  ON public.site_visitors (first_seen_at DESC);
