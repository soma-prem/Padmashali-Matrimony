-- Run in the Supabase SQL editor to store a member's preferred relocation location.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS relocation_location text;
