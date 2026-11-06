-- Run in the Supabase SQL editor to add profile fields used by current application versions.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mother_tongue text,
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS relocation_location text;

NOTIFY pgrst, 'reload schema';
