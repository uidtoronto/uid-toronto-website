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
  priceId: string;
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
    priceId: env.stripePriceMonthly,
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
    priceId: env.stripePriceAnnual,
    features: [
      'Everything in Monthly',
      'Priority member support',
      'Exclusive annual member benefits',
      'Save vs. monthly billing',
    ],
  },
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.priceId === priceId);
}

export function getPriceIdForMembershipType(
  membershipType: 'adult' | 'student' | 'pensioner',
): string {
  if (membershipType === 'pensioner') return env.stripePriceAnnual;
  return env.stripePriceMonthly;
}

export function getPlanIdForMembershipType(
  membershipType: 'adult' | 'student' | 'pensioner',
): 'monthly' | 'annual' {
  return membershipType === 'pensioner' ? 'annual' : 'monthly';
}
