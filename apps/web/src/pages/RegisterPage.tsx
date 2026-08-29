import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, Check, Loader2, UserPlus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import {
  EMPTY_PROFILE,
  ProfileFields,
  toProfilePayload,
  type ProfileFormState,
} from '../components/auth/ProfileFields';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/apiClient';

// Mirrors the server-side rules in RegisterDto so the user sees the failure
// before a round-trip, not after.
const RULES = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ruleState = useMemo(() => RULES.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const allRulesPass = ruleState.every((r) => r.ok);
  const canContinue = allRulesPass && email.trim().length > 0;

  const submit = async (withProfile: boolean) => {
    setError(null);
    setSubmitting(true);

    try {
      await register(email, password, withProfile ? toProfilePayload(profile) : {});
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 429
            ? 'Too many attempts. Please wait a minute and try again.'
            : err.message
          : 'Something went wrong. Please try again.',
      );
      // Send the user back to step 1 for errors that belong to the credentials.
      if (err instanceof ApiError && (err.status === 409 || err.status === 400)) {
        setStep(1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorBanner = error && (
    <div
      role="alert"
      className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{error}</span>
    </div>
  );

  return (
    <AuthLayout
      title={step === 1 ? 'Create your account' : 'Tell us a bit more'}
      subtitle={
        step === 1
          ? 'Only an email and password are required.'
          : 'Every field here is optional. Skip it and the app works exactly the same.'
      }
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5" aria-hidden="true">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
      </div>

      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canContinue) setStep(2);
          }}
          className="space-y-4"
          noValidate
        >
          {errorBanner}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-700">
              Email address <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-slate-700">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••••"
            />

            {password.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5">
                {ruleState.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center gap-1.5 text-[11px] font-medium ${
                      r.ok ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {r.ok ? (
                      <Check className="w-3 h-3 shrink-0" />
                    ) : (
                      <X className="w-3 h-3 shrink-0" />
                    )}
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={!canContinue}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.99]"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Straight-through path for anyone who wants nothing but an account. */}
          <button
            type="button"
            disabled={!canContinue || submitting}
            onClick={() => submit(false)}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating account…</span>
              </>
            ) : (
              <span>Skip the optional details and finish</span>
            )}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(true);
          }}
          className="space-y-5"
          noValidate
        >
          {errorBanner}

          <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 text-[11px] leading-relaxed">
            <BarChart3 className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" />
            <span>
              These power your statistics — income re-scores every saved scenario against what
              you really earn, and city unlocks an anonymous comparison with other renters.{' '}
              <strong>Leave anything blank and it is simply left out of the analysis.</strong>{' '}
              You can add or change all of it later.
            </span>
          </div>

          <ProfileFields value={profile} onChange={setProfile} idPrefix="register" />

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create account</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => submit(false)}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Skip for now — create account without these
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(1)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to account details
            </button>
          </div>
        </form>
      )}

      <p className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        The calculator works without an account —{' '}
        <Link to="/" className="font-semibold text-slate-600 hover:text-brand-600">
          keep using it as a guest
        </Link>
        .
      </p>
    </AuthLayout>
  );
};
