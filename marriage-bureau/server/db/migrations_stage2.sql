-- ============================================================
-- STAGE 2 migration — run once in the Supabase SQL editor.
-- (Safe to re-run: every statement is IF NOT EXISTS.)
-- Adds Cloudinary public_id storage so photos/kundli can be
-- deleted from Cloudinary when removed from the app.
-- ============================================================

ALTER TABLE public.profile_photos
  ADD COLUMN IF NOT EXISTS public_id text;

ALTER TABLE public.horoscope_details
  ADD COLUMN IF NOT EXISTS kundli_public_id text;

ALTER TABLE public.horoscope_details
  ADD COLUMN IF NOT EXISTS kundli_image_url text;

-- completion percent is recalculated by the server on every save
CREATE INDEX IF NOT EXISTS idx_photos_main_per_user
  ON public.profile_photos (user_id, is_main);