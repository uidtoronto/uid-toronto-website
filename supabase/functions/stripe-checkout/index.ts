import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient, type User } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'UID Toronto Membership',
    version: '1.0.0',
  },
});

const REGISTRATION_CHECKOUT_WINDOW_MS = 60 * 60 * 1000;

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
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

interface GuestCheckoutMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  stripe_customer_id: string | null;
}

async function resolveGuestCheckoutMember(memberId: string): Promise<GuestCheckoutMember | null> {
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, payment_status, created_at, auth_user_id, stripe_customer_id')
    .eq('id', memberId)
    .maybeSingle();

  if (memberError || !member) {
    console.error('Guest checkout: member lookup failed', memberError);
    return null;
  }

  if (member.auth_user_id) {
    console.error('Guest checkout: member has auth_user_id — use registration_checkout instead');
    return null;
  }

  if (member.payment_status !== 'pending') {
    console.error('Guest checkout: member is not pending payment');
    return null;
  }

  const createdAt = new Date(member.created_at).getTime();
  if (Number.isNaN(createdAt) || Date.now() - createdAt > REGISTRATION_CHECKOUT_WINDOW_MS) {
    console.error('Guest checkout: window expired');
    return null;
  }

  return member as GuestCheckoutMember;
}

async function resolveRegistrationCheckoutUser(
  memberId: string,
  userId: string,
): Promise<User | null> {
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, auth_user_id, payment_status, created_at')
    .eq('id', memberId)
    .maybeSingle();

  if (memberError || !member) {
    console.error('Registration checkout: member lookup failed', memberError);
    return null;
  }

  if (member.auth_user_id !== userId) {
    console.error('Registration checkout: auth_user_id mismatch');
    return null;
  }

  if (member.payment_status !== 'pending') {
    console.error('Registration checkout: member is not pending payment');
    return null;
  }

  const createdAt = new Date(member.created_at).getTime();
  if (Number.isNaN(createdAt) || Date.now() - createdAt > REGISTRATION_CHECKOUT_WINDOW_MS) {
    console.error('Registration checkout: window expired');
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authData.user) {
    console.error('Registration checkout: auth user lookup failed', authError);
    return null;
  }

  return authData.user;
}

