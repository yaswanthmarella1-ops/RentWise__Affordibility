import React from 'react';
import { Home, Users, BarChart3, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Enter Rent & Utilities',
      description: 'Input the property monthly rent and estimated utilities like electricity, water, gas, and WiFi.',
      icon: Home,
      accent: 'bg-brand-50 text-brand-600 border-brand-200',
    },
    {
      step: '02',
      title: 'Add Income & Roommates',
      description: 'Specify your monthly income and how many roommates will share the lease with you.',
      icon: Users,
      accent: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      step: '03',
      title: 'Get Instant Affordability Result',
      description: 'Receive real-time 30% rule check, per-person cost breakdown, and dynamic savings insights.',
      icon: BarChart3,
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
            How RentWise Works
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            No complex formulas or registration required — just enter your figures and get instant financial clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs group-hover:scale-110 transition-transform ${item.accent}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-200 font-mono">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700">
                  <span>Step {index + 1}</span>
                  {index < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
