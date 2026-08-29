import React from 'react';
import { AGE_GROUPS, CURRENCIES, OCCUPATIONS } from '@rentwise/shared';

export interface ProfileFormState {
  name: string;
  city: string;
  country: string;
  occupation: string;
  ageGroup: string;
  monthlyIncome: string;
  householdSize: string;
  defaultCurrency: string;
}

export const EMPTY_PROFILE: ProfileFormState = {
  name: '',
  city: '',
  country: '',
  occupation: '',
  ageGroup: '',
  monthlyIncome: '',
  householdSize: '',
  defaultCurrency: 'INR',
};

/**
 * Converts the form's string state into an API payload, dropping anything the
 * user left blank. A blank field must be omitted, not sent as '' or 0 — the
 * whole point is that skipping a field is a first-class choice.
 */
export function toProfilePayload(form: ProfileFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  const text = (key: keyof ProfileFormState) => {
    const v = form[key].trim();
    if (v) payload[key] = v;
  };

  text('name');
  text('city');
  text('country');
  text('occupation');
  text('ageGroup');
  text('defaultCurrency');

  const income = Number(form.monthlyIncome);
  if (form.monthlyIncome.trim() !== '' && Number.isFinite(income) && income >= 0) {
    payload.monthlyIncome = income;
  }

  const household = Number(form.householdSize);
  if (form.householdSize.trim() !== '' && Number.isInteger(household) && household >= 1) {
    payload.householdSize = household;
  }

  return payload;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition';

interface ProfileFieldsProps {
  value: ProfileFormState;
  onChange: (next: ProfileFormState) => void;
  /** Hide the name field when it was already collected in an earlier step. */
  includeName?: boolean;
  idPrefix?: string;
}

export const ProfileFields: React.FC<ProfileFieldsProps> = ({
  value,
  onChange,
  includeName = true,
  idPrefix = 'profile',
}) => {
  const set = (key: keyof ProfileFormState) => (v: string) => onChange({ ...value, [key]: v });
  const id = (key: string) => `${idPrefix}-${key}`;

  return (
    <div className="space-y-4">
      {includeName && (
        <div className="space-y-1.5">
          <label htmlFor={id('name')} className="text-xs font-bold text-slate-700">
            Name
          </label>
          <input
            id={id('name')}
            type="text"
            autoComplete="name"
            value={value.name}
            onChange={(e) => set('name')(e.target.value)}
            className={inputClass}
            placeholder="Jyothi"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={id('city')} className="text-xs font-bold text-slate-700">
            City
          </label>
          <input
            id={id('city')}
            type="text"
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => set('city')(e.target.value)}
            className={inputClass}
            placeholder="Bengaluru"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={id('country')} className="text-xs font-bold text-slate-700">
            Country
          </label>
          <input
            id={id('country')}
            type="text"
            autoComplete="country-name"
            value={value.country}
            onChange={(e) => set('country')(e.target.value)}
            className={inputClass}
            placeholder="India"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={id('occupation')} className="text-xs font-bold text-slate-700">
            Occupation
          </label>
          <select
            id={id('occupation')}
            value={value.occupation}
            onChange={(e) => set('occupation')(e.target.value)}
            className={inputClass}
          >
            <option value="">Prefer not to say</option>
            {OCCUPATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={id('ageGroup')} className="text-xs font-bold text-slate-700">
            Age group
          </label>
          <select
            id={id('ageGroup')}
            value={value.ageGroup}
            onChange={(e) => set('ageGroup')(e.target.value)}
            className={inputClass}
          >
            <option value="">Prefer not to say</option>
            {AGE_GROUPS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={id('monthlyIncome')} className="text-xs font-bold text-slate-700">
            Monthly income
          </label>
          <input
            id={id('monthlyIncome')}
            type="number"
            min={0}
            inputMode="numeric"
            value={value.monthlyIncome}
            onChange={(e) => set('monthlyIncome')(e.target.value)}
            className={inputClass}
            placeholder="50000"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={id('householdSize')} className="text-xs font-bold text-slate-700">
            Household size
          </label>
          <input
            id={id('householdSize')}
            type="number"
            min={1}
            max={21}
            inputMode="numeric"
            value={value.householdSize}
            onChange={(e) => set('householdSize')(e.target.value)}
            className={inputClass}
            placeholder="3"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id('defaultCurrency')} className="text-xs font-bold text-slate-700">
          Preferred currency
        </label>
        <select
          id={id('defaultCurrency')}
          value={value.defaultCurrency}
          onChange={(e) => set('defaultCurrency')(e.target.value)}
          className={inputClass}
        >
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
