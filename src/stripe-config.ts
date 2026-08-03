import { env } from './lib/env';

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currencySymbol: string;
  mode: 'subscription' | 'payment';
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  /** Stripe Product ID — resolved to active recurring price server-side at checkout. */
  productId: string;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'monthly',
    name: 'Monthly Membership',
    description: 'Flexible monthly membership with full access to all UID benefits and community resources.',
    price: 20.0,
    currencySymbol: 'C$',
    mode: 'subscription',
    interval: 'month',
    productId: env.stripeProductMonthly,
    features: [
      'Full UID membership access',
      'Community resources & network',
      'Event discounts & early access',
      'Cancel anytime',
    ],
  },
  {
    id: 'annual',
    name: 'Annual Membership',
    description: 'Best value — commit annually and unlock the full UID experience with exclusive perks.',
    price: 240.0,
    currencySymbol: 'C$',
    mode: 'subscription',
    interval: 'year',
    popular: true,
    productId: env.stripeProductAnnual,
    features: [
      'Everything in Monthly',
      'Priority member support',
      'Exclusive annual member benefits',
      'Save vs. monthly billing',
    ],
  },
];

export function getProductByPlanId(planId: 'monthly' | 'annual'): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.id === planId);
}

export function getProductIdForMembershipType(
  membershipType: 'adult' | 'student' | 'pensioner',
): string {
  if (membershipType === 'pensioner') return env.stripeProductAnnual;
  return env.stripeProductMonthly;
}

export function getPlanIdForMembershipType(
  membershipType: 'adult' | 'student' | 'pensioner',
): 'monthly' | 'annual' {
  return membershipType === 'pensioner' ? 'annual' : 'monthly';
}
