-- Run in the Supabase SQL editor to add religion to existing profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS religion text;
