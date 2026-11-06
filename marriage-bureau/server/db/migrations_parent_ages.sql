-- Run in the Supabase SQL editor to add parent ages to existing databases.
ALTER TABLE public.family_details
  ADD COLUMN IF NOT EXISTS father_age integer
    CHECK (father_age IS NULL OR (father_age >= 18 AND father_age <= 120)),
  ADD COLUMN IF NOT EXISTS mother_age integer
    CHECK (mother_age IS NULL OR (mother_age >= 18 AND mother_age <= 120));
