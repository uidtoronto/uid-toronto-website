/** UID Toronto family / youth programs with age eligibility (membership registration). */
export interface FamilyProgram {
  id: string;
  nameTr: string;
  minAge: number;
  /** null = no upper limit */
  maxAge: number | null;
}

export const FAMILY_PROGRAMS: FamilyProgram[] = [
  {
    id: 'children-culture',
    nameTr: 'Çocuk Kültür Atölyesi',
    minAge: 5,
    maxAge: 12,
  },
  {
    id: 'youth-leadership',
    nameTr: 'Gençlik ve Liderlik Programı',
    minAge: 13,
    maxAge: 17,
  },
  {
    id: 'family-events',
    nameTr: 'Aile Etkinlikleri',
    minAge: 0,
    maxAge: null,
  },
  {
    id: 'adult-community',
    nameTr: 'Yetişkin Topluluk ve Etkinlikleri',
    minAge: 18,
    maxAge: null,
  },
];

export function todayDateInputMax(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Age in full years on today's date (local calendar). */
export function calculateAgeFromBirthDate(birthDateIso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateIso)) return null;
  const [y, m, d] = birthDateIso.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birth.setHours(0, 0, 0, 0);
  if (birth > today) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}

export function classifyMemberType(age: number): 'adult' | 'child' {
  return age >= 18 ? 'adult' : 'child';
}

export function memberTypeLabelTr(type: 'adult' | 'child'): string {
  return type === 'adult' ? 'Yetişkin' : 'Çocuk';
}

export function getProgramEligibility(
  age: number,
  program: FamilyProgram,
): { eligible: boolean; reasonTr?: string } {
  if (age < program.minAge) {
    return {
      eligible: false,
      reasonTr: `Bu program için minimum yaş ${program.minAge}.`,
    };
  }
  if (program.maxAge !== null && age > program.maxAge) {
    return {
      eligible: false,
      reasonTr: `Bu program için maximum yaş ${program.maxAge}.`,
    };
  }
  return { eligible: true };
}

export function isBirthDateInFuture(birthDateIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateIso)) return true;
  return birthDateIso > todayDateInputMax();
}
