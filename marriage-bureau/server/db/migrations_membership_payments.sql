-- Membership payment request and verification workflow.
-- Run once in the Supabase SQL editor for an existing database.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_required boolean NOT NULL DEFAULT false;

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

NOTIFY pgrst, 'reload schema';
