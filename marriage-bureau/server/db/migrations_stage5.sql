-- ============================================================
-- STAGE 5 migration — run once in the Supabase SQL editor.
-- (Safe to re-run: every statement is IF NOT EXISTS.)
-- Adds the "contact_messages" table which stores messages sent
-- through the public Contact Us form (they are NOT emailed).
-- ============================================================

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
