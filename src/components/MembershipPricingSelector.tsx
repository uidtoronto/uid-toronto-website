import { Check, Users } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { PricingTab } from './ui/pricing-tab';

interface MembershipPricingSelectorProps {
  yearly: boolean;
  onYearlyChange: (yearly: boolean) => void;
  onSelectPlan: () => void;
  ctaLabel?: string;
}

export function MembershipPricingSelector({
  yearly,
  onYearlyChange,
  onSelectPlan,
  ctaLabel,
}: MembershipPricingSelectorProps) {
  const { t, lang } = useLang();
  const monthlyLabel = lang === 'TR' ? 'Aylık' : 'Monthly';
  const yearlyLabel = lang === 'TR' ? 'Yıllık' : 'Yearly';
  const selected = yearly ? yearlyLabel : monthlyLabel;
  const plan = yearly ? t.membership.yearly : t.membership.monthly;

  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="flex rounded-full p-1" style={{ background: 'rgba(13,77,124,0.08)' }}>
          <PricingTab
            text={monthlyLabel}
            selected={selected === monthlyLabel}
            setSelected={v => onYearlyChange(v === yearlyLabel)}
          />
          <PricingTab
            text={yearlyLabel}
            selected={selected === yearlyLabel}
            setSelected={v => onYearlyChange(v === yearlyLabel)}
          />
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(160deg, #0D4D7C 0%, #061E30 100%)',
          borderRadius: '28px',
          padding: '2.75rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(13,77,124,0.35)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: '28px', background: 'linear-gradient(90deg, transparent, rgba(62,200,200,0.12), transparent)', backgroundSize: '300% 100%', animation: 'borderTrace 4s linear infinite', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1.5px', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(62,200,200,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={16} style={{ color: 'var(--uid-teal)' }} />
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            {plan.name}
          </p>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '72px', fontWeight: 400, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>
            {plan.price}
          </span>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', margin: '4px 0 0' }}>
            {plan.period}
          </p>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }} />

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ minWidth: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px', flexShrink: 0 }}>
                <Check size={10} style={{ color: '#fff' }} />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.55 }}>{f}</p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="shimmer-btn"
          onClick={onSelectPlan}
          style={{
            width: '100%', padding: '16px', borderRadius: '99px', fontSize: '15px', fontWeight: 500,
            background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'transform 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(62,200,200,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          {ctaLabel ?? plan.cta}
        </button>
      </div>
    </>
  );
}
