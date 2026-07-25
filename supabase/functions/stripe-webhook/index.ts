import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: { name: 'UID Toronto Membership', version: '1.0.0' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook signature verification failed: ${message}`);
      return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing webhook:', message);
    return Response.json({ error: message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object;
  if (!stripeData) return;

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(stripeData as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(stripeData as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(stripeData as Stripe.Subscription);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(stripeData as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(stripeData as Stripe.Invoice);
      break;
    default:
      console.info(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!customerId) {
    console.error('checkout.session.completed: no customer id');
    return;
  }

  const memberId = session.metadata?.member_id ?? null;
  const userId = session.metadata?.user_id ?? null;
  const paymentTimestamp = new Date().toISOString();
  const isSubscription = session.mode === 'subscription';

  console.info(`Processing checkout.session.completed for customer ${customerId}`);

  if (memberId) {
    const { error: memberErr } = await supabase
      .from('members')
      .update({
        payment_status: 'active',
        status: 'active',
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        last_payment_date: paymentTimestamp,
        updated_at: paymentTimestamp,
      })
      .eq('id', memberId);

    if (memberErr) {
      console.error('Failed to activate member:', memberErr);
    } else {
      console.info(`Member ${memberId} activated after checkout.`);
    }
  }

  if (userId) {
    await confirmPaidUserEmail(userId);
  }

  if (isSubscription) {
    await syncCustomerFromStripe(customerId, {
      memberId,
      userId,
      lastPaymentDate: paymentTimestamp,
    });
  } else if (session.mode === 'payment' && session.payment_status === 'paid') {
    const { error } = await supabase.from('stripe_orders').insert({
      checkout_session_id: session.id,
      payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? '',
      customer_id: customerId,
      amount_subtotal: session.amount_subtotal ?? 0,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? 'cad',
      payment_status: session.payment_status,
      status: 'completed',
    });
    if (error) console.error('Error inserting order:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) {
    console.error('customer.subscription.updated: no customer id');
    return;
  }

  await syncCustomerFromStripe(customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) {
    console.error('customer.subscription.deleted: no customer id');
    return;
  }

  const { error } = await supabase.from('stripe_subscriptions').upsert(
    {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price.id ?? null,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: 'canceled',
    },
    { onConflict: 'customer_id' },
  );

  if (error) {
    console.error('Error marking subscription deleted:', error);
    return;
  }

  await syncMemberSubscription(customerId, subscription, {
    lastPaymentDate: undefined,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) {
    console.error('invoice.paid: no customer id');
    return;
  }

  const lastPaymentDate = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : new Date().toISOString();

  await syncCustomerFromStripe(customerId, { lastPaymentDate });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) {
    console.error('invoice.payment_failed: no customer id');
    return;
  }

  await syncCustomerFromStripe(customerId);
}

async function syncCustomerFromStripe(
  customerId: string,
  options: {
    memberId?: string | null;
    userId?: string | null;
    lastPaymentDate?: string;
  } = {},
) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  if (subscriptions.data.length === 0) {
    const { error } = await supabase.from('stripe_subscriptions').upsert(
      { customer_id: customerId, status: 'not_started' },
      { onConflict: 'customer_id' },
    );
    if (error) console.error('Error updating subscription status:', error);
    return;
  }

  const subscription = subscriptions.data[0];

  const { error } = await supabase.from('stripe_subscriptions').upsert(
    {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price.id ?? null,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
            payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : {}),
      status: subscription.status,
    },
    { onConflict: 'customer_id' },
  );

  if (error) {
    console.error('Error syncing subscription:', error);
    throw new Error('Failed to sync subscription in database');
  }

  await syncMemberSubscription(customerId, subscription, options);

  const resolvedUserId = options.userId ?? (await getUserIdForCustomer(customerId));
  if (resolvedUserId) {
    await syncAuthMembershipMetadata(resolvedUserId, subscription);
  }
}

async function syncMemberSubscription(
  customerId: string,
  subscription: Stripe.Subscription,
  options: {
    memberId?: string | null;
    userId?: string | null;
    lastPaymentDate?: string;
  } = {},
) {
  const interval = subscription.items.data[0]?.price.recurring?.interval ?? null;
  const planLabel = interval === 'year' ? 'annual' : interval === 'month' ? 'monthly' : 'unknown';
  const renewalDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  const updatePayload: Record<string, unknown> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_plan: planLabel,
    subscription_status: subscription.status,
    renewal_date: renewalDate,
    updated_at: new Date().toISOString(),
  };

  if (options.lastPaymentDate) {
    updatePayload.last_payment_date = options.lastPaymentDate;
  }

  if (isActive) {
    updatePayload.payment_status = 'active';
    updatePayload.status = 'active';
  }

  if (options.memberId) {
    const { error } = await supabase.from('members').update(updatePayload).eq('id', options.memberId);
    if (error) console.error(`Failed to sync member ${options.memberId}:`, error);
    return;
  }

  const { error: byCustomerError } = await supabase
    .from('members')
    .update(updatePayload)
    .eq('stripe_customer_id', customerId);

  if (byCustomerError) {
    console.error(`Failed to sync member subscription for ${customerId}:`, byCustomerError);
    return;
  }

  if (options.userId) {
    const { error: byAuthError } = await supabase
      .from('members')
      .update(updatePayload)
      .eq('auth_user_id', options.userId);

    if (byAuthError) {
      console.error(`Failed to sync member by auth_user_id ${options.userId}:`, byAuthError);
    }
  }
}

async function getUserIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  return data?.user_id ?? null;
}

async function syncAuthMembershipMetadata(userId: string, subscription: Stripe.Subscription) {
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const renewalDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
    user_metadata: {
      membership_status: isActive ? 'active' : subscription.status,
      membership_type: 'individual',
      renewal_date: renewalDate,
    },
  });

  if (error) {
    console.error(`Failed to update auth metadata for user ${userId}:`, error);
  }
}

async function confirmPaidUserEmail(userId: string) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (error) {
    console.error(`Failed to confirm email for user ${userId}:`, error);
  }
}
