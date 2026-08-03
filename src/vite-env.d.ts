/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_STRIPE_PRODUCT_MONTHLY?: string;
  readonly VITE_STRIPE_PRODUCT_ANNUAL?: string;
  /** @deprecated Use VITE_STRIPE_PRODUCT_MONTHLY */
  readonly VITE_STRIPE_PRICE_MONTHLY?: string;
  /** @deprecated Use VITE_STRIPE_PRODUCT_ANNUAL */
  readonly VITE_STRIPE_PRICE_ANNUAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
