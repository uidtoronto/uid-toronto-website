import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, ArrowRight, X, Instagram, Facebook, Youtube, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLang } from '../context/LangContext';
import { getPublishedProjects } from '../services/projects';
import { pickLocalized } from '../lib/localizedContent';
import { projectGradient, formatProjectYear } from '../lib/projectUtils';
import type { Project } from '../types';

function SocialLinks({ project }: { project: Project }) {
  const links = [
    { url: project.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: project.facebook_url, icon: Facebook, label: 'Facebook' },
    { url: project.youtube_url, icon: Youtube, label: 'YouTube' },
    { url: project.tiktok_url, icon: ExternalLink, label: 'TikTok' },
    { url: project.website_url, icon: ExternalLink, label: 'Website' },
  ].filter(l => l.url);

  if (!links.length) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      {links.map(({ url, icon: Icon, label }) => (
        <a
          key={label}
          href={url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid rgba(62,200,200,0.3)', color: 'var(--uid-teal)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(62,200,200,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon size={15} />
        </a>
      ))}
    </div>
  );
}

export default function Works() {
  const { lang, t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState(0);
  const [filtering, setFiltering] = useState(false);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    void getPublishedProjects().then(res => {
      if (res.data.length) setProjects(res.data);
    });
  }, []);

  const categories = useMemo(() => {
    const allLabel = lang === 'TR' ? 'Tümü' : 'All';
    const cats = new Set<string>();
    projects.forEach(p => {
      const cat = pickLocalized(p.category_en, p.category_tr, lang);
      if (cat) cats.add(cat);
    });
    return [allLabel, ...Array.from(cats)];
  }, [projects, lang]);

  const handleFilter = (i: number) => {
    if (i === active) return;
    setFiltering(true);
    setTimeout(() => {
      setActive(i);
      setDisplayIdx(i);
      setFiltering(false);
      setExpandedId(null);
    }, 250);
  };

  const filtered = displayIdx === 0
    ? projects
    : projects.filter(w => pickLocalized(w.category_en, w.category_tr, lang) === categories[displayIdx]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1 }
    );
    cardsRef.current.forEach(c => { if (c) observer.observe(c); });
    return () => observer.disconnect();
  }, [filtered]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const expanded = expandedId ? projects.find(p => p.id === expandedId) : null;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '76px' }}>
        <section className="section-pad" style={{ padding: '5rem 2rem 4rem', background: 'linear-gradient(160deg, #F0F9FF, #EAF5F5, #F7FAFC)', position: 'relative', overflow: 'hidden' }}>
          <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <div style={{ maxWidth: '1140px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', fontSize: '13px', color: 'var(--text-soft)' }}>
              <Link to="/" style={{ color: 'var(--uid-teal)', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                {t.worksPage.breadHome}
              </Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-mid)' }}>{lang === 'TR' ? 'Çalışmalarımız' : 'Our Works'}</span>
            </div>

            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem' }}>
              {t.worksPage.tag}
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(42px, 6vw, 70px)', fontWeight: 300, color: 'var(--uid-navy)', margin: '0 0 0.75rem', lineHeight: 1.1 }}>
              <em>{t.worksPage.heading}</em>
            </h1>
            <p style={{ color: 'var(--text-mid)', fontSize: '16px', fontWeight: 300, maxWidth: '540px', lineHeight: 1.8 }}>
              {t.worksPage.sub}
            </p>
          </div>
        </section>

        {categories.length > 1 && (
          <section style={{ padding: '1.25rem 1.25rem 0', background: '#fff', borderBottom: '1px solid var(--silver)' }}>
            <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '1.25rem' }}>
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => handleFilter(i)}
                  style={{
                    padding: '8px 20px', borderRadius: '99px', fontSize: '13.5px', fontWeight: 400,
                    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', border: '1.5px solid',
                    transition: 'all 0.25s',
                    ...(active === i
                      ? { background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-teal-dark))', borderColor: 'transparent', color: '#fff' }
                      : { background: 'transparent', borderColor: 'rgba(62,200,200,0.3)', color: 'var(--text-mid)' }
                    ),
                  }}
                  onMouseEnter={e => { if (active !== i) { e.currentTarget.style.borderColor = 'var(--uid-teal)'; e.currentTarget.style.color = 'var(--uid-teal)'; } }}
                  onMouseLeave={e => { if (active !== i) { e.currentTarget.style.borderColor = 'rgba(62,200,200,0.3)'; e.currentTarget.style.color = 'var(--text-mid)'; } }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>
        )}

        <section style={{ padding: '2rem 1.25rem 5rem', background: '#fff' }}>
          <div className={`works-grid-container ${filtering ? 'filtering' : ''}`} style={{ maxWidth: '1140px', margin: '0 auto' }}>
            {expanded && (
              <div style={{
                marginBottom: '2rem', padding: '1.5rem', borderRadius: '20px',
                border: '1px solid rgba(62,200,200,0.3)', background: '#fff',
                boxShadow: '0 12px 40px rgba(13,77,124,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 400, color: 'var(--uid-navy)', margin: 0 }}>
                    {pickLocalized(expanded.title_en, expanded.title_tr, lang)}
                  </h2>
                  <button onClick={() => setExpandedId(null)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-soft)', padding: '4px' }}>
                    <X size={20} />
                  </button>
                </div>
                <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: '1rem' }}>
                  {pickLocalized(expanded.description_en, expanded.description_tr, lang)}
                </p>
                {(expanded.gallery_urls?.length ?? 0) > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {expanded.gallery_urls.map(url => (
                      <img key={url} src={url} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--silver)' }} />
                    ))}
                  </div>
                )}
                <SocialLinks project={expanded} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((work, i) => {
                const title = pickLocalized(work.title_en, work.title_tr, lang);
                const titleAlt = lang === 'TR' ? work.title_en : work.title_tr;
                const cat = pickLocalized(work.category_en, work.category_tr, lang);
                const desc = pickLocalized(work.description_en, work.description_tr, lang);
                const year = formatProjectYear(work.project_date);
                const grad = projectGradient(i);

                return (
                  <div
                    key={`${work.id}-${displayIdx}`}
                    ref={el => cardsRef.current[i] = el}
                    className="reveal-up"
                    style={{ background: '#fff', border: '1px solid var(--silver)', borderRadius: '20px', overflow: 'hidden', transitionDelay: `${i * 0.06}s`, transition: 'transform 0.35s, box-shadow 0.35s, border-color 0.35s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(13,77,124,0.1)'; e.currentTarget.style.borderColor = 'rgba(62,200,200,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--silver)'; }}
                  >
                    <div style={{ height: '160px', background: work.cover_image_url ? undefined : grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {work.cover_image_url ? (
                        <img src={work.cover_image_url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
                          <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: '56px' }}>✦</div>
                        </>
                      )}
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                          {cat}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 500, color: 'var(--uid-navy)', marginBottom: '0.25rem', lineHeight: 1.3 }}>{title}</h3>
                      {titleAlt && (
                        <p style={{ fontSize: '12px', color: 'var(--text-soft)', fontStyle: 'italic', marginBottom: '0.75rem' }}>{titleAlt}</p>
                      )}
                      <p style={{ fontSize: '14px', color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.7, marginBottom: '1rem' }}>{desc}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-soft)', fontSize: '12px' }}>
                          <Calendar size={13} /><span>{year}</span>
                        </div>
                        <button
                          onClick={() => setExpandedId(expandedId === work.id ? null : work.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--uid-teal)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'gap 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.gap = '8px'}
                          onMouseLeave={e => e.currentTarget.style.gap = '5px'}
                        >
                          {t.worksPage.readMore} <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
