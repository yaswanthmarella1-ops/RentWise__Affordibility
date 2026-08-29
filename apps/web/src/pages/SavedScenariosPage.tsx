import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Calculator,
  Loader2,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CURRENCIES, formatCurrency, formatPercent } from '@rentwise/shared';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCalculator } from '../context/CalculatorContext';
import { useDeleteScenario, useScenarios } from '../hooks/useScenarios';
import { useStats } from '../hooks/useStats';
import { StatsPanel } from '../components/stats/StatsPanel';
import type { SavedScenario } from '../lib/types';

const STATUS_STYLES = {
  affordable: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  danger: 'bg-rose-100 text-rose-800 border-rose-300',
} as const;

export const SavedScenariosPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { loadScenario, setCurrency, currencyCode } = useCalculator();
  const navigate = useNavigate();

  const { data: scenarios, isLoading, isError, error } = useScenarios(isAuthenticated);
  const { data: stats } = useStats(isAuthenticated);
  const deleteScenario = useDeleteScenario();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleLoad = (scenario: SavedScenario) => {
    loadScenario(scenario);
    navigate('/');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScenario.mutateAsync(id);
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar currentCurrency={currencyCode} onCurrencyChange={setCurrency} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Saved scenarios
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {user?.name ? `${user.name}, y` : 'Y'}our saved rent setups. Load one to keep
              working on it.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <UserCog className="w-4 h-4 text-brand-600" />
              <span>Profile</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-brand-600 transition-all shadow-sm active:scale-95"
            >
              <Calculator className="w-4 h-4 text-brand-400" />
              <span>New calculation</span>
            </Link>
          </div>
        </div>

        {stats && <StatsPanel stats={stats} />}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your scenarios…
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error instanceof Error ? error.message : 'Could not load scenarios.'}</span>
          </div>
        )}

        {!isLoading && !isError && scenarios?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Nothing saved yet</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Run a calculation, then hit <strong>Save scenario</strong> on the results panel to
              keep it here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-brand-600 transition-all shadow-sm"
            >
              <Calculator className="w-4 h-4 text-brand-400" />
              <span>Open the calculator</span>
            </Link>
          </div>
        )}

        {!isLoading && !!scenarios?.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scenarios.map((s) => {
              const currency = CURRENCIES[s.currencyCode] ?? CURRENCIES.INR;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{s.name}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Updated {new Date(s.updatedAt).toLocaleDateString()} · {s.currencyCode}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-lg border ${
                        STATUS_STYLES[s.results.status]
                      }`}
                    >
                      {formatPercent(s.results.housingPercentage, 1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                      <div className="font-black text-slate-900">
                        {formatCurrency(s.results.totalHousingCost, currency)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-brand-50/60 border border-brand-200">
                      <div className="text-[10px] uppercase font-bold text-brand-700">
                        Per person
                      </div>
                      <div className="font-black text-brand-700">
                        {formatCurrency(s.results.perPersonCost, currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-4">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {s.results.peopleCount} {s.results.peopleCount === 1 ? 'person' : 'people'} ·{' '}
                    {s.inputs.affordabilityTarget}% target
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoad(s)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                    >
                      Load into calculator <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {pendingDelete === s.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          disabled={deleteScenario.isPending}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] disabled:opacity-60"
                        >
                          {deleteScenario.isPending ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          className="px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100 font-bold text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={`Delete ${s.name}`}
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
