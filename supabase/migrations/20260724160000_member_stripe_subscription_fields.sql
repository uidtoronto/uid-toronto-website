/*
# Member Stripe subscription fields

Links member profiles to Stripe subscriptions and tracks billing state
updated exclusively by the stripe-webhook edge function.
*/

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS renewal_date timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS members_auth_user_id_idx
  ON members (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS members_stripe_customer_id_idx
  ON members (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS members_subscription_status_idx
  ON members (subscription_status)
  WHERE subscription_status IS NOT NULL;
