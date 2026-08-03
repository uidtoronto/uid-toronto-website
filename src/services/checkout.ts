import { env } from '../lib/env';

export interface CreateCheckoutSessionParams {
  productId: string;
  mode: 'subscription' | 'payment';
  returnUrl: string;
  memberId?: string;
  /** Legacy: registration checkout when auth user exists. */
  authUserId?: string;
  /** Guest checkout — no auth session required. */
  guestCheckout?: boolean;
}

export interface CheckoutSessionResult {
  sessionId: string;
  clientSecret: string;
}

export async function createEmbeddedCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<{ data?: CheckoutSessionResult; error?: string }> {
  if (!params.productId?.startsWith('prod_')) {
    return { error: 'Üyelik fiyatlandırması yapılandırılmamış. Lütfen destek ile iletişime geçin.' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.supabaseAnonKey}`,
  };

  const body: Record<string, unknown> = {
    product_id: params.productId,
    mode: params.mode,
    return_url: params.returnUrl,
    member_id: params.memberId,
  };

  if (params.guestCheckout && params.memberId) {
    body.guest_checkout = true;
  } else if (params.authUserId && params.memberId) {
    body.registration_checkout = true;
    body.user_id = params.authUserId;
  } else {
    const { supabase } = await import('../lib/supabase');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return { error: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.' };
    }
    headers.Authorization = `Bearer ${accessToken}`;
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
    return { error: payload?.error || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.' };
  }

  const { sessionId, clientSecret } = await response.json();

  if (!clientSecret) {
    return { error: 'Ödeme oturumu oluşturulamadı.' };
  }

  return { data: { sessionId, clientSecret } };
}
