import { supabase } from '../lib/supabase';
import { STRIPE_PRODUCTS } from '../stripe-config';

export type PlanId = 'monthly' | 'annual';

export interface PlanInfo {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  savings?: string;
  productId: string;
}

export const PLANS: Record<PlanId, PlanInfo> = Object.fromEntries(
  STRIPE_PRODUCTS.map((product) => [
    product.id,
    {
      id: product.id as PlanId,
      name: product.name,
      price: product.price,
      currency: 'CAD',
      interval: product.interval,
      description: product.description,
      features: product.features,
      productId: product.productId,
    },
  ]),
) as Record<PlanId, PlanInfo>;

export function buildPaymentReturnUrl(params: {
  memberId?: string;
  plan?: PlanId;
}): string {
  const url = new URL(`${window.location.origin}/membership-confirmation`);
  if (params.memberId) url.searchParams.set('member', params.memberId);
  if (params.plan) url.searchParams.set('plan', params.plan);
  return url.toString();
}

export async function verifyMemberPayment(memberId: string): Promise<{ paid: boolean; error?: string }> {
  const { env } = await import('../lib/env');

  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await fetch(`${env.supabaseUrl}/functions/v1/verify-member-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.supabaseAnonKey}`,
        },
        body: JSON.stringify({ member_id: memberId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return { paid: false, error: payload?.error ?? 'Doğrulama başarısız.' };
      }

      const { paid } = await response.json();
      if (paid) return { paid: true };

      await new Promise((r) => setTimeout(r, 1500));
    }

    return {
      paid: false,
      error: 'Ödeme henüz onaylanmadı. Ödemeyi tamamladıysanız birkaç dakika sonra tekrar deneyin.',
    };
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : 'Doğrulama başarısız.' };
  }
}

/** @deprecated Use verifyMemberPayment for guest checkout flow. */
export async function verifyPayment(): Promise<{ paid: boolean; error?: string }> {
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status')
        .maybeSingle();

      if (error) return { paid: false, error: error.message };

      const status = data?.subscription_status;
      if (status === 'active' || status === 'trialing') {
        return { paid: true };
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return {
      paid: false,
      error: 'Payment not confirmed yet. If you completed payment, please refresh in a moment.',
    };
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : 'Verification failed' };
  }
}
