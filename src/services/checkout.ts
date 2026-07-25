import { supabase } from '../lib/supabase';
import { env } from '../lib/env';

export interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'subscription' | 'payment';
  returnUrl: string;
  memberId?: string;
  /** Required for registration checkout when no auth session exists yet. */
  authUserId?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  clientSecret: string;
}

export async function createEmbeddedCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<{ data?: CheckoutSessionResult; error?: string }> {
  if (!params.priceId) {
    return { error: 'Membership pricing is not configured. Please contact support.' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const canUseRegistrationCheckout =
    !accessToken && params.memberId && params.authUserId;

  if (!accessToken && !canUseRegistrationCheckout) {
    return { error: 'Unable to start checkout. Please try again.' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken ?? env.supabaseAnonKey}`,
  };

  const body: Record<string, unknown> = {
    price_id: params.priceId,
    mode: params.mode,
    return_url: params.returnUrl,
    member_id: params.memberId,
  };

  if (canUseRegistrationCheckout) {
    body.registration_checkout = true;
    body.user_id = params.authUserId;
  }

  const response = await fetch(
    `${env.supabaseUrl}/functions/v1/stripe-checkout`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return { error: payload?.error || 'Checkout setup failed. Please try again.' };
  }

  const { sessionId, clientSecret } = await response.json();

  if (!clientSecret) {
    return { error: 'No checkout session returned.' };
  }

  return { data: { sessionId, clientSecret } };
}
