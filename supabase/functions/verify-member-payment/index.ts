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

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { member_id } = await req.json();

    if (!member_id || typeof member_id !== 'string') {
      return corsResponse({ error: 'member_id is required' }, 400);
    }

    const { data: member, error } = await supabase
      .from('members')
      .select('payment_status, subscription_status, status')
      .eq('id', member_id)
      .maybeSingle();

    if (error) {
      console.error('verify-member-payment lookup failed:', error);
      return corsResponse({ error: 'Verification failed' }, 500);
    }

    if (!member) {
      return corsResponse({ paid: false, error: 'Member not found' });
    }

    const paid =
      member.payment_status === 'active' ||
      member.status === 'active' ||
      member.subscription_status === 'active' ||
      member.subscription_status === 'trialing';

    return corsResponse({ paid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`verify-member-payment error: ${message}`);
    return corsResponse({ error: message }, 500);
  }
});
