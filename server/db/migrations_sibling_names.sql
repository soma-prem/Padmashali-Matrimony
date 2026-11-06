-- Run in the Supabase SQL editor to store sibling names and details on existing databases.
ALTER TABLE public.family_details
  ADD COLUMN IF NOT EXISTS brother_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sister_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brother_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sister_details jsonb NOT NULL DEFAULT '[]'::jsonb;
