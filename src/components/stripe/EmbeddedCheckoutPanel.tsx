import { useEffect, useState } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getStripe, isStripeConfigured } from '../../lib/stripeClient';
import { createEmbeddedCheckoutSession, type CreateCheckoutSessionParams } from '../../services/checkout';

interface EmbeddedCheckoutPanelProps {
  checkoutParams: CreateCheckoutSessionParams;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export function EmbeddedCheckoutPanel({
  checkoutParams,
  onBack,
  title = 'Complete Your Payment',
  subtitle = 'Enter your payment details below to activate your membership.',
}: EmbeddedCheckoutPanelProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStripeConfigured()) {
      setError('Payment is not configured. Please contact support or try again later.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const result = await createEmbeddedCheckoutSession(checkoutParams);

      if (cancelled) return;

      if (result.error || !result.data) {
        setError(result.error || 'Failed to initialize checkout. Please try again.');
        setLoading(false);
        return;
      }

      setClientSecret(result.data.clientSecret);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    checkoutParams.priceId,
    checkoutParams.mode,
    checkoutParams.returnUrl,
    checkoutParams.memberId,
    checkoutParams.authUserId,
  ]);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(62,200,200,0.18)',
        boxShadow: '0 32px 80px rgba(13,77,124,0.12)',
        padding: 'clamp(1.25rem, 4vw, 2rem)',
        overflow: 'hidden',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back to previous step"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '1rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '99px',
              border: '1.5px solid rgba(13,77,124,0.15)',
              background: '#fff',
              color: 'var(--uid-navy)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </button>
        )}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(24px, 5vw, 28px)',
            fontWeight: 500,
            color: 'var(--uid-navy)',
            margin: '0 0 0.5rem',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: 'var(--text-mid)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '3rem 1rem',
          }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--uid-teal)' }} aria-hidden="true" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-mid)' }}>
            Preparing secure checkout…
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.15)',
          }}
        >
          <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#dc2626', margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {clientSecret && !error && (
        <div id="embedded-checkout" style={{ minHeight: 'min(400px, 70vh)' }}>
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}
    </div>
  );
}
