import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  FAMILY_PROGRAMS,
  calculateAgeFromBirthDate,
  classifyMemberType,
  getProgramEligibility,
  isBirthDateInFuture,
  memberTypeLabelTr,
  todayDateInputMax,
  type FamilyProgram,
} from '../../lib/familyPrograms';

export interface FamilyMemberFormState {
  full_name: string;
  birth_date: string;
  gender?: 'male' | 'female';
  age?: number;
  member_type?: 'adult' | 'child';
  program_ids: string[];
}

export function emptyFamilyMember(): FamilyMemberFormState {
  return {
    full_name: '',
    birth_date: '',
    gender: undefined,
    program_ids: [],
  };
}

export function recomputeFamilyMember(state: FamilyMemberFormState): FamilyMemberFormState {
  if (!state.birth_date || isBirthDateInFuture(state.birth_date)) {
    return {
      ...state,
      age: undefined,
      member_type: undefined,
      program_ids: [],
    };
  }

  const age = calculateAgeFromBirthDate(state.birth_date);
  if (age === null) {
    return { ...state, age: undefined, member_type: undefined, program_ids: [] };
  }

  const member_type = classifyMemberType(age);
  const program_ids = state.program_ids.filter((id) => {
    const program = FAMILY_PROGRAMS.find((p) => p.id === id);
    if (!program) return false;
    return getProgramEligibility(age, program).eligible;
  });

  return { ...state, age, member_type, program_ids };
}

interface FieldProps {
  label: string;
  compact?: boolean;
  children: ReactNode;
}

function Field({ label, compact, children }: FieldProps) {
  if (compact && !label) return <div>{children}</div>;
  return (
    <label style={{ display: 'block' }}>
      {label ? (
        <span
          style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-mid)',
            marginBottom: '0.35rem',
          }}
        >
          {label}
        </span>
      ) : null}
      {children}
    </label>
  );
}

interface FamilyMemberCardProps {
  index: number;
  member: FamilyMemberFormState;
  showHeaderLabels: boolean;
  onChange: (next: FamilyMemberFormState) => void;
  onRemove: () => void;
}

export function FamilyMemberCard({
  index,
  member,
  showHeaderLabels,
  onChange,
  onRemove,
}: FamilyMemberCardProps) {
  const age = member.age;
  const maxDate = todayDateInputMax();
  const birthInvalid = member.birth_date !== '' && isBirthDateInFuture(member.birth_date);

  const patch = (partial: Partial<FamilyMemberFormState>) => {
    onChange(recomputeFamilyMember({ ...member, ...partial }));
  };

  const toggleProgram = (program: FamilyProgram, eligible: boolean) => {
    if (!eligible || age === undefined) return;
    const has = member.program_ids.includes(program.id);
    const program_ids = has
      ? member.program_ids.filter((id) => id !== program.id)
      : [...member.program_ids, program.id];
    onChange({ ...member, program_ids });
  };

  return (
    <div
      className="family-member-card"
      style={{
        padding: '1rem',
        borderRadius: '12px',
        background: 'rgba(13,77,124,0.03)',
        border: '1px solid rgba(13,77,124,0.08)',
      }}
    >
      <div className="family-member-card-grid">
        <Field label={showHeaderLabels ? 'Ad Soyad' : ''}>
          <input
            value={member.full_name}
            onChange={(e) => patch({ full_name: e.target.value })}
            className="reg-input"
            placeholder="Ad Soyad"
            autoComplete="name"
          />
        </Field>

        <Field label={showHeaderLabels ? 'Doğum Tarihi' : ''}>
          <input
            type="date"
            value={member.birth_date}
            max={maxDate}
            required
            onChange={(e) => patch({ birth_date: e.target.value })}
            className="reg-input"
            aria-invalid={birthInvalid}
          />
          {birthInvalid && (
            <span
              style={{
                display: 'block',
                marginTop: '0.25rem',
                fontSize: '12px',
                color: '#dc2626',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Gelecek bir tarih seçilemez.
            </span>
          )}
        </Field>

        <Field label={showHeaderLabels ? 'Cinsiyet' : ''}>
          <select
            value={member.gender ?? ''}
            onChange={(e) =>
              patch({
                gender: e.target.value === '' ? undefined : (e.target.value as 'male' | 'female'),
              })
            }
            className="reg-input"
          >
            <option value="">Seçin…</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
          </select>
        </Field>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Aile üyesi ${index + 1} kaldır`}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(220,38,38,0.08)',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {age !== undefined && member.member_type && (
        <div
          style={{
            marginTop: '0.875rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '10px',
            background: 'rgba(62,200,200,0.1)',
            border: '1px solid rgba(62,200,200,0.25)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'var(--uid-navy)',
          }}
          aria-live="polite"
        >
          <strong>Yaş:</strong> {age} · <strong>Sınıflandırma:</strong>{' '}
          {memberTypeLabelTr(member.member_type)}
          <span style={{ color: 'var(--text-soft)', fontWeight: 400 }}> (otomatik)</span>
        </div>
      )}

      {age !== undefined && (
        <div style={{ marginTop: '1rem' }}>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-mid)',
            }}
          >
            Program tercihleri
          </p>
          <p
            style={{
              margin: '0 0 0.75rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12.5px',
              color: 'var(--text-soft)',
              lineHeight: 1.5,
            }}
          >
            Yaşa uygun programları seçebilirsiniz. Uygun olmayan programlar açıklama ile gösterilir.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FAMILY_PROGRAMS.map((program) => {
              const { eligible, reasonTr } = getProgramEligibility(age, program);
              const checked = member.program_ids.includes(program.id);
              return (
                <label
                  key={program.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '10px',
                    border: `1px solid ${eligible ? 'rgba(13,77,124,0.12)' : 'rgba(148,163,184,0.35)'}`,
                    background: eligible ? '#fff' : 'rgba(148,163,184,0.08)',
                    cursor: eligible ? 'pointer' : 'not-allowed',
                    opacity: eligible ? 1 : 0.85,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!eligible}
                    onChange={() => toggleProgram(program, eligible)}
                    style={{ marginTop: '3px', accentColor: 'var(--uid-teal)' }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: eligible ? 'var(--uid-navy)' : 'var(--text-soft)',
                      }}
                    >
                      {program.nameTr}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        color: 'var(--text-soft)',
                        marginTop: '2px',
                      }}
                    >
                      {eligible
                        ? program.maxAge === null
                          ? `${program.minAge}+ yaş`
                          : `${program.minAge}–${program.maxAge} yaş`
                        : reasonTr}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
