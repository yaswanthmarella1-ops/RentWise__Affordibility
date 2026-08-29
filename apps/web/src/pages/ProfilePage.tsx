import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Info, Loader2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  EMPTY_PROFILE,
  ProfileFields,
  toProfilePayload,
  type ProfileFormState,
} from '../components/auth/ProfileFields';
import { useAuth } from '../context/AuthContext';
import { useCalculator } from '../context/CalculatorContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { currencyCode, setCurrency } = useCalculator();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the form from whatever the user has already supplied.
  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
      occupation: user.occupation ?? '',
      ageGroup: user.ageGroup ?? '',
      monthlyIncome: user.monthlyIncome === null ? '' : String(user.monthlyIncome),
      householdSize: user.householdSize === null ? '' : String(user.householdSize),
      defaultCurrency: user.defaultCurrency,
    });
  }, [user]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const filled = toProfilePayload(form);

      // Fields the user cleared must be sent as null so the server actually
      // removes them, rather than silently keeping the old value.
      const patch: Record<string, unknown> = { ...filled };
      for (const key of [
        'name',
        'city',
        'country',
        'occupation',
        'ageGroup',
        'monthlyIncome',
        'householdSize',
      ] as const) {
        if (!(key in filled)) patch[key] = null;
      }

      await updateProfile(patch);
      // The stats depend on the profile, so make them refetch.
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const completion = user?.profileCompletion;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar currentCurrency={currencyCode} onCurrencyChange={setCurrency} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Everything on this page is optional. Fill in what you want; leave the rest blank.
          </p>
        </div>

        {completion && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                {completion.filledCount} of {completion.totalCount} optional fields filled
              </span>
              <span className="text-xs font-black text-brand-700">{completion.percent}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all"
                style={{ width: `${completion.percent}%` }}
              />
            </div>

            {completion.missing.length > 0 && (
              <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {completion.missing.map((m) => (
                  <li key={m.key} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-700">{m.label}</strong> — {m.unlocks}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-7"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <ProfileFields value={form} onChange={setForm} idPrefix="profile" />

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-brand-600 disabled:opacity-60 transition-all shadow-sm active:scale-[0.99]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save profile</span>
                </>
              )}
            </button>

            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Back to scenarios
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Clearing a field and saving removes it. Nothing here is ever required, and the
            calculator behaves identically either way.
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
};
