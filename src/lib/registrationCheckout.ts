import type { PlanId } from '../services/stripe';

const PENDING_CHECKOUT_KEY = 'uid_reg_pending_checkout';

export interface PendingRegistrationCheckout {
  memberId: string;
  plan: PlanId;
}

export function storePendingRegistrationCheckout(memberId: string, plan: PlanId): void {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ memberId, plan }));
}

export function getPendingRegistrationCheckout(): PendingRegistrationCheckout | null {
  const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingRegistrationCheckout;
    if (parsed.memberId && (parsed.plan === 'monthly' || parsed.plan === 'annual')) {
      return parsed;
    }
  } catch {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  }
  return null;
}

export function clearPendingRegistrationCheckout(): void {
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}
