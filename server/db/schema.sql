-- ============================================================
-- Padmashali Samaj Matrimony — full database schema (all stages)
-- Run this ONCE in the Supabase SQL editor.
--
-- DESIGN NOTE: horoscope and family details are kept as
-- SEPARATE 1:1 tables instead of JSON columns, because:
--   1) assigned-match queries can SELECT only the columns
--      they need from `profiles` without dragging big JSON blobs,
--   2) columns are typed and can carry CHECK constraints / validation,
--   3) the admin can edit a single group without touching the whole row.
-- JSON would also work; columns are simply safer and faster here.
--
-- SECURITY NOTE: the backend connects with the service role key, which
-- bypasses Row Level Security. That is why no RLS policies are defined
-- here — all authorization checks live in the Express API.
-- ============================================================

-- ------------------------------------------------------------
-- users: authentication table (one row per account)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text         NOT NULL CHECK (char_length(trim(name)) >= 2),
  email         text         NOT NULL UNIQUE CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  password_hash text         NOT NULL,
  role          text         NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (lower(email));
-- keep emails case-insensitively unique even if a lowercase insert variant slips in
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique_ci ON public.users (lower(email));

-- ------------------------------------------------------------
-- profiles: matrimonial profile, one per user (1:1)
-- Basic / Community / Education / Career / Lifestyle / Location /
-- Private-contact fields live here.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,

  -- workflow
  profile_status     text        NOT NULL DEFAULT 'draft'
                     CHECK (profile_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  rejection_reason   text,
  payment_required   boolean     NOT NULL DEFAULT false,
  completion_percent integer     NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),

  -- basic
  name               text,                          -- official profile name (may differ from account name)
  gender             text        CHECK (gender IN ('male', 'female')),
  date_of_birth      date,
  height_cm          numeric(5,1) CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 250)),
  weight_kg          numeric(5,1) CHECK (weight_kg IS NULL OR (weight_kg >= 30 AND weight_kg <= 200)),
  marital_status     text        CHECK (marital_status IS NULL OR marital_status IN ('never_married', 'divorced', 'widowed', 'separated')),
  mother_tongue      text,
  about_me           text,

  -- community
  religion           text,
  caste              text,
  sub_caste_kulam    text,                          -- sub-caste / kulam
  gotra              text,

  -- education
  highest_qualification text,
  college            text,
  field_of_study     text,

  -- career
  occupation         text,
  company            text,
  annual_income      text,                          -- free text, e.g. "5-8 LPA"

  -- lifestyle
  diet               text        CHECK (diet IS NULL OR diet IN ('vegetarian', 'non_vegetarian', 'eggetarian', 'occasionally')),
  smoking            text        CHECK (smoking IS NULL OR smoking IN ('never', 'occasionally', 'regularly', 'quit')),
  drinking           text        CHECK (drinking IS NULL OR drinking IN ('never', 'occasionally', 'regularly', 'quit')),
  hobbies            text,                          -- free text / comma separated

  -- location
  city               text,
  state              text,
  country            text        DEFAULT 'India',
  willing_to_relocate boolean    DEFAULT false,
  relocation_location text,

  -- PRIVATE contact details — only admin / the assigned match may EVER
  -- read these through the API. They are deliberately in the profiles
  -- table (1:1) so assigned-match listing queries never select them.
  contact_mobile     text,
  contact_whatsapp   text,
  contact_email      text,
  contact_address    text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- a published profile must be complete enough to review
  CONSTRAINT profiles_real_name_required_when_not_draft
    CHECK (profile_status = 'draft' OR (name IS NOT NULL AND name <> '')),
  CONSTRAINT profiles_needs_gender_when_not_draft
    CHECK (profile_status = 'draft' OR gender IS NOT NULL),
  CONSTRAINT profiles_reason_only_when_rejected
    CHECK (profile_status <> 'rejected' OR rejection_reason IS NOT NULL),
  CONSTRAINT profiles_no_reason_when_not_rejected
    CHECK (profile_status = 'rejected' OR rejection_reason IS NULL)
);

-- Keep databases created from an earlier version of this schema in sync.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mother_tongue text,
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS relocation_location text,
  ADD COLUMN IF NOT EXISTS payment_required boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_user    ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gender  ON public.profiles (gender);
CREATE INDEX IF NOT EXISTS idx_profiles_status  ON public.profiles (profile_status);