async function resolveRecurringPriceFromProduct(productId: string): Promise<string> {
  if (!productId.startsWith('prod_')) {
    throw new Error('product_id must be a Stripe Product ID (prod_...)');
  }

  const product = await stripe.products.retrieve(productId, { expand: ['default_price'] });
  const defaultPrice = product.default_price;

  if (defaultPrice && typeof defaultPrice === 'object' && defaultPrice.type === 'recurring') {
    return defaultPrice.id;
  }

  if (typeof defaultPrice === 'string') {
    const price = await stripe.prices.retrieve(defaultPrice);
    if (price.type === 'recurring' && price.active) {
      return price.id;
    }
  }

  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
    limit: 1,
  });

  const recurringPrice = prices.data[0]?.id;
  if (!recurringPrice) {
    throw new Error(`No active recurring price found for product ${productId}`);
  }

  return recurringPrice;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const {
      product_id,
      return_url,
      mode,
      member_id,
      user_id,
      registration_checkout,
      guest_checkout,
    } = await req.json();

    const error = validateParameters(
      { product_id, return_url, mode },
      {
        product_id: 'string',
        return_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      return corsResponse({ error }, 400);
    }

    let resolvedPriceId: string;
    try {
      resolvedPriceId = await resolveRecurringPriceFromProduct(product_id);
    } catch (resolveError: unknown) {
      const message = resolveError instanceof Error ? resolveError.message : 'Invalid product_id';
      return corsResponse({ error: message }, 400);
    }

    let user: User | null = null;
    let guestMember: GuestCheckoutMember | null = null;

    if (guest_checkout) {
      if (!member_id) {
        return corsResponse({ error: 'Guest checkout requires member_id' }, 400);
      }

      guestMember = await resolveGuestCheckoutMember(member_id);
      if (!guestMember) {
        return corsResponse({ error: 'Invalid guest checkout request' }, 403);
      }
    } else if (registration_checkout) {
      if (!member_id || !user_id) {
        return corsResponse({ error: 'Registration checkout requires member_id and user_id' }, 400);
      }

      user = await resolveRegistrationCheckoutUser(member_id, user_id);
      if (!user) {
        return corsResponse({ error: 'Invalid registration checkout request' }, 403);
      }
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return corsResponse({ error: 'Missing authorization header' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user: authUser },
        error: getUserError,
      } = await supabase.auth.getUser(token);

      if (getUserError) {
        return corsResponse({ error: 'Failed to authenticate user' }, 401);
      }

      if (!authUser) {
        return corsResponse({ error: 'User not found' }, 404);
      }

      user = authUser;
    }

    let customerId: string;

    if (guestMember) {
      if (guestMember.stripe_customer_id) {
        customerId = guestMember.stripe_customer_id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: guestMember.email,
          name: [guestMember.first_name, guestMember.last_name].filter(Boolean).join(' '),
          metadata: {
            memberId: guestMember.id,
          },
        });

        console.log(`Created Stripe customer ${newCustomer.id} for guest member ${guestMember.id}`);

        const { error: updateMemberError } = await supabase
          .from('members')
          .update({ stripe_customer_id: newCustomer.id })
          .eq('id', guestMember.id);

        if (updateMemberError) {
          console.error('Failed to save stripe_customer_id on member', updateMemberError);
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to clean up Stripe customer:', deleteError);
          }
          return corsResponse({ error: 'Failed to link Stripe customer to member' }, 500);
        }

        customerId = newCustomer.id;
      }

      if (mode === 'subscription') {
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription for guest customer', getSubscriptionError);
          return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
        }

        if (!subscription) {
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for guest customer', createSubscriptionError);
            return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
          }
        }
      }
    } else {
      const { data: customer, error: getCustomerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (getCustomerError) {
        console.error('Failed to fetch customer information from the database', getCustomerError);
        return corsResponse({ error: 'Failed to fetch customer information' }, 500);
      }

      if (!customer || !customer.customer_id) {
        const newCustomer = await stripe.customers.create({
          email: user!.email,
          metadata: {
            userId: user!.id,
          },
        });

        console.log(`Created new Stripe customer ${newCustomer.id} for user ${user!.id}`);

        const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
          user_id: user!.id,
          customer_id: newCustomer.id,
        });

        if (createCustomerError) {
          console.error('Failed to save customer information in the database', createCustomerError);

          try {
            await stripe.customers.del(newCustomer.id);
            await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to clean up after customer mapping error:', deleteError);
          }

          return corsResponse({ error: 'Failed to create customer mapping' }, 500);
        }

        if (mode === 'subscription') {
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: newCustomer.id,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to save subscription in the database', createSubscriptionError);

            try {
              await stripe.customers.del(newCustomer.id);
            } catch (deleteError) {
              console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
            }

            return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
          }
        }

        customerId = newCustomer.id;
        console.log(`Successfully set up new customer ${customerId} with subscription record`);
      } else {
        customerId = customer.customer_id;

        if (mode === 'subscription') {
          const { data: subscription, error: getSubscriptionError } = await supabase
            .from('stripe_subscriptions')
            .select('status')
            .eq('customer_id', customerId)
            .maybeSingle();

          if (getSubscriptionError) {
            console.error('Failed to fetch subscription information from the database', getSubscriptionError);
            return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
          }

          if (!subscription) {
            const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
              customer_id: customerId,
              status: 'not_started',
            });

            if (createSubscriptionError) {
              console.error('Failed to create subscription record for existing customer', createSubscriptionError);
              return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
            }
          }
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      ui_mode: 'embedded',
      return_url,
      payment_method_types: ['card'],
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      mode,
      metadata: {
        ...(member_id ? { member_id } : {}),
        ...(user ? { user_id: user.id } : {}),
        ...(guest_checkout ? { guest_checkout: 'true' } : {}),
      },
    });

    console.log(`Created embedded checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({
      sessionId: session.id,
      clientSecret: session.client_secret,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Checkout error: ${message}`);
    return corsResponse({ error: message }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, unknown>>(
  values: T,
  expected: Expectations<T>,
): string | undefined {
  for (const parameter in expected) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value as string)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}
