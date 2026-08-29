import React from 'react';
import {
  Wallet,
  Users2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface HeroProps {
  onCalculateClick: () => void;
  onHowItWorksClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onCalculateClick,
  onHowItWorksClick,
}) => {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[350px] bg-gradient-to-tr from-brand-200/50 via-indigo-100/40 to-emerald-100/30 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/70 text-brand-800 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 inline" />
              Real-time Housing Intelligence & Roommate Fair Split
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] sm:leading-[1.1]">
            Know Your Rent.{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-800 bg-clip-text text-transparent block sm:inline">
              Know Your Budget.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Split rent fairly, check affordability, and understand your true monthly housing cost in seconds. Designed for students, young professionals, and roommates.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onCalculateClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-brand-600 shadow-md shadow-slate-900/10 hover:shadow-brand-500/25 transition-all duration-200 active:scale-98 group"
            >
              <span>Calculate My Rent</span>
              <ArrowRight className="w-4 h-4 text-brand-300 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onHowItWorksClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-all duration-200 active:scale-98"
            >
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 pt-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>30% Standard Rule Check</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Instant Real-Time Math</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>100% Free & Private</span>
            </div>
          </div>
        </div>

        {/* 3 Value Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card-hover hover:border-brand-200 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-100/80 transition-all">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
              Affordability Check
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Know If Rent Fits Your Income
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Verify if monthly housing fits safely within your 30% budget limit or causes financial strain before signing a lease.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card-hover hover:border-brand-200 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-100/80 transition-all">
              <Users2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              Fair Roommate Split
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Equal & Custom Sharing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Instantly calculate equal per-person shares or customize by master bedroom, room sizes, and amenities with zero awkward math.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card-hover hover:border-brand-200 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-100/80 transition-all">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Smart Insights
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Actionable Budget Strategy
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Explore dynamic insights showing annual savings, required income benchmarks, and how adding roommates optimizes your budget.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
