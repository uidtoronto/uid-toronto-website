import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      appInfo: { name: 'UID Toronto Membership', version: '1.0.0' },
    })
  : null;

interface MemberRow {
  id: string;
  email: string;
  payment_status: string;
  subscription_status: string | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_session_id: string | null;
}

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

function isPaidInDb(member: MemberRow): boolean {
  return (
    member.payment_status === 'active' ||
    member.status === 'active' ||
    member.subscription_status === 'active' ||
    member.subscription_status === 'trialing'
  );
}

async function resolveCustomerId(member: MemberRow): Promise<string | null> {
  if (member.stripe_customer_id) return member.stripe_customer_id;

  if (member.stripe_session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(member.stripe_session_id);
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
      if (customerId) return customerId;
    } catch (error) {
      console.error('verify-member-payment: session lookup failed', error);
    }
  }

  if (!stripe) return null;

  try {
    const search = await stripe.customers.search({
      query: `metadata['memberId']:'${member.id}'`,
      limit: 1,
    });
    if (search.data[0]?.id) return search.data[0].id;
  } catch (error) {
    console.error('verify-member-payment: customer search failed', error);
  }

  try {
    const customers = await stripe.customers.list({ email: member.email, limit: 5 });
    const match = customers.data.find(
      (customer) =>
        customer.metadata?.memberId === member.id || customer.metadata?.member_id === member.id,
    );
    if (match?.id) return match.id;
  } catch (error) {
    console.error('verify-member-payment: customer list failed', error);
  }

  return null;
}

async function activateMemberFromStripe(
  memberId: string,
  customerId: string,
  subscription?: Stripe.Subscription,
  session?: Stripe.Checkout.Session,
): Promise<boolean> {
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    stripe_customer_id: customerId,
    payment_status: 'active',
    status: 'active',
    updated_at: now,
    last_payment_date: now,
  };

  if (session?.id) updatePayload.stripe_session_id = session.id;

  if (subscription) {
    const interval = subscription.items.data[0]?.price.recurring?.interval ?? null;
    updatePayload.stripe_subscription_id = subscription.id;
    updatePayload.subscription_status = subscription.status;
    updatePayload.subscription_plan =
      interval === 'year' ? 'annual' : interval === 'month' ? 'monthly' : 'unknown';
    updatePayload.renewal_date = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
  }

  const { error } = await supabase.from('members').update(updatePayload).eq('id', memberId);
  if (error) {
    console.error('verify-member-payment: failed to activate member', error);
    return false;
  }

  return true;
}

async function syncMemberFromStripe(member: MemberRow): Promise<boolean> {
  if (!stripe) {
    console.error('verify-member-payment: STRIPE_SECRET_KEY not configured');
    return false;
  }

  if (member.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(member.stripe_session_id, {
        expand: ['subscription'],
      });

      if (session.status === 'complete') {
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

        if (customerId) {
          let subscription: Stripe.Subscription | undefined;

          if (session.subscription) {
            subscription =
              typeof session.subscription === 'string'
                ? await stripe.subscriptions.retrieve(session.subscription)
                : session.subscription;
          } else if (session.mode === 'subscription') {
            const subs = await stripe.subscriptions.list({
              customer: customerId,
              status: 'all',
              limit: 1,
            });
            subscription = subs.data[0];
          }

          const paid =
            session.payment_status === 'paid' ||
            session.mode === 'subscription' ||
            subscription?.status === 'active' ||
            subscription?.status === 'trialing';

          if (paid) {
            return activateMemberFromStripe(member.id, customerId, subscription, session);
          }
        }
      }
    } catch (error) {
      console.error('verify-member-payment: checkout session sync failed', error);
    }
  }

  const customerId = await resolveCustomerId(member);
  if (!customerId) return false;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 3,
  });

  const activeSub = subscriptions.data.find(
    (subscription) => subscription.status === 'active' || subscription.status === 'trialing',
  );

  if (activeSub) {
    return activateMemberFromStripe(member.id, customerId, activeSub);
  }

  const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 10 });
  const completed = sessions.data.find(
    (session) =>
      session.status === 'complete' &&
      (session.payment_status === 'paid' || session.mode === 'subscription'),
  );

  if (completed) {
    return activateMemberFromStripe(member.id, customerId, activeSub, completed);
  }

  return false;
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
      .select(
        'id, email, payment_status, subscription_status, status, stripe_customer_id, stripe_session_id',
      )
      .eq('id', member_id)
      .maybeSingle();

    if (error) {
      console.error('verify-member-payment lookup failed:', error);
      return corsResponse({ error: 'Verification failed' }, 500);
    }

    if (!member) {
      return corsResponse({ paid: false, error: 'Member not found' });
    }

    const row = member as MemberRow;

    if (isPaidInDb(row)) {
      return corsResponse({ paid: true, synced: false });
    }

    const synced = await syncMemberFromStripe(row);
    if (synced) {
      return corsResponse({ paid: true, synced: true });
    }

    return corsResponse({ paid: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`verify-member-payment error: ${message}`);
    return corsResponse({ error: message }, 500);
  }
});
