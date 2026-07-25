import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { env } from './env';

let stripePromise: Promise<Stripe | null> | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.stripePublishableKey);
}

export function getStripe(): Promise<Stripe | null> {
  if (!env.stripePublishableKey) {
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(env.stripePublishableKey);
  }

  return stripePromise;
}
