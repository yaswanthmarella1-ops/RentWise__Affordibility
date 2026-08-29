import React from 'react';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
    <Link to="/" className="flex items-center gap-2.5 mb-8 group">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
        <Building2 className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-brand-950 to-brand-700 bg-clip-text text-transparent">
          RentWise
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-600 -mt-1">
          Housing &amp; Splitter
        </span>
      </div>
    </Link>

    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-card p-7 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>

      {children}
    </div>

    <div className="mt-6 text-xs text-slate-500">{footer}</div>
  </div>
);
