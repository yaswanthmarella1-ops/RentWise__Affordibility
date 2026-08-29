import React, { useState } from 'react';
import {
  Users,
  Home,
  DollarSign,
  PieChart,
  Calendar,
  Share2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  CalculationResults,
  CalculatorInputs,
  Currency,
  CurrencyCode,
  formatCurrency,
  formatPercent,
} from '@rentwise/shared';
import { AffordabilityIndicator } from './AffordabilityIndicator';
import { MaxAffordableCard } from './MaxAffordableCard';
import { SaveScenarioButton } from './SaveScenarioButton';

interface ResultsDashboardProps {
  results: CalculationResults;
  inputs: CalculatorInputs;
  currency: Currency;
  currencyCode: CurrencyCode;
  loadedScenarioId?: string;
  loadedScenarioName?: string;
  onApplyMaxRent?: (val: number) => void;
  onOpenShareModal: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  inputs,
  currency,
  currencyCode,
  loadedScenarioId,
  loadedScenarioName,
  onApplyMaxRent,
  onOpenShareModal,
}) => {
  const [isAnnualView, setIsAnnualView] = useState(false);

  const multiplier = isAnnualView ? 12 : 1;
  const timeLabel = isAnnualView ? '/year' : '/month';

  const displayedTotalHousing = results.totalHousingCost * multiplier;
  const displayedPerPerson = results.perPersonCost * multiplier;
  const displayedRent = results.totalRent * multiplier;
  const displayedUtilities = results.totalUtilities * multiplier;
  const displayedPerPersonRent = results.perPersonRent * multiplier;
  const displayedPerPersonUtilities = results.perPersonUtilities * multiplier;

  const getStatusBadge = () => {
    switch (results.status) {
      case 'affordable':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          text: '✓ Affordable',
        };
      case 'warning':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: AlertTriangle,
          text: '⚠️ Close to Limit',
        };
      default:
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: AlertCircle,
          text: '⚠️ Above Target',
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusBadgeIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      {/* View Switcher & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Timeframe:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setIsAnnualView(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                !isAnnualView
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly View
            </button>
            <button
              type="button"
              onClick={() => setIsAnnualView(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isAnnualView
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Annual View (12 mo)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SaveScenarioButton
            inputs={inputs}
            currencyCode={currencyCode}
            loadedScenarioId={loadedScenarioId}
            loadedScenarioName={loadedScenarioName}
          />

          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Share Split Summary</span>
          </button>
        </div>
      </div>

      {/* Primary Top Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Housing Cost */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Housing
            </span>
            <Home className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(displayedTotalHousing, currency)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Rent + Utilities {timeLabel}
            </div>
          </div>
        </div>

        {/* Card 2: Fair Share Per Person (Most Prominent Highlight) */}
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-4 rounded-2xl shadow-md text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between text-brand-200 mb-2 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100">
              Fair Per Person
            </span>
            <Users className="w-4 h-4 text-brand-200" />
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {formatCurrency(displayedPerPerson, currency)}
            </div>
            <div className="text-[11px] text-brand-100/90 font-medium">
              {results.peopleCount} {results.peopleCount === 1 ? 'person' : 'people'} equal split {timeLabel}
            </div>
          </div>
        </div>

        {/* Card 3: Income Used % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Income Used
            </span>
            <PieChart className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatPercent(results.housingPercentage, 1)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Target: {inputs.affordabilityTarget}% of income
            </div>
          </div>
        </div>

        {/* Card 4: Affordability Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Affordability
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${statusBadge.bg}`}
              >
                <StatusBadgeIcon className="w-3.5 h-3.5" />
                <span>{statusBadge.text}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              vs {inputs.affordabilityTarget}% target limit
            </div>
          </div>
        </div>
      </div>

      {/* Visual Affordability Meter Gauge */}
      <AffordabilityIndicator
        results={results}
        inputs={inputs}
        currency={currency}
      />

      {/* Detailed Cost Split Breakdown Box */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-subtle">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Housing Cost & Roommate Breakdown
            </h4>
            <p className="text-xs text-slate-500">
              Transparent cost distribution among all household occupants
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {results.peopleCount} {results.peopleCount === 1 ? 'Total Person' : 'Total People'} (You + {inputs.roommates} Roommate{inputs.roommates === 1 ? '' : 's'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Total Household Box */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Entire Household Total
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Total Monthly Rent:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(displayedRent, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Total Monthly Utilities:</span>
              <span className="font-bold text-slate-900">
                +{formatCurrency(displayedUtilities, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
              <span>Total Housing Cost:</span>
              <span className="text-brand-700">
                {formatCurrency(displayedTotalHousing, currency)}
              </span>
            </div>
          </div>

          {/* Individual Share Box */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-brand-50/50 border border-brand-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
              Your Fair Share Breakdown
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Your Rent Share (÷{results.peopleCount}):</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(displayedPerPersonRent, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Your Utilities Share (÷{results.peopleCount}):</span>
              <span className="font-bold text-slate-900">
                +{formatCurrency(displayedPerPersonUtilities, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-brand-200 font-bold text-sm text-slate-900">
              <span>Fair Share Per Person:</span>
              <span className="text-brand-600 font-black">
                {formatCurrency(displayedPerPerson, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Max Affordable Rent Calculation Card */}
      <MaxAffordableCard
        results={results}
        inputs={inputs}
        currency={currency}
        onApplyMaxRent={onApplyMaxRent}
      />
    </div>
  );
};
