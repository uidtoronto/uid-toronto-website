import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, Home } from 'lucide-react';
import { UIDLogo } from '../components/UIDLogo';
import { verifyMemberPayment } from '../services/stripe';
import { clearPendingRegistrationCheckout, getPendingRegistrationCheckout } from '../lib/registrationCheckout';

type Status = 'verifying' | 'success' | 'failed';

export default function MembershipConfirmation() {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get('member') ?? getPendingRegistrationCheckout()?.memberId ?? null;
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Ödemeniz güvenli sunucumuzda doğrulanıyor…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!memberId) {
        setStatus('success');
        setMessage('');
        return;
      }

      const { paid, error } = await verifyMemberPayment(memberId);
      if (cancelled) return;

      if (paid) {
        setStatus('success');
        clearPendingRegistrationCheckout();
        return;
      }

      setStatus('failed');
      setMessage(
        error ??
          'Ödemeniz henüz onaylanmadı. Ödemeyi tamamladıysanız birkaç dakika sonra tekrar kontrol edin.',
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(165deg, #F0F9FF 0%, #EAF5F5 35%, #F7FAFC 65%, #FFFFFF 100%)', position: 'relative', overflow: 'hidden', padding: '2rem' }}>
      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '520px' }}>
        <Link to="/" style={{ display: 'inline-flex', marginBottom: '2rem' }}>
          <UIDLogo width={140} />
        </Link>

        {status === 'verifying' && (
          <>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', boxShadow: '0 12px 40px rgba(62,200,200,0.35)' }}>
              <Loader2 size={44} color="#fff" className="animate-spin" />
            </div>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, marginBottom: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
              Doğrulanıyor
            </p>
            <p style={{ fontSize: '15px', color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.7, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }} style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', boxShadow: '0 12px 40px rgba(62,200,200,0.35)' }}>
              <CheckCircle2 size={44} color="#fff" />
            </motion.div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 500, color: 'var(--uid-navy)', margin: '0 0 1rem', lineHeight: 1.25 }}>
              Teşekkür Ederiz!
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.75, margin: '0 0 2.5rem', fontFamily: "'DM Sans', sans-serif" }}>
              Üyeliğiniz başarıyla oluşturuldu. UID Toronto ailesine hoş geldiniz. Bilgileriniz tarafımıza ulaştı.
            </p>
            <Link
              to="/"
              className="shimmer-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 32px', borderRadius: '99px', fontSize: '15px', fontWeight: 500,
                background: 'linear-gradient(135deg, #0D4D7C, #1A6A9A)', color: '#fff',
                textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Home size={17} />
              Ana Sayfaya Dön
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
              <AlertCircle size={40} color="#f59e0b" />
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 500, color: 'var(--uid-navy)', margin: '0 0 1rem', lineHeight: 1.2 }}>
              İşlem devam ediyor
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.7, margin: '0 0 2rem', fontFamily: "'DM Sans', sans-serif" }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '99px', fontSize: '15px', fontWeight: 500, background: 'linear-gradient(135deg, #0D4D7C, #1A6A9A)', color: '#fff', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                Ana Sayfaya Dön
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
