import React, { useState, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Calculator,
  Users,
  PieChart,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { CurrencyCode } from '../types/calculator';
import { CURRENCIES } from '../utils/currencies';

interface NavbarProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCurrency,
  onCurrencyChange,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Calculator', href: '#calculator', icon: Calculator },
    { name: 'Split Comparison', href: '#comparison', icon: Users },
    { name: 'Custom Split', href: '#custom-split', icon: PieChart },
    { name: 'Smart Insights', href: '#insights', icon: Lightbulb },
    { name: 'How It Works', href: '#how-it-works', icon: BookOpen },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-white/60 backdrop-blur-sm border-b border-slate-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <a
            href="#"
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-brand-950 to-brand-700 bg-clip-text text-transparent">
                RentWise
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-600 -mt-1">
                Housing & Splitter
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-brand-700 hover:bg-white hover:shadow-xs transition-all duration-150"
                >
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Right Section: Currency Selector + CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Currency Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                aria-label="Select Currency"
                aria-expanded={currencyDropdownOpen}
              >
                <span className="font-mono text-brand-600 font-bold">
                  {CURRENCIES[currentCurrency].symbol}
                </span>
                <span>{currentCurrency}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {currencyDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCurrencyDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Select Currency
                    </div>
                    {Object.values(CURRENCIES).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          onCurrencyChange(c.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentCurrency === c.code
                            ? 'bg-brand-50/70 text-brand-700 font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 font-mono font-bold text-slate-900">
                            {c.symbol}
                          </span>
                          <span>{c.code}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{c.name.split('(')[0]}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* CTA Button */}
            <a
              href="#calculator"
              onClick={(e) => handleNavClick(e, '#calculator')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-brand-600 rounded-xl shadow-sm transition-all duration-200 active:scale-95 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400 group-hover:text-white transition-colors" />
              <span>Start Calculating</span>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            {/* Mobile Currency Picker */}
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg border border-slate-200"
            >
              <span className="font-mono text-brand-600 font-bold">
                {CURRENCIES[currentCurrency].symbol}
              </span>
              <span>{currentCurrency}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 pt-3 pb-6 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="space-y-1 mb-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Icon className="w-4 h-4 text-brand-600" />
                  {link.name}
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Currency
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onCurrencyChange(c.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      currentCurrency === c.code
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>

            <a
              href="#calculator"
              onClick={(e) => handleNavClick(e, '#calculator')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-brand-600 transition-colors text-center shadow-md"
            >
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Calculate My Rent</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
