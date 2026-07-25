import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import DashboardNav from '../components/dashboard/DashboardNav';
import MembershipCard from '../components/dashboard/MembershipCard';
import Benefits from '../components/dashboard/Benefits';
import EventsList from '../components/dashboard/EventsList';
import NewsList from '../components/dashboard/NewsList';
import ProfilePanel from '../components/profile/ProfilePanel';
import { getUpcomingEventsLocalized } from '../services/events';
import { getPublishedNewsLocalized } from '../services/news';
import type { MemberEvent, MemberNews } from '../types';

type Section = 'overview' | 'events' | 'news' | 'profile';

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('overview');
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [news, setNews] = useState<MemberNews[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const isMemberActive = user?.membership_status === 'active';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setContentLoading(true);
      const [eventsRes, newsRes] = await Promise.all([
        getUpcomingEventsLocalized(6, lang),
        getPublishedNewsLocalized(6, lang),
      ]);
      if (cancelled) return;
      setEvents(eventsRes.data);
      setNews(newsRes.data);
      setContentLoading(false);
    })();
    return () => { cancelled = true; };
  }, [lang]);

  useEffect(() => {
    const el = document.getElementById(`section-${section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [section]);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', position: 'relative', overflow: 'hidden' }}>
      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />
      <DashboardNav active={section} onNavigate={s => setSection(s as Section)} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1140px', margin: '0 auto', padding: '120px 1.25rem 4rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2rem' }}
        >
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.5rem', fontFamily: "'DM Sans', sans-serif" }}>
            Member Dashboard
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 400, color: 'var(--uid-navy)', margin: 0, lineHeight: 1.2 }}>
            <em>Hello, {user.first_name}</em>
          </h1>
        </motion.div>

        {!isMemberActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: 'linear-gradient(160deg, #0D4D7C 0%, #061E30 100%)',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(13,77,124,0.2)',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', background: 'linear-gradient(90deg, transparent, rgba(62,200,200,0.1), transparent)', backgroundSize: '300% 100%', animation: 'borderTrace 4s linear infinite', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1.5px', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(62,200,200,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={18} style={{ color: 'var(--uid-teal)' }} />
              </div>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                  Complete your membership payment
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 300, margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
                  to unlock all member benefits
                </p>
              </div>
            </div>
            <button
              className="shimmer-btn"
              onClick={() => navigate('/membership')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '99px', fontSize: '14.5px', fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))',
                color: '#fff', border: 'none', cursor: 'pointer',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(62,200,200,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <CreditCard size={16} />
              Complete Payment
            </button>
          </motion.div>
        )}

        <div id="section-overview" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}
          className="dashboard-grid-overview">
          <MembershipCard user={user} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Benefits />
          </div>
        </div>

        {contentLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <Loader2 className="animate-spin" size={28} style={{ color: 'var(--uid-teal)' }} />
          </div>
        ) : (
          <>
            <div id="section-events" style={{ marginBottom: '1.5rem' }}>
              <EventsList events={events} />
            </div>
            <div id="section-news" style={{ marginBottom: '1.5rem' }}>
              <NewsList news={news} />
            </div>
          </>
        )}

        <div id="section-profile">
          <ProfilePanel />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid-overview {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
