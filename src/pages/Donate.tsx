import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { UIDLogo } from '../components/UIDLogo';
import { DonationCheckoutPanel } from '../components/stripe/DonationCheckoutPanel';
import { useLang } from '../context/LangContext';
import {
  MIN_DONATION_CAD,
  parseDonationAmount,
  formatDonationAmount,
} from '../services/donations';

const PRESET_AMOUNTS = [25, 50, 100, 250];

export default function Donate() {
  const { t } = useLang();
  const [amountInput, setAmountInput] = useState('25');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(25);
  const [showCheckout, setShowCheckout] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const amountCents = parseDonationAmount(amountInput);
  const isValidAmount = amountCents !== null && amountCents >= MIN_DONATION_CAD * 100;

  const handlePreset = (amount: number) => {
    setSelectedPreset(amount);
    setAmountInput(String(amount));
    setValidationError(null);
  };

  const handleCustomChange = (value: string) => {
    setAmountInput(value);
    setSelectedPreset(null);
    setValidationError(null);
  };

  const handleContinue = () => {
    if (!isValidAmount || amountCents === null) {
      setValidationError(t.donate.minError);
      return;
    }
    setShowCheckout(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(165deg, #F0F9FF 0%, #EAF5F5 35%, #F7FAFC 65%, #FFFFFF 100%)', position: 'relative', overflow: 'hidden', paddingTop: '90px', paddingBottom: '4rem' }}>
      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,200,200,0.12), transparent 70%)', animation: 'floatOrb 9s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,77,124,0.06), transparent 70%)', animation: 'floatOrb 11s ease-in-out infinite 2s', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ display: 'inline-flex', marginBottom: '2rem' }}>
            <UIDLogo width={140} />
          </Link>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
            {t.donate.tag}
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 5vw, 48px)', fontWeight: 400, color: 'var(--uid-navy)', margin: '0 0 1rem', lineHeight: 1.15 }}>
            <em>{t.donate.heading}</em>
          </h1>
          <p style={{ fontSize: '15.5px', color: 'var(--text-mid)', fontWeight: 300, maxWidth: '480px', margin: '0 auto', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
            {t.donate.subtitle}
          </p>
        </div>

        {showCheckout && isValidAmount && amountCents !== null ? (
          <DonationCheckoutPanel
            amountCents={amountCents}
            onBack={() => setShowCheckout(false)}
            title={t.donate.checkoutTitle}
            subtitle={t.donate.checkoutSubtitle.replace('{amount}', formatDonationAmount(amountCents))}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '2.25rem',
              border: '1px solid rgba(62,200,200,0.18)',
              boxShadow: '0 24px 60px rgba(13,77,124,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(62,200,200,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={18} style={{ color: 'var(--uid-teal)' }} />
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)', margin: 0 }}>
                {t.donate.amountLabel}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {PRESET_AMOUNTS.map(amount => {
                const active = selectedPreset === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePreset(amount)}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: active ? '2px solid var(--uid-teal)' : '1.5px solid rgba(13,77,124,0.12)',
                      background: active ? 'rgba(62,200,200,0.08)' : '#fff',
                      color: 'var(--uid-navy)',
                      cursor: 'pointer',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '22px',
                      fontWeight: 500,
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    ${amount}
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: 'var(--text-mid)' }}>
              {t.donate.customLabel}
            </label>
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'var(--text-soft)' }}>$</span>
              <input
                type="number"
                min={MIN_DONATION_CAD}
                step="0.01"
                value={amountInput}
                onChange={e => handleCustomChange(e.target.value)}
                placeholder={String(MIN_DONATION_CAD)}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 32px',
                  borderRadius: '14px',
                  border: validationError ? '1.5px solid rgba(220,38,38,0.4)' : '1.5px solid rgba(13,77,124,0.12)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '16px',
                  color: 'var(--uid-navy)',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)', margin: '0 0 1.5rem' }}>
              {t.donate.minNote}
            </p>

            {validationError && (
              <p role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#dc2626', margin: '0 0 1rem' }}>
                {validationError}
              </p>
            )}

            <button
              type="button"
              className="shimmer-btn"
              onClick={handleContinue}
              disabled={!isValidAmount}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '99px',
                fontSize: '15px',
                fontWeight: 500,
                background: isValidAmount ? 'linear-gradient(135deg, #0D4D7C, #1A6A9A)' : 'rgba(13,77,124,0.25)',
                color: '#fff',
                border: 'none',
                cursor: isValidAmount ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {t.donate.continue}
            </button>
          </motion.div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem 2rem', marginTop: '2.5rem' }}>
          {t.donate.trustItems.map(trust => (
            <span key={trust} style={{ fontSize: '12px', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ color: 'var(--uid-teal)', fontSize: '10px' }}>✦</span> {trust}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
