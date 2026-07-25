/*
# Donations table for UID Toronto

- Records one-time donations processed via Stripe Checkout (dynamic price_data)
- Inserts happen from stripe-webhook (service role) on checkout.session.completed
- Super admins can read via RLS; public cannot read or insert directly
*/

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount integer NOT NULL CHECK (amount >= 500),
  email text,
  stripe_payment_intent_id text NOT NULL,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donations_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id)
);

CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations (created_at DESC);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read donations"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
