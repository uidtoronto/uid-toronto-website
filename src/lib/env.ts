/**
 * Centralized environment variable access.
 * In production builds, missing required vars throw at startup so misconfiguration
 * is caught before users hit runtime errors.
 */

function read(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function requireEnv(key: keyof ImportMetaEnv, label: string): string {
  const value = read(key);
  if (value) return value;

  if (import.meta.env.PROD) {
    throw new Error(`Missing required environment variable: ${label}`);
  }

  return '';
}

function requireStripeProductId(key: keyof ImportMetaEnv, label: string): string {
  const value = requireEnv(key, label);
  if (!value) return value;

  if (!value.startsWith('prod_')) {
    throw new Error(`${label} must be a Stripe Product ID (prod_...).`);
  }

  return value;
}

export const env = {
  supabaseUrl: requireEnv('VITE_SUPABASE_URL', 'VITE_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
  stripePublishableKey: requireEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY'),
  stripeProductMonthly: requireStripeProductId('VITE_STRIPE_PRODUCT_MONTHLY', 'VITE_STRIPE_PRODUCT_MONTHLY'),
  stripeProductAnnual: requireStripeProductId('VITE_STRIPE_PRODUCT_ANNUAL', 'VITE_STRIPE_PRODUCT_ANNUAL'),
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
} as const;

function stripeProductConfigError(key: keyof ImportMetaEnv, label: string): string | null {
  const value = read(key);
  if (!value) return label;
  if (!value.startsWith('prod_')) {
    return `${label} must be a Stripe Product ID (prod_...)`;
  }
  return null;
}

export function getEnvConfigErrors(): string[] {
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!env.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!env.stripePublishableKey) missing.push('VITE_STRIPE_PUBLISHABLE_KEY');

  for (const err of [
    stripeProductConfigError('VITE_STRIPE_PRODUCT_MONTHLY', 'VITE_STRIPE_PRODUCT_MONTHLY'),
    stripeProductConfigError('VITE_STRIPE_PRODUCT_ANNUAL', 'VITE_STRIPE_PRODUCT_ANNUAL'),
  ]) {
    if (err) missing.push(err);
  }

  return missing;
}
