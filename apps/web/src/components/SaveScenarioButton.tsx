import React, { useEffect, useState } from 'react';
import { AlertCircle, Bookmark, Check, Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CalculatorInputs, CurrencyCode } from '@rentwise/shared';
import { useAuth } from '../context/AuthContext';
import { useCreateScenario, useUpdateScenario } from '../hooks/useScenarios';

interface SaveScenarioButtonProps {
  inputs: CalculatorInputs;
  currencyCode: CurrencyCode;
  loadedScenarioId?: string;
  loadedScenarioName?: string;
}

export const SaveScenarioButton: React.FC<SaveScenarioButtonProps> = ({
  inputs,
  currencyCode,
  loadedScenarioId,
  loadedScenarioName,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const createScenario = useCreateScenario();
  const updateScenario = useUpdateScenario();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Reopening on a loaded scenario should offer to update it, not start blank.
  useEffect(() => {
    if (isOpen) setName(loadedScenarioName ?? '');
  }, [isOpen, loadedScenarioName]);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  const isPending = createScenario.isPending || updateScenario.isPending;

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => navigate('/login', { state: { from: '/' } })}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
        title="Sign in to save this scenario"
      >
        <LogIn className="w-3.5 h-3.5 text-brand-600" />
        <span>Sign in to save</span>
      </button>
    );
  }

  const handleSave = async (mode: 'create' | 'update') => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give this scenario a name.');
      return;
    }

    setError(null);

    try {
      if (mode === 'update' && loadedScenarioId) {
        await updateScenario.mutateAsync({
          id: loadedScenarioId,
          name: trimmed,
          currencyCode,
          ...inputs,
        });
      } else {
        await createScenario.mutateAsync({ name: trimmed, currencyCode, ...inputs });
      }

      setIsOpen(false);
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
      >
        {justSaved ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saved</span>
          </>
        ) : (
          <>
            <Bookmark className="w-3.5 h-3.5 text-brand-600" />
            <span>Save scenario</span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <label htmlFor="scenario-name" className="text-xs font-bold text-slate-700 block mb-1.5">
              Scenario name
            </label>
            <input
              id="scenario-name"
              type="text"
              value={name}
              autoFocus
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(loadedScenarioId ? 'update' : 'create');
                if (e.key === 'Escape') setIsOpen(false);
              }}
              placeholder="Koramangala 3BHK"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />

            {error && (
              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              {loadedScenarioId && (
                <button
                  type="button"
                  onClick={() => handleSave('update')}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-white bg-slate-900 hover:bg-brand-600 disabled:opacity-60 transition-colors"
                >
                  {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Update
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave('create')}
                disabled={isPending}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold disabled:opacity-60 transition-colors ${
                  loadedScenarioId
                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                    : 'text-white bg-slate-900 hover:bg-brand-600'
                }`}
              >
                {isPending && !loadedScenarioId && <Loader2 className="w-3 h-3 animate-spin" />}
                {loadedScenarioId ? 'Save as new' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
