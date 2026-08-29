/**
 * Optional profile vocabulary, shared by the registration form, the API DTOs
 * and the statistics engine so all three agree on the exact allowed values.
 *
 * Every profile field is optional. Nothing here is ever required to register,
 * to use the calculator, or to save a scenario — supplying a field only makes
 * the statistics richer.
 */

export const OCCUPATIONS = [
  { value: 'student', label: 'Student' },
  { value: 'salaried', label: 'Salaried employee' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'freelancer', label: 'Freelancer / contractor' },
  { value: 'other', label: 'Other' },
] as const;

export const AGE_GROUPS = [
  { value: 'under_20', label: 'Under 20' },
  { value: '20_24', label: '20 – 24' },
  { value: '25_29', label: '25 – 29' },
  { value: '30_34', label: '30 – 34' },
  { value: '35_44', label: '35 – 44' },
  { value: '45_plus', label: '45+' },
] as const;

export type OccupationValue = (typeof OCCUPATIONS)[number]['value'];
export type AgeGroupValue = (typeof AGE_GROUPS)[number]['value'];

export const OCCUPATION_VALUES: readonly string[] = OCCUPATIONS.map((o) => o.value);
export const AGE_GROUP_VALUES: readonly string[] = AGE_GROUPS.map((a) => a.value);

export function occupationLabel(value: string | null | undefined): string | null {
  return OCCUPATIONS.find((o) => o.value === value)?.label ?? null;
}

export function ageGroupLabel(value: string | null | undefined): string | null {
  return AGE_GROUPS.find((a) => a.value === value)?.label ?? null;
}

export interface UserProfile {
  name: string | null;
  city: string | null;
  country: string | null;
  occupation: string | null;
  ageGroup: string | null;
  monthlyIncome: number | null;
  householdSize: number | null;
}

/** The optional fields that profile completeness is measured against. */
export const PROFILE_FIELDS = [
  { key: 'name', label: 'Name', unlocks: 'A personal greeting' },
  { key: 'city', label: 'City', unlocks: 'Anonymous comparison with other renters in your city' },
  { key: 'country', label: 'Country', unlocks: 'Regional context for your results' },
  { key: 'occupation', label: 'Occupation', unlocks: 'Comparison against renters in similar work' },
  { key: 'ageGroup', label: 'Age group', unlocks: 'Comparison against renters your age' },
  {
    key: 'monthlyIncome',
    label: 'Monthly income',
    unlocks: 'Income-based affordability scoring across every saved scenario',
  },
  {
    key: 'householdSize',
    label: 'Household size',
    unlocks: 'Flags scenarios whose occupancy differs from your usual household',
  },
] as const satisfies ReadonlyArray<{ key: keyof UserProfile; label: string; unlocks: string }>;

export interface ProfileCompleteness {
  filledCount: number;
  totalCount: number;
  percent: number;
  missing: Array<{ key: string; label: string; unlocks: string }>;
}

export function profileCompleteness(profile: Partial<UserProfile>): ProfileCompleteness {
  const missing = PROFILE_FIELDS.filter((f) => {
    const value = profile[f.key];
    return value === null || value === undefined || value === '';
  }).map((f) => ({ key: f.key, label: f.label, unlocks: f.unlocks }));

  const filledCount = PROFILE_FIELDS.length - missing.length;

  return {
    filledCount,
    totalCount: PROFILE_FIELDS.length,
    percent: Math.round((filledCount / PROFILE_FIELDS.length) * 100),
    missing,
  };
}
