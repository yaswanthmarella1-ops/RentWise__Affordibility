import React from 'react';
import {
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  ShieldCheck,
  PiggyBank,
  PieChart
} from 'lucide-react';
import { CalculatorInputs, CalculationResults, Currency } from '../types/calculator';
import { generateSmartInsights } from '../utils/calculations';

interface SmartInsightsProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
  currency: Currency;
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({
  inputs,
  results,
  currency,
}) => {
  const insights = generateSmartInsights(inputs, results, currency);

  const getInsightIcon = (type: string, sentiment: string) => {
    switch (type) {
      case 'budget':
        return sentiment === 'positive' ? (
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        ) : (
          <TrendingUp className="w-4 h-4 text-rose-600" />
        );
      case 'roommate':
        return <PiggyBank className="w-4 h-4 text-brand-600" />;
      case 'income':
        return <Target className="w-4 h-4 text-indigo-600" />;
      case 'savings':
        return <PieChart className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          border: 'border-emerald-200/80 hover:border-emerald-300',
          bg: 'bg-emerald-50/40',
        };
      case 'warning':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          border: 'border-amber-200/80 hover:border-amber-300',
          bg: 'bg-amber-50/40',
        };
      case 'negative':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          border: 'border-rose-200/80 hover:border-rose-300',
          bg: 'bg-rose-50/40',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          border: 'border-slate-200/80 hover:border-slate-300',
          bg: 'bg-white',
        };
    }
  };

  return (
    <section id="insights" className="py-12 scroll-mt-20">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Smart Financial Insights
              </h3>
              <p className="text-xs text-slate-500">
                Automated budget analysis derived from your real-time numbers
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-[11px] font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
            {insights.length} Active Insights
          </span>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight) => {
            const styles = getSentimentStyles(insight.sentiment);
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-subtle flex flex-col justify-between ${styles.bg} ${styles.border}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white shadow-xs">
                        {getInsightIcon(insight.type, insight.sentiment)}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {insight.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${styles.badge}`}
                    >
                      {insight.valueText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
