import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, Heart, Plus, X } from 'lucide-react';
import { UIDLogo } from '../components/UIDLogo';
import { useToast } from '../context/ToastContext';
import { saveRegistration } from '../services/registration';
import { PLANS, type PlanId } from '../services/stripe';
import { storePendingRegistrationCheckout } from '../lib/registrationCheckout';
import type { FamilyMember } from '../types';

const familyMemberSchema = z.object({
  full_name: z.string().min(1, 'Ad soyad gereklidir'),
  age: z.coerce.number().int().min(0).max(120).optional(),
  gender: z.enum(['male', 'female']).optional(),
  member_type: z.enum(['adult', 'child']).optional(),
});

const membershipSchema = z.object({
  full_name: z.string().min(2, 'Ad soyad gereklidir'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  birth_date: z.string().min(1, 'Doğum tarihi gereklidir'),
  mobile_phone: z.string().min(7, 'Geçerli bir telefon numarası girin'),
});

type MembershipForm = z.infer<typeof membershipSchema>;
type FamilyMemberForm = z.infer<typeof familyMemberSchema>;

const PLAN_LABELS: Record<PlanId, string> = {
  monthly: 'Aylık Üyelik',
  annual: 'Yıllık Üyelik',
};

function parsePlan(value: string | null): PlanId | null {
  if (value === 'monthly' || value === 'annual') return value;
  return null;
}

const PLAN_PERIOD: Record<PlanId, string> = {
  monthly: 'Ay',
  annual: 'Yıl',
};

export default function Membership() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const plan = parsePlan(searchParams.get('plan'));
  const activePlan = plan ? PLANS[plan] : null;
  const [submitting, setSubmitting] = useState(false);
  const [isFamily, setIsFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([]);

  useEffect(() => {
    if (!plan) {
      navigate({ pathname: '/', hash: 'uye' }, { replace: true });
    }
  }, [plan, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipForm>({
    resolver: zodResolver(membershipSchema),
    defaultValues: { full_name: '', email: '', birth_date: '', mobile_phone: '' },
  });

  const updateFamilyMember = (index: number, field: keyof FamilyMemberForm, value: string | number) => {
    setFamilyMembers(prev =>
      prev.map((fm, i) => (i === index ? { ...fm, [field]: value } : fm)),
    );
  };

  const addFamilyMember = () => {
    if (familyMembers.length >= 10) return;
    setFamilyMembers(prev => [...prev, { full_name: '', age: undefined, gender: undefined, member_type: undefined }]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: MembershipForm) => {
    if (!plan) return;

    if (isFamily) {
      const validMembers = familyMembers.filter(fm => fm.full_name.trim() !== '');
      if (validMembers.length === 0) {
        toast('Lütfen en az bir aile üyesi ekleyin veya Hayır seçeneğini işaretleyin.', 'error');
        return;
      }
      const parsed = z.array(familyMemberSchema).safeParse(validMembers);
      if (!parsed.success) {
        toast('Lütfen tüm aile üyeleri için gerekli alanları doldurun.', 'error');
        return;
      }
      const incomplete = familyMembers.some(fm => fm.full_name.trim() !== '' && !fm.member_type);
      if (incomplete) {
        toast('Lütfen her aile üyesi için ilişki türünü (Yetişkin/Çocuk) seçin.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const regRes = await saveRegistration({
        full_name: values.full_name,
        email: values.email,
        birth_date: values.birth_date,
        mobile_phone: values.mobile_phone,
        plan,
        is_family: isFamily,
        family_members: isFamily ? familyMembers.filter(fm => fm.full_name.trim() !== '') as FamilyMember[] : [],
      });

      if (regRes.error) {
        toast(regRes.error, 'error');
        return;
      }

      const id = regRes.data!.memberId;
      storePendingRegistrationCheckout(id, plan);
      navigate(`/membership/payment?plan=${plan}&member=${id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!plan || !activePlan) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(165deg, #F0F9FF 0%, #EAF5F5 35%, #F7FAFC 65%, #FFFFFF 100%)', position: 'relative', overflow: 'hidden', paddingTop: '90px', paddingBottom: '4rem' }}>
      <div className="ottoman-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,200,200,0.12), transparent 70%)', animation: 'floatOrb 9s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, color: 'var(--uid-navy)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Ana Sayfa
          </Link>
          <UIDLogo width={120} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(160deg, #0D4D7C 0%, #061E30 100%)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600, margin: '0 0 0.35rem', fontFamily: "'DM Sans', sans-serif" }}>
                Seçilen Plan
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 500, color: '#fff', margin: '0 0 0.25rem' }}>
                {PLAN_LABELS[plan]}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.72)', margin: 0 }}>
                {activePlan.price} {activePlan.currency} / {PLAN_PERIOD[plan]}
              </p>
            </div>
            <Link
              to={{ pathname: '/', hash: 'uye' }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--uid-teal)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                paddingTop: '2px',
              }}
            >
              Planı Değiştir
            </Link>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSubmit(onSubmit)}
          style={{
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(62,200,200,0.18)',
            boxShadow: '0 32px 80px rgba(13,77,124,0.12)',
            padding: 'clamp(1.25rem, 4vw, 2.25rem)',
          }}
        >
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 500, color: 'var(--uid-navy)', margin: '0 0 1.5rem' }}>
            Üyelik Bilgileri
          </h2>

              <div className="membership-form-grid">
                <Field label="Ad Soyad" name="full_name" error={errors.full_name?.message} required>
                  <input {...register('full_name')} className="reg-input" placeholder="Ad Soyad" />
                </Field>
                <Field label="E-posta" name="email" error={errors.email?.message} required>
                  <input type="email" {...register('email')} className="reg-input" placeholder="ornek@email.com" autoComplete="email" />
                </Field>
                <Field label="Doğum Tarihi" name="birth_date" error={errors.birth_date?.message} required>
                  <input type="date" {...register('birth_date')} className="reg-input" />
                </Field>
                <Field label="Telefon Numarası" name="mobile_phone" error={errors.mobile_phone?.message} required>
                  <input {...register('mobile_phone')} className="reg-input" placeholder="+1 (416) 555-0100" autoComplete="tel" />
                </Field>
              </div>

              {/* Family section */}
              <div style={{ marginTop: '2rem', paddingTop: '1.75rem', borderTop: '1px solid rgba(13,77,124,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <Heart size={18} style={{ color: 'var(--uid-teal)' }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)', margin: 0 }}>
                    Aile Bilgileri
                  </p>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-mid)', fontWeight: 300, marginBottom: '1rem', lineHeight: 1.6 }}>
                  Ailenizden başka üyeler eklemek istiyor musunuz?
                </p>
                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <RadioOption
                    label="Hayır"
                    checked={!isFamily}
                    onChange={() => { setIsFamily(false); setFamilyMembers([]); }}
                  />
                  <RadioOption
                    label="Evet"
                    checked={isFamily}
                    onChange={() => { setIsFamily(true); if (familyMembers.length === 0) addFamilyMember(); }}
                  />
                </div>

                {isFamily && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {familyMembers.map((fm, i) => (
                      <div key={i} className="family-row" style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 2fr) 0.7fr 1fr 1fr 32px',
                        gap: '0.625rem',
                        alignItems: 'flex-end',
                        padding: '0.875rem',
                        borderRadius: '12px',
                        background: 'rgba(13,77,124,0.03)',
                        border: '1px solid rgba(13,77,124,0.06)',
                      }}>
                        <Field label={i === 0 ? 'Ad Soyad' : ''} compact>
                          <input
                            value={fm.full_name}
                            onChange={e => updateFamilyMember(i, 'full_name', e.target.value)}
                            className="reg-input"
                            placeholder="Ad Soyad"
                          />
                        </Field>
                        <Field label={i === 0 ? 'Yaş' : ''} compact>
                          <input
                            type="number"
                            value={fm.age ?? ''}
                            onChange={e => updateFamilyMember(i, 'age', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                            className="reg-input"
                            placeholder="Yaş"
                          />
                        </Field>
                        <Field label={i === 0 ? 'Cinsiyet' : ''} compact>
                          <select
                            value={fm.gender ?? ''}
                            onChange={e => updateFamilyMember(i, 'gender', e.target.value)}
                            className="reg-input"
                          >
                            <option value="">Seçin…</option>
                            <option value="male">Erkek</option>
                            <option value="female">Kadın</option>
                          </select>
                        </Field>
                        <Field label={i === 0 ? 'İlişki' : ''} compact>
                          <select
                            value={fm.member_type ?? ''}
                            onChange={e => updateFamilyMember(i, 'member_type', e.target.value)}
                            className="reg-input"
                          >
                            <option value="">Seçin…</option>
                            <option value="adult">Yetişkin</option>
                            <option value="child">Çocuk</option>
                          </select>
                        </Field>
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(i)}
                          aria-label="Aile üyesini kaldır"
                            style={{
                              width: '32px', height: '38px', borderRadius: '8px', border: 'none',
                              background: 'rgba(220,38,38,0.08)', color: '#dc2626', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <X size={15} />
                          </button>
                      </div>
                    ))}
                    {familyMembers.length < 10 && (
                      <button
                        type="button"
                        onClick={addFamilyMember}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '0.625rem 1rem', borderRadius: '99px',
                          border: '1.5px dashed rgba(62,200,200,0.4)', background: 'rgba(62,200,200,0.06)',
                          color: 'var(--uid-teal-dark)', cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
                        }}
                      >
                        <Plus size={14} /> Aile Üyesi Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.75rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="shimmer-btn"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '16px 24px', borderRadius: '99px', border: 'none', cursor: submitting ? 'wait' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600,
                    background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))',
                    color: '#fff', boxShadow: '0 14px 36px rgba(62,200,200,0.3)',
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Kaydediliyor…</> : 'Devam Et'}
                </button>
                <p style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: 'var(--text-soft)', fontWeight: 300, marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--uid-teal)' }} /> Bilgileriniz güvenle saklanır.
                </p>
              </div>
        </motion.form>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem 2rem', marginTop: '2rem' }}>
          {[
            { icon: ShieldCheck, label: 'Stripe ile güvenli ödeme' },
            { icon: CreditCard, label: 'İstediğiniz zaman iptal' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} style={{ fontSize: '12px', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Sans', sans-serif" }}>
              <Icon size={12} style={{ color: 'var(--uid-teal)' }} /> {label}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .membership-form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .reg-input {
          width: 100%; padding: 0.625rem 0.875rem; border-radius: 10px;
          border: 1.5px solid rgba(13,77,124,0.15); background: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--uid-dark);
          outline: none; transition: border-color 0.2s; box-sizing: border-box;
        }
        .reg-input:focus { border-color: var(--uid-teal); box-shadow: 0 0 0 3px rgba(62,200,200,0.15); }
        .reg-input:disabled { background: rgba(13,77,124,0.04); color: var(--text-mid); }
        .family-row { grid-template-columns: minmax(0,2fr) 0.7fr 1fr 1fr 32px !important; }
        @media (max-width: 640px) {
          .family-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, name, error, required, compact, children }: {
  label: string; name?: string; error?: string; required?: boolean; compact?: boolean; children: ReactNode;
}) {
  return (
    <div style={compact ? {} : {}}>
      {label && (
        <label htmlFor={name} style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: compact ? '12px' : '12.5px', fontWeight: 600, color: 'var(--uid-navy)', marginBottom: '0.375rem' }}>
          {label} {required && <span style={{ color: 'var(--uid-teal)' }}>*</span>}
        </label>
      )}
      {children}
      {error && <p role="alert" style={{ margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#dc2626' }}>{error}</p>}
    </div>
  );
}

function RadioOption({ label, checked, disabled, onChange }: {
  label: string; checked: boolean; disabled?: boolean; onChange: () => void;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'default' : 'pointer',
      fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500,
      color: checked ? 'var(--uid-navy)' : 'var(--text-mid)', opacity: disabled ? 0.6 : 1,
    }}>
      <input type="radio" checked={checked} disabled={disabled} onChange={onChange} style={{ accentColor: 'var(--uid-teal)' }} />
      {label}
    </label>
  );
}
