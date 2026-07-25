import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import type { StripeProduct } from '../../stripe-config';
import { useAuth } from '../../context/AuthContext';
import { EmbeddedCheckoutPanel } from './EmbeddedCheckoutPanel';
import { buildPaymentReturnUrl } from '../../services/stripe';
import type { PlanId } from '../../services/stripe';

interface PricingCardProps {
  product: StripeProduct;
  isCurrentPlan?: boolean;
  isCheckoutOpen?: boolean;
  onSelectPlan?: (planId: PlanId) => void;
  onCloseCheckout?: () => void;
}

export function PricingCard({
  product,
  isCurrentPlan,
  isCheckoutOpen,
  onSelectPlan,
  onCloseCheckout,
}: PricingCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleCheckout = () => {
    setError(null);

    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing');
      return;
    }

    onSelectPlan?.(product.id as PlanId);
  };

  if (isCheckoutOpen) {
    return (
      <div className="sm:col-span-2">
        <EmbeddedCheckoutPanel
          checkoutParams={{
            priceId: product.priceId,
            mode: product.mode,
            returnUrl: buildPaymentReturnUrl({ plan: product.id as PlanId }),
          }}
          onBack={onCloseCheckout}
          title={`Subscribe to ${product.name}`}
          subtitle="Complete your secure payment below. Once confirmed, you'll be redirected to your member dashboard."
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-200 ${
        product.popular
          ? 'border-indigo-500 bg-indigo-950/60 shadow-xl shadow-indigo-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {product.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
            <Star className="h-3 w-3 fill-white" />
            Best Value
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3.5 right-6">
          <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            Current Plan
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white">{product.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{product.description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-medium text-white/50">{product.currencySymbol}</span>
          <span className="text-5xl font-bold tracking-tight text-white">
            {product.price.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
          </span>
        </div>
        <p className="mt-1 text-sm text-white/40">
          per {product.interval}
          {product.interval === 'year' && (
            <span className="ml-2 text-emerald-400">
              ({product.currencySymbol}{(product.price / 12).toFixed(2)}/mo)
            </span>
          )}
        </p>
      </div>

      <ul className="mb-8 space-y-3 flex-1">
        {product.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              product.popular ? 'bg-indigo-500/20' : 'bg-white/10'
            }`}>
              <Check className={`h-3 w-3 ${product.popular ? 'text-indigo-400' : 'text-white/60'}`} />
            </div>
            <span className="text-sm text-white/70">{feature}</span>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={handleCheckout}
        disabled={isCurrentPlan}
        className={`relative w-full rounded-xl py-3 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
          product.popular
            ? 'bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600'
            : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/5'
        }`}
      >
        {isCurrentPlan ? 'Active Plan' : `Subscribe to ${product.name}`}
      </button>
    </div>
  );
}
