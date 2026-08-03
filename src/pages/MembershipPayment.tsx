import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react';
import { UIDLogo } from '../components/UIDLogo';
import { EmbeddedCheckoutPanel } from '../components/stripe/EmbeddedCheckoutPanel';
import { getPendingRegistrationCheckout } from '../lib/registrationCheckout';
import { PLANS, type PlanId, buildPaymentReturnUrl } from '../services/stripe';

const PLAN_LABELS: Record<PlanId, string> = {
  monthly: 'Aylık Üyelik',
  annual: 'Yıllık Üyelik',
};

function parsePlan(value: string | null): PlanId | null {
  if (value === 'monthly' || value === 'annual') return value;
  return null;
}

export default function MembershipPayment() {
  const [searchParams] = useSearchParams();
  const pending = getPendingRegistrationCheckout();

  const memberId = searchParams.get('member') ?? pending?.memberId ?? null;
  const plan = parsePlan(searchParams.get('plan')) ?? pending?.plan ?? null;

  if (!memberId || !plan) {
    return <Navigate to="/membership" replace />;
  }

  const activePlan = PLANS[plan];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(165deg, #F0F9FF 0%, #EAF5F5 35%, #F7FAFC 65%, #FFFFFF 100%)', position: 'relative', overflow: 'hidden', paddingTop: '90px', paddingBottom: '4rem' }}>
      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,200,200,0.12), transparent 70%)', animation: 'floatOrb 9s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/membership" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, color: 'var(--uid-navy)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Üyelik Formu
          </Link>
          <UIDLogo width={120} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '1.75rem' }}
        >
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
            Güvenli Ödeme
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--uid-navy)', margin: 0, lineHeight: 1.2 }}>
            <em>Üyelik Ödemesi</em>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: 'linear-gradient(160deg, #0D4D7C 0%, #061E30 100%)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 16px 48px rgba(13,77,124,0.25)',
          }}
        >
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, margin: '0 0 0.35rem', fontFamily: "'DM Sans', sans-serif" }}>
            Seçilen Plan
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 500, color: '#fff', margin: 0 }}>
              {PLAN_LABELS[plan]}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: '#fff', margin: 0 }}>
              {activePlan.currency} ${activePlan.price}
              <span style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.55)', marginLeft: '4px' }}>
                /{plan === 'monthly' ? 'Ay' : 'Yıl'}
              </span>
            </p>
          </div>
        </motion.div>

        <EmbeddedCheckoutPanel
          checkoutParams={{
            productId: activePlan.productId,
            mode: 'subscription',
            returnUrl: buildPaymentReturnUrl({ plan, memberId }),
            memberId,
            guestCheckout: true,
          }}
          title="Ödeme"
          subtitle="Güvenli ödeme formunu doldurarak üyeliğinizi tamamlayın."
        />

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem 2rem', marginTop: '2rem' }}>
          {[
            { icon: ShieldCheck, label: 'Stripe ile güvenli ödeme' },
            { icon: CreditCard, label: 'İstediğiniz zaman iptal' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} style={{ fontSize: '12px', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Sans', sans-serif" }}>
              <Icon size={12} style={{ color: 'var(--uid-teal)' }} /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
