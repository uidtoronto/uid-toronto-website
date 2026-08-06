import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, ArrowRight, X, Instagram, Facebook, Youtube, ExternalLink, Images } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Lightbox from '../components/Lightbox';
import { useLang } from '../context/LangContext';
import { getPublishedProjects } from '../services/projects';
import { pickLocalized } from '../lib/localizedContent';
import { projectGradient, formatProjectYear } from '../lib/projectUtils';
import { scrollToElement } from '../lib/scrollUtils';
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
          className="social-icon-link"
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

function truncateText(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

export default function Works() {
  const { lang, t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState(0);
  const [filtering, setFiltering] = useState(false);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; title: string } | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const detailTitleRef = useRef<HTMLHeadingElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

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

  const scrollToCard = useCallback((id: string) => {
    const idx = filtered.findIndex(p => p.id === id);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        scrollToElement(cardsRef.current[idx], { offset: 88 });
      });
    }
  }, [filtered]);

  const closeProject = useCallback((id: string) => {
    setExpandedId(null);
    scrollToCard(id);
  }, [scrollToCard]);

  const openProject = useCallback((id: string) => {
    setExpandedId(prev => {
      if (prev === id) {
        scrollToCard(id);
        return null;
      }
      return id;
    });
  }, [scrollToCard]);

  useEffect(() => {
    if (!expandedId) return;
    requestAnimationFrame(() => {
      scrollToElement(detailTitleRef.current, { offset: 88 });
    });
  }, [expandedId]);

  const scrollToGallery = () => {
    scrollToElement(galleryRef.current, { offset: 88 });
  };

  const openLightbox = (images: string[], index: number, title: string) => {
    setLightbox({ images, index, title });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1 },
    );
    cardsRef.current.forEach(c => { if (c) observer.observe(c); });
    return () => observer.disconnect();
  }, [filtered]);

  useEffect(() => {
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      window.scrollTo(0, 0);
    }
  }, []);

  const expanded = expandedId ? projects.find(p => p.id === expandedId) : null;
  const expandedTitle = expanded ? pickLocalized(expanded.title_en, expanded.title_tr, lang) : '';
  const galleryLabel = lang === 'TR' ? 'Galeri' : 'Gallery';
  const viewGalleryLabel = lang === 'TR' ? 'Galeriye git' : 'View gallery';

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

        {expanded && (
          <section
            id="project-detail"
            className="project-detail-panel"
            style={{ padding: '2rem 1.25rem 0', background: '#fff', scrollMarginTop: '88px' }}
          >
            <div style={{
              maxWidth: '1140px', margin: '0 auto', padding: '1.75rem',
              borderRadius: '20px', border: '1px solid rgba(62,200,200,0.3)',
              background: 'linear-gradient(160deg, #fff, #F7FAFC)',
              boxShadow: '0 12px 40px rgba(13,77,124,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600 }}>
                    {pickLocalized(expanded.category_en, expanded.category_tr, lang)}
                  </span>
                  <h2
                    ref={detailTitleRef}
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)', margin: '0.35rem 0 0', lineHeight: 1.2 }}
                  >
                    {expandedTitle}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-soft)', fontSize: '13px', marginTop: '0.5rem' }}>
                    <Calendar size={13} aria-hidden="true" />
                    <time dateTime={expanded.project_date}>{formatProjectYear(expanded.project_date)}</time>
                  </div>
                </div>
                <button
                  onClick={() => closeProject(expanded.id)}
                  aria-label={lang === 'TR' ? 'Kapat' : 'Close'}
                  className="focus-ring"
                  style={{ background: 'rgba(13,77,124,0.06)', border: 'none', cursor: 'pointer', color: 'var(--text-soft)', padding: '8px', borderRadius: '10px', transition: 'background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,77,124,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(13,77,124,0.06)'; }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
                {pickLocalized(expanded.description_en, expanded.description_tr, lang)}
              </p>

              {(expanded.gallery_urls?.length ?? 0) > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--uid-navy)' }}>
                      {galleryLabel}
                    </h3>
                    <button
                      type="button"
                      onClick={scrollToGallery}
                      className="works-card-btn focus-ring"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--uid-teal)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <Images size={14} aria-hidden="true" /> {viewGalleryLabel}
                    </button>
                  </div>
                  <div
                    ref={galleryRef}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem', scrollMarginTop: '88px' }}
                  >
                    {expanded.gallery_urls!.map((url, gi) => (
                      <button
                        key={url}
                        type="button"
                        className="project-gallery-thumb focus-ring"
                        onClick={() => openLightbox(expanded.gallery_urls!, gi, expandedTitle)}
                        style={{ padding: 0, border: '1px solid var(--silver)', borderRadius: '12px', overflow: 'hidden', background: 'none' }}
                        aria-label={`${galleryLabel} ${gi + 1}`}
                      >
                        <img
                          src={url}
                          alt={`${expandedTitle} — ${galleryLabel} ${gi + 1}`}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}

              <SocialLinks project={expanded} />
            </div>
          </section>
        )}

        <section style={{ padding: '2rem 1.25rem 5rem', background: '#fff' }}>
          <div className={`works-grid-container ${filtering ? 'filtering' : ''}`} style={{ maxWidth: '1140px', margin: '0 auto' }}>
            <div className="works-grid">
              {filtered.map((work, i) => {
                const title = pickLocalized(work.title_en, work.title_tr, lang);
                const titleAlt = lang === 'TR' ? work.title_en : work.title_tr;
                const cat = pickLocalized(work.category_en, work.category_tr, lang);
                const desc = pickLocalized(work.description_en, work.description_tr, lang);
                const shortDesc = truncateText(desc, 120);
                const year = formatProjectYear(work.project_date);
                const grad = projectGradient(i);
                const isActive = expandedId === work.id;

                return (
                  <div
                    key={`${work.id}-${displayIdx}`}
                    ref={el => { cardsRef.current[i] = el; }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isActive}
                    aria-label={`${title}${isActive ? '' : ` — ${t.worksPage.readMore}`}`}
                    className={`works-card reveal-up focus-ring${isActive ? ' works-card-active' : ''}`}
                    onClick={() => openProject(work.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(work.id); } }}
                  >
                    <div className="works-card-image-wrap" style={{ height: '160px', background: work.cover_image_url ? undefined : grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {work.cover_image_url ? (
                        <img src={work.cover_image_url} alt={title} loading="lazy" decoding="async" className="works-card-image" />
                      ) : (
                        <>
                          <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
                          <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: '56px' }} aria-hidden="true">✦</div>
                        </>
                      )}
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                        <span className="works-card-category">{cat}</span>
                      </div>
                    </div>

                    <div className="works-card-body">
                      <h3 className="works-card-title">{title}</h3>
                      {titleAlt && (
                        <p className="works-card-subtitle">{titleAlt}</p>
                      )}
                      <p className="works-card-desc">{shortDesc}</p>
                      <div className="works-card-footer">
                        <div className="works-card-date">
                          <Calendar size={13} aria-hidden="true" />
                          <time dateTime={work.project_date}>{year}</time>
                        </div>
                        <span className="works-card-btn">
                          {t.worksPage.readMore} <ArrowRight size={13} aria-hidden="true" />
                        </span>
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

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          altPrefix={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
