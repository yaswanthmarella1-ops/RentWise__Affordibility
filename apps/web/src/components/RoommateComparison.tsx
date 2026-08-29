import React, { useState } from 'react';
import {
  Users,
  TrendingDown,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Currency, formatCurrency, formatPercent, generateRoommateComparisons } from '@rentwise/shared';

interface RoommateComparisonProps {
  rent: number;
  utilities: number;
  currentRoommates: number;
  income: number;
  currency: Currency;
  onSelectPeopleCount: (count: number) => void;
}

export const RoommateComparison: React.FC<RoommateComparisonProps> = ({
  rent,
  utilities,
  currentRoommates,
  income,
  currency,
  onSelectPeopleCount,
}) => {
  const currentPeopleCount = currentRoommates + 1;
  const comparisons = generateRoommateComparisons(rent, utilities, currentPeopleCount, income);
  const maxPerPerson = comparisons[0]?.perPersonCost || 1;

  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="comparison" className="py-12 scroll-mt-20">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Roommate Count Comparison
              </h3>
              <p className="text-xs text-slate-500">
                See how sharing the apartment with more roommates reduces your monthly & annual expenses
              </p>
            </div>
          </div>

          {/* Toggle Monthly / Annual */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start md:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Cost
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('annual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Annual Savings
            </button>
          </div>
        </div>

        {/* Visual Comparison Chart / Bar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {comparisons.map((row) => {
            const barWidth = Math.max(12, (row.perPersonCost / maxPerPerson) * 100);
            const isCurrent = row.isCurrent;

            return (
              <div
                key={row.peopleCount}
                onClick={() => onSelectPeopleCount(row.peopleCount)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-brand-50/60 border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Current Badge */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3" /> Selected Setup
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-brand-100 group-hover:text-brand-700'
                      }`}
                    >
                      {row.peopleCount}P
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {row.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {row.percentageOfIncome > 0
                          ? `${formatPercent(row.percentageOfIncome, 1)} of income`
                          : 'Cost share'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per person cost figure */}
                <div className="mb-3">
                  <div className="text-xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(
                      activeTab === 'monthly' ? row.perPersonCost : row.annualCost,
                      currency
                    )}
                    <span className="text-xs font-semibold text-slate-400">
                      {activeTab === 'monthly' ? ' /mo' : ' /yr'}
                    </span>
                  </div>
                </div>

                {/* Relative cost visual bar */}
                <div className="space-y-1 mb-3">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrent ? 'bg-brand-600' : 'bg-slate-400 group-hover:bg-brand-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Savings vs Solo Footer */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  {row.peopleCount === 1 ? (
                    <span className="text-slate-400 italic">Solo Baseline Cost</span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Save {formatCurrency(
                        activeTab === 'monthly'
                          ? row.monthlySavingsVsSolo
                          : row.annualSavingsVsSolo,
                        currency
                      )} vs solo
                    </span>
                  )}

                  {!isCurrent && (
                    <span className="text-brand-600 opacity-0 group-hover:opacity-100 font-bold flex items-center gap-0.5 transition-opacity">
                      Select <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Roommates Setup</th>
                <th className="py-3 px-4">Rent / Person</th>
                <th className="py-3 px-4">Utilities / Person</th>
                <th className="py-3 px-4">Total / Person (Mo)</th>
                <th className="py-3 px-4">Annual Cost</th>
                <th className="py-3 px-4">Annual Savings vs Solo</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {comparisons.map((row) => (
                <tr
                  key={row.peopleCount}
                  className={`transition-colors ${
                    row.isCurrent
                      ? 'bg-brand-50/70 font-semibold text-brand-950'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-3 px-4 font-bold flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] flex items-center justify-center font-extrabold ${
                        row.isCurrent
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {row.peopleCount}
                    </span>
                    <span>{row.label}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {formatCurrency(row.perPersonRent, currency)}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {formatCurrency(row.perPersonUtilities, currency)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(row.perPersonCost, currency)}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {formatCurrency(row.annualCost, currency)}
                  </td>
                  <td className="py-3 px-4">
                    {row.annualSavingsVsSolo > 0 ? (
                      <span className="text-emerald-600 font-bold">
                        +{formatCurrency(row.annualSavingsVsSolo, currency)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.isCurrent ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-100/80 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectPeopleCount(row.peopleCount)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                      >
                        Switch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
