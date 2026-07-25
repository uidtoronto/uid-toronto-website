import { supabase } from '../lib/supabase';
import { env } from '../lib/env';
import type { Donation, DonationStats } from '../types';

const TABLE = 'donations';
export const MIN_DONATION_CAD = 5;

export function buildDonationReturnUrl(): string {
  const url = new URL(`${window.location.origin}/`);
  url.searchParams.set('donation', 'success');
  url.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
  return url.toString();
}

export function parseDonationAmount(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(/,/g, '').trim());
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export async function createDonationCheckoutSession(
  amountCents: number,
): Promise<{ data?: { sessionId: string; clientSecret: string }; error?: string }> {
  if (amountCents < MIN_DONATION_CAD * 100) {
    return { error: 'Minimum donation is CAD $5.00' };
  }

  const response = await fetch(`${env.supabaseUrl}/functions/v1/stripe-donation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.supabaseAnonKey}`,
    },
    body: JSON.stringify({
      amount_cents: amountCents,
      return_url: buildDonationReturnUrl(),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return { error: payload?.error || 'Donation checkout setup failed. Please try again.' };
  }

  const { sessionId, clientSecret } = await response.json();
  if (!clientSecret) {
    return { error: 'No checkout session returned.' };
  }

  return { data: { sessionId, clientSecret } };
}

export async function getAllDonationsAdmin(): Promise<{ data: Donation[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Donation[]) ?? [], error: null };
}

export async function getDonationStatsAdmin(): Promise<{ data: DonationStats; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).select('amount');

  if (error) {
    return { data: { totalCount: 0, totalAmountCents: 0 }, error: error.message };
  }

  const rows = (data as { amount: number }[]) ?? [];
  return {
    data: {
      totalCount: rows.length,
      totalAmountCents: rows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    },
    error: null,
  };
}

export function formatDonationAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)} CAD`;
}
