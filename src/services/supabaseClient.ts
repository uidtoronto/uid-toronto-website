import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../lib/env';

function assertSupabaseConfig(): { url: string; anonKey: string } {
  const url = env.supabaseUrl.trim();
  const anonKey = env.supabaseAnonKey.trim();

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Create a .env file (copy from .env.example), set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server. Vite does not load .env.example automatically.',
    );
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new Error(
      `VITE_SUPABASE_URL points to a local Supabase instance (${url}). Use your online project URL from the Supabase dashboard.`,
    );
  }

  return { url, anonKey };
}

const { url, anonKey } = assertSupabaseConfig();

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
