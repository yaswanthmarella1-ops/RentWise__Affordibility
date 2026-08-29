import React from 'react';
import { Target, ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { CalculationResults, Currency, CalculatorInputs } from '../types/calculator';
import { formatCurrency } from '../utils/formatters';

interface MaxAffordableCardProps {
  results: CalculationResults;
  inputs: CalculatorInputs;
  currency: Currency;
  onApplyMaxRent?: (val: number) => void;
}

export const MaxAffordableCard: React.FC<MaxAffordableCardProps> = ({
  results,
  inputs,
  currency,
  onApplyMaxRent,
}) => {
  const {
    maxHousingBudget,
    maxAffordableRent,
    isMaxRentNegative,
    affordabilityTarget,
  } = results;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle hover:shadow-card transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Maximum Affordable Rent
            </h4>
            <div className="text-sm font-bold text-slate-900">
              Target Cap ({affordabilityTarget}%)
            </div>
          </div>
        </div>

        {/* Max Rent Figure */}
        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Safe Rent Ceiling</div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              isMaxRentNegative ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {isMaxRentNegative
              ? '₹0 (Deficit)'
              : formatCurrency(maxAffordableRent, currency)}
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div
        className={`p-3 rounded-xl text-xs leading-relaxed ${
          isMaxRentNegative
            ? 'bg-rose-50 border border-rose-200 text-rose-800'
            : 'bg-slate-50 border border-slate-200 text-slate-700'
        }`}
      >
        {isMaxRentNegative ? (
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Budget Alert:</strong>
              Your utilities ({formatCurrency(inputs.utilities, currency)}) exceed your total {affordabilityTarget}% housing budget of {formatCurrency(maxHousingBudget, currency)}. Consider reducing utility expenses or increasing your target percentage.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              Based on your monthly income of{' '}
              <span className="font-bold text-slate-900">
                {formatCurrency(inputs.income, currency)}
              </span>
              , a rent of up to{' '}
              <span className="font-bold text-brand-700">
                {formatCurrency(maxAffordableRent, currency)}
              </span>{' '}
              would keep your total housing expenses (rent + utilities) within your{' '}
              <span className="font-bold text-slate-900">
                {affordabilityTarget}%
              </span>{' '}
              target.
            </div>
          </div>
        )}
      </div>

      {/* Breakdown sub-row */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
        <div>
          Max Total Housing Budget:{' '}
          <span className="font-bold text-slate-700">
            {formatCurrency(maxHousingBudget, currency)}
          </span>
        </div>
        <div>
          Minus Utilities:{' '}
          <span className="font-bold text-slate-700">
            -{formatCurrency(inputs.utilities, currency)}
          </span>
        </div>
        {onApplyMaxRent && !isMaxRentNegative && maxAffordableRent > 0 && (
          <button
            type="button"
            onClick={() => onApplyMaxRent(maxAffordableRent)}
            className="text-brand-600 hover:text-brand-800 font-bold inline-flex items-center gap-0.5 hover:underline"
          >
            Apply <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