-- ------------------------------------------------------------
-- membership_payments: one payment request and latest submission per user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_payments (
  id                           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      uuid           NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  amount                       numeric(12,2)  NOT NULL CHECK (amount > 0),
  qr_image_url                 text           NOT NULL,
  qr_public_id                 text,
  status                       text           NOT NULL DEFAULT 'requested'
                               CHECK (status IN ('requested', 'submitted', 'rejected', 'verified')),
  request_sent_at              timestamptz    NOT NULL DEFAULT now(),
  utr_number                   text,
  payment_screenshot_url       text,
  payment_screenshot_public_id text,
  submitted_at                 timestamptz,
  reviewed_at                  timestamptz,
  reviewed_by                  uuid           REFERENCES public.users (id) ON DELETE SET NULL,
  rejection_reason             text,
  CONSTRAINT membership_payment_submission_complete
    CHECK (status <> 'submitted' OR (
      utr_number IS NOT NULL AND payment_screenshot_url IS NOT NULL AND submitted_at IS NOT NULL
    ))
);

CREATE INDEX IF NOT EXISTS idx_membership_payments_status
  ON public.membership_payments (status, submitted_at DESC);

-- ------------------------------------------------------------
-- horoscope_details: one row per profile (1:1)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.horoscope_details (
  id             uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid   NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  time_of_birth  time,
  place_of_birth text,
  rashi          text,
  nakshatra      text,
  pada           text,
  graha_details  text,                     -- planet details (free text in Stage 2+)
  manglik        text   NOT NULL DEFAULT 'not_sure'
                        CHECK (manglik IN ('yes', 'no', 'not_sure')),
  kundli_image_url   text,                     -- Cloudinary URL from Stage 2
  kundli_public_id   text                      -- Cloudinary public id (Stage 2)
);

-- ------------------------------------------------------------
-- family_details: one row per profile (1:1)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_details (
  id                uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid   NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  father_name       text,
  father_occupation text,
  father_age        integer CHECK (father_age IS NULL OR (father_age >= 18 AND father_age <= 120)),
  mother_name       text,
  mother_occupation text,
  mother_age        integer CHECK (mother_age IS NULL OR (mother_age >= 18 AND mother_age <= 120)),
  brothers          integer CHECK (brothers IS NULL OR (brothers >= 0 AND brothers <= 20)),
  brother_names     jsonb   NOT NULL DEFAULT '[]'::jsonb,
  brother_details   jsonb   NOT NULL DEFAULT '[]'::jsonb,
  sisters           integer CHECK (sisters IS NULL OR (sisters >= 0 AND sisters <= 20)),
  sister_names      jsonb   NOT NULL DEFAULT '[]'::jsonb,
  sister_details    jsonb   NOT NULL DEFAULT '[]'::jsonb,
  family_type       text    CHECK (family_type IS NULL OR family_type IN ('nuclear', 'joint', 'extended')),
  family_values     text    CHECK (family_values IS NULL OR family_values IN ('traditional', 'moderate', 'liberal', 'spiritual')),
  native_place      text
);

-- ------------------------------------------------------------
-- profile_photos: 1 main photo + up to 5 extra per user
-- (Rows store Cloudinary URLs — inserted from Stage 2 onwards.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  url        text        NOT NULL,
  public_id  text,                              -- Cloudinary public id (Stage 2)
  is_main    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON public.profile_photos (user_id);

-- max 6 photos per user (1 main + 5 more)
CREATE OR REPLACE FUNCTION public.enforce_max_photos()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM public.profile_photos WHERE user_id = NEW.user_id) > 6 THEN
    RAISE EXCEPTION 'A profile can have at most 6 photos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_max_photos ON public.profile_photos;
CREATE TRIGGER trg_enforce_max_photos
  AFTER INSERT ON public.profile_photos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_photos();

-- ------------------------------------------------------------
-- notifications: in-website only
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title      text        NOT NULL,
  message    text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read);

