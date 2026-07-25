import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Heart } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function DonationThankYouBanner() {
  const { t } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('donation') === 'success') {
      setVisible(true);
    }
  }, [searchParams]);

  const dismiss = () => {
    setVisible(false);
    searchParams.delete('donation');
    searchParams.delete('session_id');
    setSearchParams(searchParams, { replace: true });
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '88px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        width: 'min(560px, calc(100% - 2rem))',
        background: 'linear-gradient(135deg, #0D4D7C, #1A6A9A)',
        color: '#fff',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        boxShadow: '0 16px 48px rgba(13,77,124,0.28)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        animation: 'fadeUp 0.4s ease forwards',
      }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Heart size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600 }}>
          {t.donate.successTitle}
        </p>
        <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 300, lineHeight: 1.5, opacity: 0.9 }}>
          {t.donate.successMessage}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', opacity: 0.8, flexShrink: 0 }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
