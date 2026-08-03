import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) {
    return { first_name: trimmed, last_name: '' };
  }
  return {
    first_name: trimmed.slice(0, spaceIdx),
    last_name: trimmed.slice(spaceIdx + 1).trim(),
  };
}

interface FamilyMemberInput {
  full_name: string;
  age?: number | null;
  gender?: 'male' | 'female' | null;
  member_type?: 'adult' | 'child' | null;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { full_name, email, birth_date, mobile_phone, plan, is_family, family_members } = await req.json();

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return corsResponse({ error: 'Ad soyad gereklidir.' }, 400);
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return corsResponse({ error: 'Geçerli bir e-posta adresi girin.' }, 400);
    }
    if (!birth_date || typeof birth_date !== 'string') {
      return corsResponse({ error: 'Doğum tarihi gereklidir.' }, 400);
    }
    if (!mobile_phone || typeof mobile_phone !== 'string' || mobile_phone.trim().length < 7) {
      return corsResponse({ error: 'Geçerli bir telefon numarası girin.' }, 400);
    }
    if (plan !== 'monthly' && plan !== 'annual') {
      return corsResponse({ error: 'Geçersiz üyelik planı.' }, 400);
    }

    const members: FamilyMemberInput[] = Array.isArray(family_members) ? family_members : [];
    if (is_family && members.length === 0) {
      return corsResponse({ error: 'Lütfen en az bir aile üyesi ekleyin.' }, 400);
    }

    const { first_name, last_name } = splitFullName(full_name);
    const subscriptionPlan = plan === 'annual' ? 'annual' : 'monthly';

    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        first_name,
        last_name,
        email: email.trim().toLowerCase(),
        birth_date,
        mobile_phone: mobile_phone.trim(),
        membership_type: 'adult',
        is_family: !!is_family,
        payment_status: 'pending',
        status: 'pending',
        subscription_plan: subscriptionPlan,
        auth_user_id: null,
      })
      .select('id')
      .single();

    if (memberError || !member) {
      console.error('member-register insert failed:', memberError);
      return corsResponse({ error: memberError?.message ?? 'Üyelik kaydı oluşturulamadı.' }, 500);
    }

    if (is_family && members.length > 0) {
      const rows = members
        .filter((fm: FamilyMemberInput) => fm.full_name?.trim())
        .map((fm: FamilyMemberInput) => ({
          member_id: member.id,
          full_name: fm.full_name.trim(),
          age: fm.age ?? null,
          gender: fm.gender ?? null,
          member_type: fm.member_type ?? null,
        }));

      if (rows.length > 0) {
        const { error: familyError } = await supabase.from('family_members').insert(rows);
        if (familyError) {
          console.error('family_members insert failed:', familyError);
          return corsResponse({ error: 'Aile üyeleri kaydedilemedi.' }, 500);
        }
      }
    }

    return corsResponse({ memberId: member.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`member-register error: ${message}`);
    return corsResponse({ error: message }, 500);
  }
});
