import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { getUpcomingEventsLocalized } from '../services/events';
import EventsList from './dashboard/EventsList';
import type { MemberEvent } from '../types';

export default function HomeEventsSection() {
  const { lang } = useLang();
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getUpcomingEventsLocalized(3, lang);
      if (!cancelled) {
        setEvents(res.data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  if (loading) {
    return (
      <section className="section-pad" style={{ padding: '5rem 1.25rem', background: 'var(--off-white)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--uid-teal)' }} />
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <section id="events" className="section-pad" style={{ padding: '5rem 1.25rem', background: 'var(--off-white)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {lang === 'TR' ? 'ETKİNLİKLER' : 'EVENTS'}
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 5vw, 48px)', fontWeight: 300, color: 'var(--uid-navy)', margin: 0 }}>
            <em>{lang === 'TR' ? 'Yaklaşan Etkinlikler' : 'Upcoming Events'}</em>
          </h2>
        </div>
        <EventsList events={events} />
      </div>
    </section>
  );
}
