/**
 * Centralized environment variable access.
 * In production builds, missing required vars throw at startup so misconfiguration
 * is caught before users hit runtime errors.
 */

/** UID Toronto Stripe products (public IDs — safe as fallbacks). */
const DEFAULT_PRODUCT_MONTHLY = 'prod_Ut6W4153T8CLbe';
const DEFAULT_PRODUCT_ANNUAL = 'prod_Ut6XpPqYZD0iFn';

function read(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readAny(key: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
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

function resolveStripeProductId(
  primaryKey: keyof ImportMetaEnv,
  legacyKey: string,
  fallback: string,
): string {
  const candidates = [
    read(primaryKey),
    readAny(legacyKey),
    fallback,
  ];

  for (const value of candidates) {
    if (value?.startsWith('prod_')) return value;
  }

  const primary = read(primaryKey) ?? readAny(legacyKey);
  if (primary && !primary.startsWith('prod_')) {
    throw new Error(
      `${primaryKey} must be a Stripe Product ID (prod_...), not ${primary}.`,
    );
  }

  return fallback;
}

export const env = {
  supabaseUrl: requireEnv('VITE_SUPABASE_URL', 'VITE_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
  stripePublishableKey: requireEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY'),
  stripeProductMonthly: resolveStripeProductId(
    'VITE_STRIPE_PRODUCT_MONTHLY',
    'VITE_STRIPE_PRICE_MONTHLY',
    DEFAULT_PRODUCT_MONTHLY,
  ),
  stripeProductAnnual: resolveStripeProductId(
    'VITE_STRIPE_PRODUCT_ANNUAL',
    'VITE_STRIPE_PRICE_ANNUAL',
    DEFAULT_PRODUCT_ANNUAL,
  ),
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
} as const;

function stripeProductConfigError(
  primaryKey: keyof ImportMetaEnv,
  legacyKey: string,
  label: string,
): string | null {
  const value = read(primaryKey) ?? readAny(legacyKey);
  if (!value) return `${label} is not set (use VITE_STRIPE_PRODUCT_* or legacy VITE_STRIPE_PRICE_* with prod_ IDs)`;
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
    stripeProductConfigError('VITE_STRIPE_PRODUCT_MONTHLY', 'VITE_STRIPE_PRICE_MONTHLY', 'VITE_STRIPE_PRODUCT_MONTHLY'),
    stripeProductConfigError('VITE_STRIPE_PRODUCT_ANNUAL', 'VITE_STRIPE_PRICE_ANNUAL', 'VITE_STRIPE_PRODUCT_ANNUAL'),
  ]) {
    if (err) missing.push(err);
  }

  return missing;
}
