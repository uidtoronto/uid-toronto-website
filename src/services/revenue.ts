import { supabase } from '../lib/supabase';
import { STRIPE_PRODUCTS } from '../stripe-config';
import type { DashboardRevenueStats } from '../types';

const MONTHLY_PLAN = STRIPE_PRODUCTS.find((p) => p.id === 'monthly');
const ANNUAL_PLAN = STRIPE_PRODUCTS.find((p) => p.id === 'annual');

const MONTHLY_PRICE_CENTS = Math.round((MONTHLY_PLAN?.price ?? 20) * 100);
const ANNUAL_MRR_CENTS = Math.round(((ANNUAL_PLAN?.price ?? 240) / 12) * 100);

function startOfCurrentMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function formatCadCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function getDashboardRevenueStats(): Promise<{
  data: DashboardRevenueStats;
  error: string | null;
}> {
  const monthStart = startOfCurrentMonth();

  const [membersRes, donationsRes, monthDonationsRes] = await Promise.all([
    supabase
      .from('members')
      .select('subscription_plan, payment_status')
      .eq('payment_status', 'active'),
    supabase.from('donations').select('amount'),
    supabase.from('donations').select('amount').gte('created_at', monthStart),
  ]);

  if (membersRes.error) {
    return {
      data: emptyRevenue(),
      error: membersRes.error.message,
    };
  }

  if (donationsRes.error) {
    return {
      data: emptyRevenue(),
      error: donationsRes.error.message,
    };
  }

  if (monthDonationsRes.error) {
    return {
      data: emptyRevenue(),
      error: monthDonationsRes.error.message,
    };
  }

  let activeMonthlySubs = 0;
  let activeAnnualSubs = 0;

  for (const member of membersRes.data ?? []) {
    if (member.subscription_plan === 'annual') {
      activeAnnualSubs += 1;
    } else {
      // monthly, unknown, or legacy rows default to monthly billing
      activeMonthlySubs += 1;
    }
  }

  const mrrCents =
    activeMonthlySubs * MONTHLY_PRICE_CENTS + activeAnnualSubs * ANNUAL_MRR_CENTS;

  const donationRows = (donationsRes.data as { amount: number }[]) ?? [];
  const monthDonationRows = (monthDonationsRes.data as { amount: number }[]) ?? [];

  return {
    data: {
      mrrCents,
      arrCents: mrrCents * 12,
      activeMonthlySubs,
      activeAnnualSubs,
      donationsThisMonthCents: monthDonationRows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
      donationsTotalCents: donationRows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
      donationsThisMonthCount: monthDonationRows.length,
    },
    error: null,
  };
}

function emptyRevenue(): DashboardRevenueStats {
  return {
    mrrCents: 0,
    arrCents: 0,
    activeMonthlySubs: 0,
    activeAnnualSubs: 0,
    donationsThisMonthCents: 0,
    donationsTotalCents: 0,
    donationsThisMonthCount: 0,
  };
}
