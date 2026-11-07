-- ============================================================
-- STAGE 5 migration — run once in the Supabase SQL editor.
-- (Safe to re-run: every statement is IF NOT EXISTS.)
-- Adds contact message storage and the admin email reply history.
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
