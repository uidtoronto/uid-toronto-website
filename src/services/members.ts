import { supabase } from '../lib/supabase';
import type {
  Member,
  MemberStats,
  MemberStatus,
  MemberUpdateInput,
  PaymentStatus,
  RegistrationMembershipType,
} from '../types';

const TABLE = 'members';

export async function getRecentMembers(limit = 5): Promise<{ data: Member[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data as Member[]) ?? [], error: null };
}

export async function getMemberStats(): Promise<{ data: MemberStats | null; error: string | null }> {
  const statuses: MemberStatus[] = ['active', 'inactive', 'pending', 'suspended'];
  const types: RegistrationMembershipType[] = ['adult', 'student', 'pensioner'];
  const payStatuses: PaymentStatus[] = ['active', 'pending', 'failed', 'cancelled'];

  const totalReq = supabase.from(TABLE).select('*', { count: 'exact', head: true });
  const statusReqs = statuses.map(s =>
    supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('status', s),
  );
  const typeReqs = types.map(t =>
    supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('membership_type', t),
  );
  const payReqs = payStatuses.map(p =>
    supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('payment_status', p),
  );
  const [total, ...rest] = await Promise.all([totalReq, ...statusReqs, ...typeReqs, ...payReqs]);

  if (total.error) return { data: null, error: total.error.message };

  const byStatus = statuses.map((status, i) => ({
    status,
    count: rest[i].count ?? 0,
  }));
  const byMembershipType = types.map((type, i) => ({
    type,
    count: rest[statuses.length + i].count ?? 0,
  }));
  const byPaymentStatus = payStatuses.map((status, i) => ({
    status,
    count: rest[statuses.length + types.length + i].count ?? 0,
  }));
  const activeSubscriptions = byPaymentStatus.find(p => p.status === 'active')?.count ?? 0;

  return { data: { total: total.count ?? 0, byStatus, byMembershipType, byPaymentStatus, activeSubscriptions }, error: null };
}

export async function getAllMembers(): Promise<{ data: Member[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Member[]) ?? [], error: null };
}

export async function getMemberById(id: string): Promise<{ data: Member | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: data as Member | null, error: null };
}

export async function updateMember(
  id: string,
  updates: MemberUpdateInput,
): Promise<{ data: Member | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as Member, error: null };
}