-- ------------------------------------------------------------
-- profile_assignments: admin-assigned bride/groom pairs (many per user)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_assignments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bride_user_id  uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  groom_user_id  uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  assigned_by    uuid        REFERENCES public.users (id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_assignment_no_self CHECK (bride_user_id <> groom_user_id),
  CONSTRAINT profile_assignment_pair_unique UNIQUE (bride_user_id, groom_user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_assignments_bride
  ON public.profile_assignments (bride_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_assignments_groom
  ON public.profile_assignments (groom_user_id);

CREATE OR REPLACE FUNCTION public.assign_profile_pair(
  p_bride_user_id uuid,
  p_groom_user_id uuid,
  p_assigned_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bride_gender text;
  v_groom_gender text;
  v_bride_status text;
  v_groom_status text;
  v_bride_payment_required boolean;
  v_groom_payment_required boolean;
  v_bride_role text;
  v_groom_role text;
  v_bride_active boolean;
  v_groom_active boolean;
  v_assigner_role text;
  v_user_id uuid;
  v_inserted_count integer;
BEGIN
  IF p_bride_user_id IS NULL OR p_groom_user_id IS NULL
     OR p_bride_user_id = p_groom_user_id THEN
    RAISE EXCEPTION 'Choose two different profiles.';
  END IF;

  SELECT p.gender, p.profile_status, p.payment_required, u.role, u.is_active
  INTO v_bride_gender, v_bride_status, v_bride_payment_required, v_bride_role, v_bride_active
  FROM public.profiles p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.user_id = p_bride_user_id;

  SELECT p.gender, p.profile_status, p.payment_required, u.role, u.is_active
  INTO v_groom_gender, v_groom_status, v_groom_payment_required, v_groom_role, v_groom_active
  FROM public.profiles p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.user_id = p_groom_user_id;

  IF v_bride_gender IS DISTINCT FROM 'female'
     OR v_groom_gender IS DISTINCT FROM 'male' THEN
    RAISE EXCEPTION 'Choose one bride profile and one groom profile.';
  END IF;

  IF v_bride_status IS DISTINCT FROM 'approved'
     OR v_groom_status IS DISTINCT FROM 'approved'
     OR v_bride_payment_required IS DISTINCT FROM false
     OR v_groom_payment_required IS DISTINCT FROM false
     OR v_bride_role IS DISTINCT FROM 'user'
     OR v_groom_role IS DISTINCT FROM 'user'
     OR v_bride_active IS DISTINCT FROM true
     OR v_groom_active IS DISTINCT FROM true
     OR NOT EXISTS (
       SELECT 1 FROM public.membership_payments
       WHERE user_id = p_bride_user_id AND status = 'verified'
     )
     OR NOT EXISTS (
       SELECT 1 FROM public.membership_payments
       WHERE user_id = p_groom_user_id AND status = 'verified'
     ) THEN
    RAISE EXCEPTION 'Both profiles must be approved profiles with verified payments and active user accounts.';
  END IF;

  SELECT role INTO v_assigner_role
  FROM public.users
  WHERE id = p_assigned_by;

  IF v_assigner_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only an admin can assign profiles.';
  END IF;

  FOR v_user_id IN
    SELECT locked_user_id
    FROM unnest(ARRAY[p_bride_user_id, p_groom_user_id]) AS ids(locked_user_id)
    ORDER BY locked_user_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));
  END LOOP;

  INSERT INTO public.profile_assignments (bride_user_id, groom_user_id, assigned_by)
  VALUES (p_bride_user_id, p_groom_user_id, p_assigned_by)
  ON CONFLICT (bride_user_id, groom_user_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count > 0 THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES
      (p_bride_user_id, 'Your match was assigned', 'The admin assigned a profile to you. Open Assigned matches to view the profile and contact details.'),
      (p_groom_user_id, 'Your match was assigned', 'The admin assigned a profile to you. Open Assigned matches to view the profile and contact details.');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_profile_pair(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_profile_pair(uuid, uuid, uuid) TO service_role;

-- ------------------------------------------------------------
-- Stage 5: contact_messages — messages from the public
-- "Contact Us" form. Admins can reply to senders by email.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  phone      text,
  subject    text,
  message    text        NOT NULL,
  is_handled boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_handled
  ON public.contact_messages (is_handled, created_at DESC);

CREATE TABLE IF NOT EXISTS public.contact_message_replies (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id uuid        NOT NULL REFERENCES public.contact_messages (id) ON DELETE CASCADE,
  recipient_email    text        NOT NULL,
  response           text        NOT NULL,
  status             text        NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed')),
  sent_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_message_replies_message
  ON public.contact_message_replies (contact_message_id, created_at);
