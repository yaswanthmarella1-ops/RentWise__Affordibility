import React from 'react';
import { Building2, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const handleScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                RentWise
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Making renting simpler, fairer, and smarter. Real-time rent affordability checks, equal and custom roommate cost splitting, and financial insights for college students and young professionals.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-brand-400 border border-slate-700">
              <Sparkles className="w-3 h-3" />
              <span>Built for smarter renting.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#calculator')}
                  className="hover:text-white transition-colors"
                >
                  Rent Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#comparison')}
                  className="hover:text-white transition-colors"
                >
                  Roommate Comparison
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#custom-split')}
                  className="hover:text-white transition-colors"
                >
                  Custom Weighted Split
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#insights')}
                  className="hover:text-white transition-colors"
                >
                  Financial Insights
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#how-it-works')}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Rules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Rules & Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#guide')}
                  className="hover:text-white transition-colors"
                >
                  The 30% Housing Rule
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScroll('#guide')}
                  className="hover:text-white transition-colors"
                >
                  50/30/20 Budget Guide
                </button>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} RentWise. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for students & roommates worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
