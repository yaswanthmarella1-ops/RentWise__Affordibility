import React from 'react';
import { BookOpen } from 'lucide-react';

export const RentalGuide: React.FC = () => {
  return (
    <section id="guide" className="py-12 scroll-mt-20">
      <div className="bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Rental Wisdom & Rules of Thumb</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            The Financial Rules of Smart Renting
          </h3>

          <p className="text-slate-300 text-sm max-w-3xl mb-8 leading-relaxed">
            Renting shouldn't drain your bank account. Here are the core personal finance principles top advisors use to avoid getting house-poor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rule 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <div className="text-brand-400 font-black text-xl mb-1">
                The 30% Rule
              </div>
              <h4 className="text-sm font-bold text-white mb-2">
                Standard Housing Cap
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Spend no more than 30% of your gross monthly income on housing (rent + utilities). Exceeding 30% makes it harder to save for emergencies, investments, or travel.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <div className="text-emerald-400 font-black text-xl mb-1">
                50 / 30 / 20 Rule
              </div>
              <h4 className="text-sm font-bold text-white mb-2">
                Holistic Budgeting
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Allocate 50% for Needs (Rent, Bills, Groceries), 30% for Wants (Dining, Entertainment), and 20% for Savings & Debt Payoff.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <div className="text-amber-400 font-black text-xl mb-1">
                Hidden Move-in Costs
              </div>
              <h4 className="text-sm font-bold text-white mb-2">
                Plan Ahead
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Always budget for 1–2 months security deposit, moving truck costs, WiFi setup, and furnishing. Never let move-in costs empty your savings account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
