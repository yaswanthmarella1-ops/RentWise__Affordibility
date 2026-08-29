import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CalculationResults, Currency, CalculatorInputs } from '../types/calculator';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface AffordabilityIndicatorProps {
  results: CalculationResults;
  inputs: CalculatorInputs;
  currency: Currency;
}

export const AffordabilityIndicator: React.FC<AffordabilityIndicatorProps> = ({
  results,
  inputs,
  currency,
}) => {
  const prevStatusRef = useRef(results.status);

  // Trigger celebration confetti when moving into 'affordable' status
  useEffect(() => {
    if (results.status === 'affordable' && prevStatusRef.current !== 'affordable') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#0ea5e9', '#6366f1'],
        });
      } catch {
        // Fallback silently if confetti is blocked
      }
    }
    prevStatusRef.current = results.status;
  }, [results.status]);

  const {
    housingPercentage,
    affordabilityTarget,
    status,
    statusTitle,
    statusDescription,
  } = results;

  // Visual status config
  const statusStyles = {
    affordable: {
      cardBg: 'bg-emerald-50/70 border-emerald-200/80',
      badgeBg: 'bg-emerald-500 text-white',
      textColor: 'text-emerald-950',
      accentColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
      gaugeStroke: '#10b981',
      icon: CheckCircle2,
    },
    warning: {
      cardBg: 'bg-amber-50/70 border-amber-200/80',
      badgeBg: 'bg-amber-500 text-white',
      textColor: 'text-amber-950',
      accentColor: 'text-amber-600',
      barColor: 'bg-amber-500',
      gaugeStroke: '#f59e0b',
      icon: AlertTriangle,
    },
    danger: {
      cardBg: 'bg-rose-50/70 border-rose-200/80',
      badgeBg: 'bg-rose-500 text-white',
      textColor: 'text-rose-950',
      accentColor: 'text-rose-600',
      barColor: 'bg-rose-500',
      gaugeStroke: '#f43f5e',
      icon: AlertCircle,
    },
  }[status];

  const StatusIcon = statusStyles.icon;

  // Normalized bar percentages (cap display at 100%)
  const clampedPercentage = Math.min(100, Math.max(0, housingPercentage));
  const diffFromTarget = housingPercentage - affordabilityTarget;
  const isOverTarget = diffFromTarget > 0;

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 ${statusStyles.cardBg} shadow-subtle`}
    >
      {/* Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${statusStyles.badgeBg} shadow-sm`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Affordability Verdict
            </div>
            <h4 className={`text-lg sm:text-xl font-extrabold ${statusStyles.textColor}`}>
              {statusTitle}
            </h4>
          </div>
        </div>

        {/* Diff badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              isOverTarget
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isOverTarget ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                <span>+{formatPercent(Math.abs(diffFromTarget), 1)} above target</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>{formatPercent(Math.abs(diffFromTarget), 1)} below target</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Description text */}
      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-6 bg-white/80 p-3.5 rounded-xl border border-slate-200/50 shadow-xs">
        {statusDescription}
      </p>

      {/* Visual Dual Progress Indicator Bar */}
      <div className="space-y-2 bg-white/90 p-4 rounded-xl border border-slate-200/60 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            Housing Cost: <span className="text-slate-900">{formatPercent(housingPercentage, 1)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Target className="w-3.5 h-3.5 text-brand-600" />
            Target: <span className="font-bold text-slate-900">{affordabilityTarget}%</span>
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          {/* Target Marker Reference Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-20 shadow-xs"
            style={{ left: `${Math.min(100, affordabilityTarget)}%` }}
            title={`Target: ${affordabilityTarget}%`}
          />

          {/* Actual Fill Bar */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusStyles.barColor}`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        {/* Quick Numbers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
          <div className="p-1.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Monthly Income
            </span>
            <span className="text-xs font-bold text-slate-800">
              {formatCurrency(inputs.income, currency)}
            </span>
          </div>

          <div className="p-1.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Housing Cost
            </span>
            <span className="text-xs font-bold text-slate-800">
              {formatCurrency(results.totalHousingCost, currency)}
            </span>
          </div>

          <div className="p-1.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Income Share
            </span>
            <span
              className={`text-xs font-extrabold ${statusStyles.accentColor}`}
            >
              {formatPercent(housingPercentage, 1)}
            </span>
          </div>

          <div className="p-1.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Target Cap
            </span>
            <span className="text-xs font-bold text-slate-800">
              {affordabilityTarget}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
