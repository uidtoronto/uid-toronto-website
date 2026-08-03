import { env } from '../lib/env';
import type { PlanId } from './stripe';
import type { FamilyMember } from '../types';

export interface GuestRegistrationInput {
  full_name: string;
  email: string;
  birth_date: string;
  mobile_phone: string;
  plan: PlanId;
  is_family: boolean;
  family_members?: FamilyMember[];
}

export interface SavedRegistration {
  memberId: string;
}

/** Save a guest member record (no Supabase Auth user). */
export async function saveRegistration(
  input: GuestRegistrationInput,
): Promise<{ data: SavedRegistration | null; error: string | null }> {
  try {
    const response = await fetch(`${env.supabaseUrl}/functions/v1/member-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.supabaseAnonKey}`,
      },
      body: JSON.stringify(input),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { data: null, error: payload?.error ?? 'Üyelik kaydı oluşturulamadı.' };
    }

    if (!payload.memberId) {
      return { data: null, error: 'Üyelik kaydı oluşturulamadı.' };
    }

    return { data: { memberId: payload.memberId }, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}
