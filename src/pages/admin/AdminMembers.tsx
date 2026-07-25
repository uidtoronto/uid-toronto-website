import { useEffect, useState } from 'react';
import { Loader2, Pencil, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { TextField, SelectField, StatusBadge } from '../../components/admin/AdminField';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { getAllMembers, getMemberById, updateMember } from '../../services/members';
import { fullName } from '../../lib/memberUtils';
import type { Member, MemberStatus, MemberUpdateInput, RegistrationMembershipType } from '../../types';

export default function AdminMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberUpdateInput>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await getAllMembers();
    setMembers(res.data);
    if (res.error) toast(res.error, 'error');
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    return (
      m.email.toLowerCase().includes(q) ||
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q)
    );
  });

  const startEdit = async (id: string) => {
    const res = await getMemberById(id);
    if (res.error || !res.data) {
      toast(res.error ?? 'Member not found.', 'error');
      return;
    }
    const m = res.data;
    setEditingId(id);
    setForm({
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email,
      phone: m.phone ?? '',
      mobile_phone: m.mobile_phone ?? '',
      city: m.city ?? '',
      status: m.status,
      membership_type: m.membership_type ?? 'adult',
      address_line1: m.address_line1 ?? '',
      address_line2: m.address_line2 ?? '',
      province: m.province ?? '',
      postal_code: m.postal_code ?? '',
      country: m.country ?? '',
      profile_photo_url: m.profile_photo_url ?? null,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    const res = await updateMember(editingId, form);
    setSaving(false);
    if (res.error) {
      toast(res.error, 'error');
      return;
    }
    toast('Member updated.', 'success');
    setEditingId(null);
    void load();
  };

  return (
    <div className="admin-fade-up">
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal-dark)', fontWeight: 600 }}>Roster</p>
        <h1 style={{ margin: '0.25rem 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)' }}><em>Members</em></h1>
      </div>

      {editingId && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>Edit member</h2>
          <ImageUpload
            bucket="member-photos"
            folderId={editingId}
            value={form.profile_photo_url ?? null}
            onChange={url => setForm(f => ({ ...f, profile_photo_url: url }))}
            label="Profile photo"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1rem' }}>
            <TextField label="First name" value={form.first_name ?? ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <TextField label="Last name" value={form.last_name ?? ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            <TextField label="Email" type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <TextField label="Phone" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <TextField label="Mobile" value={form.mobile_phone ?? ''} onChange={e => setForm(f => ({ ...f, mobile_phone: e.target.value }))} />
            <TextField label="City" value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <SelectField label="Status" value={form.status ?? 'pending'} onChange={e => setForm(f => ({ ...f, status: e.target.value as MemberStatus }))}>
              {(['active', 'inactive', 'pending', 'suspended'] as MemberStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectField>
            <SelectField label="Membership type" value={form.membership_type ?? 'adult'} onChange={e => setForm(f => ({ ...f, membership_type: e.target.value as RegistrationMembershipType }))}>
              {(['adult', 'student', 'pensioner'] as RegistrationMembershipType[]).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectField>
            <TextField label="Address line 1" value={form.address_line1 ?? ''} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} />
            <TextField label="Address line 2" value={form.address_line2 ?? ''} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} />
            <TextField label="Province" value={form.province ?? ''} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
            <TextField label="Postal code" value={form.postal_code ?? ''} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} />
            <TextField label="Country" value={form.country ?? ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => void handleSave()} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={() => setEditingId(null)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={panelStyle}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-soft)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.25rem', borderRadius: '10px',
              border: '1.5px solid rgba(13,77,124,0.15)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
            }}
          />
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--uid-teal)' }} /></div>
        ) : filtered.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-soft)' }}>No members found.</p>
        ) : (
          filtered.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 0', borderBottom: '1px solid rgba(13,77,124,0.06)' }}>
              {m.profile_photo_url ? (
                <img src={m.profile_photo_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(62,200,200,0.12)', color: 'var(--uid-teal-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {m.first_name?.charAt(0) ?? '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)' }}>{fullName(m.first_name, m.last_name)}</p>
                <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>{m.email}</p>
              </div>
              <StatusBadge status={m.status} />
              <button type="button" onClick={() => void startEdit(m.id)} title="Edit" style={{
                width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(13,77,124,0.12)',
                background: '#fff', color: 'var(--uid-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Pencil size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '1.5rem',
  border: '1px solid rgba(13,77,124,0.07)', boxShadow: '0 4px 20px rgba(13,77,124,0.05)', marginBottom: '1.25rem',
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, color: 'var(--uid-navy)',
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '99px',
  border: 'none', background: 'linear-gradient(135deg, #0D4D7C, #1A6A9A)', color: '#fff',
  fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 18px', borderRadius: '99px', border: '1.5px solid rgba(13,77,124,0.2)',
  background: '#fff', color: 'var(--uid-navy)', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', cursor: 'pointer',
};
