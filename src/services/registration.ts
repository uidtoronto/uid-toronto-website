import { supabase } from '../lib/supabase';
import type { RegistrationInput, FamilyMember } from '../types';

export interface SavedRegistration {
  memberId: string;
  authUserId: string;
  /** True when signUp returned a live session (email confirmation not blocking). */
  hasSession: boolean;
}

// Full registration flow:
//   1. Create the Supabase auth user (email + password).
//   2. Insert the member profile row linked by auth_user_id.
//   3. Insert any family member rows.
// Returns the new member id so the caller can pass it to Stripe checkout.
// Checkout proceeds immediately even when email confirmation is enabled and
// no client session is returned — the stripe-checkout edge function validates
// the pending member record server-side.
export async function saveRegistration(
  input: RegistrationInput & { password: string },
): Promise<{ data: SavedRegistration | null; error: string | null }> {
  const emailRedirectTo = `${window.location.origin}/payment-success`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        membership_status: 'pending',
        membership_type: 'individual',
      },
    },
  });

  if (authError) return { data: null, error: authError.message };
  if (!authData.user) return { data: null, error: 'Failed to create account' };

  const authUserId = authData.user.id;
  const hasSession = Boolean(authData.session);

  const memberRow = {
    auth_user_id: authUserId,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    birth_date: input.birth_date || null,
    mobile_phone: input.mobile_phone || null,
    address_line1: input.address_line1 || null,
    address_line2: input.address_line2 || null,
    city: input.city || null,
    province: input.province || null,
    postal_code: input.postal_code || null,
    country: input.country || null,
    membership_type: input.membership_type,
    is_family: input.is_family,
    payment_status: 'pending' as const,
    status: 'pending' as const,
  };

  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert(memberRow)
    .select('id')
    .maybeSingle();

  if (memberError) return { data: null, error: memberError.message };
  if (!member) return { data: null, error: 'Failed to create member record' };

  if (input.is_family && input.family_members && input.family_members.length > 0) {
    const rows: FamilyMember[] = input.family_members
      .filter(fm => fm.full_name.trim() !== '')
      .map(fm => ({
        member_id: member.id,
        full_name: fm.full_name,
        age: fm.age ?? null,
        gender: fm.gender ?? null,
        member_type: fm.member_type ?? null,
      }));

    if (rows.length > 0) {
      const { error: famError } = await supabase.from('family_members').insert(rows);
      if (famError) {
        return { data: null, error: `Member saved, but family members failed: ${famError.message}` };
      }
    }
  }

  return { data: { memberId: member.id, authUserId, hasSession }, error: null };
}
