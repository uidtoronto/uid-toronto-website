import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { MosqueSilhouette } from './BackgroundDecor';
import { getFeaturedProjects } from '../services/projects';
import { pickLocalized } from '../lib/localizedContent';
import { projectGradient, formatProjectYear } from '../lib/projectUtils';
import type { Project } from '../types';

export default function WorksPreviewSection() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headRef = useRef<HTMLDivElement>(null);
  const [works, setWorks] = useState<Project[]>([]);

  useEffect(() => {
    void getFeaturedProjects(3).then(res => {
      if (res.data.length) setWorks(res.data);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1 }
    );
    if (headRef.current) observer.observe(headRef.current);
    cardsRef.current.forEach(c => { if (c) observer.observe(c); });
    return () => observer.disconnect();
  }, [works]);

  if (!works.length) return null;

  return (
    <section
      id="calisma"
      className="section-pad"
      style={{
        padding: '7rem 2rem',
        background: 'linear-gradient(160deg, #EBF5FB, #EAF8F8, #F7FAFC)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <MosqueSilhouette />
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <div ref={headRef} className="reveal-up" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {t.works.tag}
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 300, color: 'var(--uid-navy)', margin: '0 0 0.75rem' }}>
            <em>{t.works.heading}</em>
          </h2>
          <p style={{ color: 'var(--text-soft)', fontSize: '15px', fontWeight: 300, maxWidth: '520px', margin: '0 auto' }}>
            {t.works.sub}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {works.map((work, i) => {
            const title = pickLocalized(work.title_en, work.title_tr, lang);
            const titleAlt = lang === 'TR' ? work.title_en : work.title_tr;
            const cat = pickLocalized(work.category_en, work.category_tr, lang);
            const desc = pickLocalized(work.description_en, work.description_tr, lang);
            const year = formatProjectYear(work.project_date);
            const grad = projectGradient(i);

            return (
              <div
                key={work.id}
                ref={el => cardsRef.current[i] = el}
                className="reveal-up"
                style={{
                  background: '#fff', border: '1px solid var(--silver)', borderRadius: '20px',
                  overflow: 'hidden', transitionDelay: `${i * 0.1}s`,
                  transition: 'transform 0.35s, box-shadow 0.35s, border-color 0.35s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(13,77,124,0.1)'; e.currentTarget.style.borderColor = 'rgba(62,200,200,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--silver)'; }}
              >
                <div style={{ height: '160px', background: work.cover_image_url ? undefined : grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {work.cover_image_url ? (
                    <img src={work.cover_image_url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
                      <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '60px' }}>✦</div>
                    </>
                  )}
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                      {cat}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 500, color: 'var(--uid-navy)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                    {title}
                  </h3>
                  {titleAlt && (
                    <p style={{ fontSize: '12px', color: 'var(--text-soft)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                      {titleAlt}
                    </p>
                  )}
                  <p style={{ fontSize: '14px', color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.7, marginBottom: '1rem' }}>{desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-soft)', fontSize: '12px' }}>
                    <Calendar size={13} />
                    <span>{year}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            className="shimmer-btn"
            onClick={() => navigate('/works')}
            style={{
              padding: '13px 36px', borderRadius: '99px', fontSize: '14.5px', fontWeight: 500,
              background: 'var(--uid-navy)', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,77,124,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            {t.works.cta} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
