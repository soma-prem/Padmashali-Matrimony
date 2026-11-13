-- ============================================================
-- STAGE 6 migration — run once in the Supabase SQL editor.
-- Adds exclusive, replaceable admin-assigned profile pairs.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profile_assignments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bride_user_id  uuid        NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  groom_user_id  uuid        NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  assigned_by    uuid        REFERENCES public.users (id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_assignment_no_self CHECK (bride_user_id <> groom_user_id)
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

  DELETE FROM public.profile_assignments
  WHERE bride_user_id IN (p_bride_user_id, p_groom_user_id)
     OR groom_user_id IN (p_bride_user_id, p_groom_user_id);

  INSERT INTO public.profile_assignments (bride_user_id, groom_user_id, assigned_by)
  VALUES (p_bride_user_id, p_groom_user_id, p_assigned_by);

  INSERT INTO public.notifications (user_id, title, message)
  VALUES
    (p_bride_user_id, 'Your match was assigned', 'The admin assigned a match to your profile. Open Assigned matches to view the profile and contact details.'),
    (p_groom_user_id, 'Your match was assigned', 'The admin assigned a match to your profile. Open Assigned matches to view the profile and contact details.');
END;
$$;

REVOKE ALL ON FUNCTION public.assign_profile_pair(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_profile_pair(uuid, uuid, uuid) TO service_role;
