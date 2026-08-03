import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'UID Toronto Donations',
    version: '1.0.0',
  },
});

const MIN_DONATION_CENTS = 500;
const donationProductId = Deno.env.get('STRIPE_DONATION_PRODUCT_ID') ?? '';

function resolveDonationProductId(): string | null {
  return donationProductId.startsWith('prod_') ? donationProductId : null;
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
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
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

    const { amount_cents, return_url } = await req.json();

    if (typeof return_url !== 'string' || !return_url.startsWith('http')) {
      return corsResponse({ error: 'return_url must be a valid URL' }, 400);
    }

    if (typeof amount_cents !== 'number' || !Number.isInteger(amount_cents)) {
      return corsResponse({ error: 'amount_cents must be an integer' }, 400);
    }

    if (amount_cents < MIN_DONATION_CENTS) {
      return corsResponse({ error: 'Minimum donation is CAD $5.00' }, 400);
    }

    const donationProduct = resolveDonationProductId();
    const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
      currency: 'cad',
      unit_amount: amount_cents,
      ...(donationProduct
        ? { product: donationProduct }
        : {
            product_data: {
              name: 'UID Toronto Donation',
              description: 'Thank you for supporting UID Toronto',
            },
          }),
    };

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      return_url,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: priceData,
        },
      ],
      mode: 'payment',
      metadata: {
        checkout_type: 'donation',
      },
    });

    console.log(`Created donation checkout session ${session.id} for ${amount_cents} cents CAD`);

    return corsResponse({
      sessionId: session.id,
      clientSecret: session.client_secret,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Donation checkout error: ${message}`);
    return corsResponse({ error: message }, 500);
  }
});
