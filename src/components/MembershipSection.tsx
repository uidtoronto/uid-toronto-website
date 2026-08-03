import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { RosetteWatermark } from './BackgroundDecor';
import { MembershipPricingSelector } from './MembershipPricingSelector';

export default function MembershipSection() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(true); }),
      { threshold: 0.15 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSelectPlan = () => {
    navigate(`/membership?plan=${yearly ? 'annual' : 'monthly'}`);
  };

  return (
    <section id="uye" className="section-pad" style={{ padding: '7rem 2rem', background: 'var(--off-white)', position: 'relative', overflow: 'hidden' }}>
      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none' }} />
      <RosetteWatermark />

      <div
        ref={sectionRef}
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          position: 'relative',
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.65s ease-out, transform 0.65s ease-out',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {t.membership.tag}
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 300, color: 'var(--uid-navy)', margin: '0 0 1rem' }}>
            <em>{t.membership.heading}</em>
          </h2>
          <p style={{ fontSize: '15.5px', color: 'var(--text-mid)', fontWeight: 300, maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
            {t.membership.subtitle}
          </p>
        </div>

        <MembershipPricingSelector
          yearly={yearly}
          onYearlyChange={setYearly}
          onSelectPlan={handleSelectPlan}
        />

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem 2rem', marginTop: '1.75rem' }}>
          {[t.membership.trust1, t.membership.trust2, t.membership.trust3].map(trust => (
            <span key={trust} style={{ fontSize: '12px', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--uid-teal)', fontSize: '10px' }}>✦</span> {trust}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
