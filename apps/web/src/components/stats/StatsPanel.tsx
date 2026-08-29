import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Info,
  Lock,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercent, getCurrency } from '@rentwise/shared';
import type { StatsResponse } from '../../lib/types';

const STATUS_LABEL = {
  affordable: 'Affordable',
  warning: 'Close to limit',
  danger: 'Over target',
} as const;

const STATUS_STYLE = {
  affordable: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  danger: 'bg-rose-100 text-rose-800 border-rose-300',
} as const;

interface StatsPanelProps {
  stats: StatsResponse;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const { portfolio, profileCompletion, cohort } = stats;
  const currency = getCurrency(portfolio.currencyCode);

  if (portfolio.scenarioCount === 0) return null;

  return (
    <section className="space-y-4 mb-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Your statistics</h2>
          <p className="text-[11px] text-slate-500">
            Across {portfolio.scenarioCount}{' '}
            {portfolio.scenarioCount === 1 ? 'scenario' : 'scenarios'}
            {portfolio.excludedForCurrency > 0 &&
              ` · ${portfolio.excludedForCurrency} in another currency excluded from averages`}
          </p>
        </div>
      </div>

      {/* Headline averages — always available, no profile needed */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Avg housing cost"
          value={formatCurrency(portfolio.averages.monthlyHousingCost, currency)}
          sub="per month"
        />
        <StatTile
          label="Avg your share"
          value={formatCurrency(portfolio.averages.perPersonCost, currency)}
          sub="per person / month"
          accent
        />
        <StatTile
          label="Avg income used"
          value={formatPercent(portfolio.averages.housingPercentage, 1)}
          sub={`target ${formatPercent(portfolio.averages.affordabilityTarget, 0)}`}
        />
        <StatTile
          label="Avg household"
          value={portfolio.averages.peopleCount.toFixed(1)}
          sub="people sharing"
        />
      </div>

      {/* Verdict spread + best/worst */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Affordability breakdown
          </h3>
          <div className="space-y-2">
            {(['affordable', 'warning', 'danger'] as const).map((key) => {
              const count = portfolio.statusBreakdown[key];
              const pct = (count / portfolio.scenarioCount) * 100;

              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md border w-28 text-center shrink-0 ${STATUS_STYLE[key]}`}
                  >
                    {STATUS_LABEL[key]}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        key === 'affordable'
                          ? 'bg-emerald-500'
                          : key === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Cheapest vs priciest
          </h3>

          {portfolio.cheapest && portfolio.priciest && portfolio.perPersonSpread > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold min-w-0">
                  <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{portfolio.cheapest.name}</span>
                </span>
                <span className="font-black text-slate-900 shrink-0">
                  {formatCurrency(portfolio.cheapest.perPersonCost, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-rose-700 font-semibold min-w-0">
                  <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{portfolio.priciest.name}</span>
                </span>
                <span className="font-black text-slate-900 shrink-0">
                  {formatCurrency(portfolio.priciest.perPersonCost, currency)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-600">
                <TrendingDown className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-px" />
                <span>
                  Choosing the cheaper one saves{' '}
                  <strong className="text-slate-900">
                    {formatCurrency(portfolio.perPersonSpread, currency)}/mo
                  </strong>{' '}
                  — {formatCurrency(portfolio.annualSpread, currency)} a year.
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Save a second scenario to compare options side by side.
            </p>
          )}
        </div>
      </div>

      {/* Income analysis — unlocked by the optional income field */}
      {portfolio.incomeAnalysis ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Re-scored against your real income (
              {formatCurrency(portfolio.incomeAnalysis.profileMonthlyIncome, currency)}/mo)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['affordable', 'warning', 'danger'] as const).map((key) => (
              <div
                key={key}
                className={`p-2.5 rounded-xl border text-center ${STATUS_STYLE[key]}`}
              >
                <div className="text-lg font-black">
                  {portfolio.incomeAnalysis!.restatedBreakdown[key]}
                </div>
                <div className="text-[10px] font-bold uppercase">{STATUS_LABEL[key]}</div>
              </div>
            ))}
          </div>

          {portfolio.incomeAnalysis.changedVerdict.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <strong className="block">
                {portfolio.incomeAnalysis.changedVerdict.length}{' '}
                {portfolio.incomeAnalysis.changedVerdict.length === 1
                  ? 'scenario changes'
                  : 'scenarios change'}{' '}
                verdict on your real income:
              </strong>
              {portfolio.incomeAnalysis.changedVerdict.slice(0, 4).map((c) => (
                <div key={c.id}>
                  <span className="font-semibold">{c.name}</span>: {STATUS_LABEL[c.from]} →{' '}
                  {STATUS_LABEL[c.to]}
                </div>
              ))}
            </div>
          )}

          {portfolio.incomeAnalysis.mismatchedScenarios.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              {portfolio.incomeAnalysis.mismatchedScenarios.length}{' '}
              {portfolio.incomeAnalysis.mismatchedScenarios.length === 1
                ? 'scenario assumes'
                : 'scenarios assume'}{' '}
              an income different from your profile.
            </p>
          )}
        </div>
      ) : (
        <LockedCard
          title="Income analysis"
          body="Add your monthly income to your profile and every saved scenario gets re-scored against what you actually earn — including any that flip from affordable to over-target."
        />
      )}

      {/* Household fit — unlocked by the optional household size field */}
      {portfolio.householdFit && portfolio.householdFit.differing.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
          <Users className="w-4 h-4 text-slate-500 shrink-0 mt-px" />
          <span>
            {portfolio.householdFit.differing.length} of {portfolio.scenarioCount} scenarios
            assume a household size other than your usual{' '}
            <strong>{portfolio.householdFit.profileHouseholdSize}</strong>:{' '}
            {portfolio.householdFit.differing
              .slice(0, 3)
              .map((d) => `${d.name} (${d.peopleCount})`)
              .join(', ')}
            .
          </span>
        </div>
      )}

      {/* Anonymous city cohort */}
      {'city' in cohort ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Compared with {cohort.sampleSize} other renters in {cohort.city}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Their median share</div>
              <div className="font-black text-slate-900">
                {formatCurrency(cohort.medianPerPersonCost, currency)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Their median income used
              </div>
              <div className="font-black text-slate-900">
                {formatPercent(cohort.medianHousingPercentage, 1)}
              </div>
            </div>
            {cohort.yourPercentile !== null && (
              <div>
                <div className="text-[10px] uppercase font-bold text-brand-700">You</div>
                <div className="font-black text-brand-700">
                  {cohort.yourPercentile}th percentile
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400">
            Aggregate medians only. Individual scenarios are never shared, and this appears only
            once enough renters in a city have saved data.
          </p>
        </div>
      ) : (
        <LockedCard
          title={cohort.reason === 'no_city' ? 'City comparison' : `Comparison for your city`}
          body={cohort.message}
        />
      )}

      {/* Nudge toward the remaining optional fields */}
      {profileCompletion.missing.length > 0 && (
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-[11px] text-brand-900">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-px" />
          <div>
            <strong>
              Profile {profileCompletion.percent}% complete ({profileCompletion.filledCount}/
              {profileCompletion.totalCount})
            </strong>
            <span className="block mt-0.5">
              Still optional — but adding{' '}
              {profileCompletion.missing
                .slice(0, 3)
                .map((m) => m.label.toLowerCase())
                .join(', ')}{' '}
              would sharpen this analysis.{' '}
              <Link to="/profile" className="font-bold underline hover:text-brand-700">
                Update profile
              </Link>
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

const StatTile: React.FC<{ label: string; value: string; sub: string; accent?: boolean }> = ({
  label,
  value,
  sub,
  accent,
}) => (
  <div
    className={`p-4 rounded-2xl border shadow-subtle ${
      accent
        ? 'bg-gradient-to-br from-brand-600 to-indigo-800 border-transparent text-white'
        : 'bg-white border-slate-200'
    }`}
  >
    <div
      className={`text-[10px] uppercase font-bold tracking-wider ${
        accent ? 'text-brand-100' : 'text-slate-500'
      }`}
    >
      {label}
    </div>
    <div className={`text-xl font-black mt-1 ${accent ? 'text-white' : 'text-slate-900'}`}>
      {value}
    </div>
    <div className={`text-[10px] font-medium ${accent ? 'text-brand-100/90' : 'text-slate-400'}`}>
      {sub}
    </div>
  </div>
);

const LockedCard: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4">
    <div className="flex items-start gap-2.5">
      <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div>
        <h3 className="text-xs font-bold text-slate-700">{title}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{body}</p>
        <Link
          to="/profile"
          className="inline-block mt-2 text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline"
        >
          Add these details →
        </Link>
      </div>
    </div>
  </div>
);
