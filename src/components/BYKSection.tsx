import { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';
import { getBoardMembers } from '../services/boardMembers';
import { pickLocalized } from '../lib/localizedContent';
import type { BoardMember } from '../types';

export default function BYKSection() {
  const { lang, t } = useLang();
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);

  useEffect(() => {
    void getBoardMembers().then(res => {
      if (res.data.length) setMembers(res.data);
    });
  }, []);

  const featured = members.filter(m => m.is_featured);
  const regular = members.filter(m => !m.is_featured);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('revealed'); }),
      { threshold: 0.08 }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    cardsRef.current.forEach(card => { if (card) observer.observe(card); });
    return () => observer.disconnect();
  }, [members]);

  const displayName = (m: BoardMember) => {
    const name = pickLocalized(m.name_en, m.name_tr, lang);
    return name || (lang === 'TR' ? 'İsim Soyisim' : 'TBA');
  };

  const displayPosition = (m: BoardMember) => pickLocalized(m.position_en, m.position_tr, lang);
  const displayPositionAlt = (m: BoardMember) => lang === 'TR' ? m.position_en : m.position_tr;

  const PhotoCircle = ({ photo, name, size }: { photo: string | null; name: string; size: 'lg' | 'sm' }) => {
    const dim = size === 'lg' ? '80px' : '64px';
    const fontSize = size === 'lg' ? '22px' : '16px';
    if (photo) {
      return (
        <div
          className="photo-circle"
          style={{
            width: dim, height: dim, borderRadius: '50%',
            border: `2px solid rgba(62,200,200,${size === 'lg' ? '0.5' : '0.4'})`,
            overflow: 'hidden',
            margin: '0 auto 0.75rem',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </div>
      );
    }
    return (
      <div
        className="photo-circle"
        style={{
          width: dim, height: dim, borderRadius: '50%',
          background: size === 'lg'
            ? 'linear-gradient(135deg, rgba(62,200,200,0.3), rgba(13,77,124,0.2))'
            : 'linear-gradient(135deg, rgba(62,200,200,0.2), rgba(13,77,124,0.12))',
          border: `2px dashed rgba(62,200,200,${size === 'lg' ? '0.5' : '0.35'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: size === 'lg' ? '0 auto 1rem' : '0 auto 0.75rem',
          transition: 'border-style 0.3s, border-color 0.3s, box-shadow 0.3s',
        }}
      >
        <span style={{ fontSize, color: 'rgba(13,77,124,0.25)', fontFamily: "'Cormorant Garamond', serif" }}>✦</span>
      </div>
    );
  };

  if (!members.length) return null;

  return (
    <section id="byk" className="section-pad" style={{ padding: '6rem 2rem', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(13,77,124,0.02) 0, rgba(13,77,124,0.02) 1px, transparent 0, transparent 50%), repeating-linear-gradient(45deg, rgba(13,77,124,0.02) 0, rgba(13,77,124,0.02) 1px, transparent 0, transparent 50%)',
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <div ref={titleRef} className="reveal-up" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {t.byk.tag}
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4.5vw, 50px)', fontWeight: 300, color: 'var(--uid-navy)', margin: '0 0 0.5rem' }}>
            {t.byk.heading}
          </h2>
          <p style={{ color: 'var(--text-soft)', fontSize: '14px', fontWeight: 300 }}>{t.byk.sub}</p>
        </div>

        {featured.length > 0 && (
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {featured.map((role, i) => (
              <div
                key={role.id}
                ref={el => cardsRef.current[i] = el}
                className="reveal-up byk-card byk-featured-card"
                style={{
                  background: '#fff',
                  border: '1.5px solid rgba(62,200,200,0.3)',
                  borderRadius: '18px',
                  padding: '1.5rem 1.5rem 0',
                  textAlign: 'center',
                  overflow: 'hidden',
                  transitionDelay: `${i * 0.06}s`,
                  width: '220px',
                  flexShrink: 0,
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 700, background: 'rgba(62,200,200,0.08)', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(62,200,200,0.2)' }}>
                    {i === 0 ? (lang === 'TR' ? 'Başkan' : 'President') : (lang === 'TR' ? 'Sekreter' : 'Secretary')}
                  </span>
                </div>
                <PhotoCircle photo={role.photo_url} name={displayName(role)} size="lg" />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', color: 'var(--uid-dark)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                  {displayName(role)}
                </p>
                <p style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--uid-navy)', letterSpacing: '0.3px', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                  {displayPosition(role)}
                </p>
                <p style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-soft)', fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.3 }}>
                  {displayPositionAlt(role)}
                </p>
                <div style={{ height: '2px', margin: '0 -1.5rem', background: 'linear-gradient(90deg, transparent, var(--uid-teal), transparent)' }} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.875rem' }}>
          {regular.map((role, i) => (
            <div
              key={role.id}
              ref={el => cardsRef.current[i + featured.length] = el}
              className="reveal-up byk-card"
              style={{
                background: '#fff',
                border: '1px solid var(--silver)',
                borderRadius: '16px',
                padding: '1.1rem 0.9rem 0',
                textAlign: 'center',
                overflow: 'hidden',
                transitionDelay: `${(i + featured.length) * 0.04}s`,
              }}
            >
              <PhotoCircle photo={role.photo_url} name={displayName(role)} size="sm" />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14.5px', color: 'var(--uid-dark)', marginBottom: '0.3rem', lineHeight: 1.25 }}>
                {displayName(role)}
              </p>
              <p style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--uid-navy)', letterSpacing: '0.2px', marginBottom: '0.2rem', lineHeight: 1.3 }}>
                {displayPosition(role)}
              </p>
              <p style={{ fontSize: '9px', fontWeight: 300, color: 'var(--text-soft)', fontStyle: 'italic', marginBottom: '0.875rem', lineHeight: 1.3 }}>
                {displayPositionAlt(role)}
              </p>
              <div style={{ height: '2px', margin: '0 -0.9rem', background: 'linear-gradient(90deg, transparent, var(--uid-teal), transparent)' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
