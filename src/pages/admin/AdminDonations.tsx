import { useEffect, useState } from 'react';
import { Loader2, Heart } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  getAllDonationsAdmin,
  getDonationStatsAdmin,
  formatDonationAmount,
} from '../../services/donations';
import type { Donation, DonationStats } from '../../types';

export default function AdminDonations() {
  const { toast } = useToast();
  const [items, setItems] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({ totalCount: 0, totalAmountCents: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [listRes, statsRes] = await Promise.all([
      getAllDonationsAdmin(),
      getDonationStatsAdmin(),
    ]);
    setItems(listRes.data);
    setStats(statsRes.data);
    if (listRes.error) toast(listRes.error, 'error');
    else if (statsRes.error) toast(statsRes.error, 'error');
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600 }}>
          Finance
        </p>
        <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 500, color: 'var(--uid-navy)' }}>
          Donations
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Donations" value={String(stats.totalCount)} icon={<Heart size={18} color="var(--uid-teal)" />} />
        <StatCard label="Total Raised" value={formatDonationAmount(stats.totalAmountCents)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--uid-teal)' }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid rgba(13,77,124,0.08)' }}>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-mid)' }}>
            No donations recorded yet.
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(13,77,124,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(13,77,124,0.04)', borderBottom: '1px solid rgba(13,77,124,0.08)' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Donor Email</th>
                  <th style={thStyle}>Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(13,77,124,0.06)' }}>
                    <td style={tdStyle}>{new Date(item.created_at).toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--uid-navy)' }}>{formatDonationAmount(item.amount)}</td>
                    <td style={tdStyle}>{item.email ?? '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-soft)' }}>{item.stripe_payment_intent_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.875rem 1rem',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: 'var(--text-soft)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  color: 'var(--text-mid)',
  verticalAlign: 'top',
};

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(13,77,124,0.08)', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {icon}
        <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
      </div>
      <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 500, color: 'var(--uid-navy)' }}>
        {value}
      </p>
    </div>
  );
}
