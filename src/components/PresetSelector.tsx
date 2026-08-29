import React from 'react';
import {
  GraduationCap,
  User,
  Building2,
  PiggyBank,
  Home,
  Sparkles
} from 'lucide-react';
import { Currency, CalculatorInputs } from '../types/calculator';
import { getPresets } from '../utils/presets';

interface PresetSelectorProps {
  currency: Currency;
  onSelectPreset: (inputs: CalculatorInputs) => void;
  activePresetId?: string;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currency,
  onSelectPreset,
  activePresetId,
}) => {
  const presets = getPresets(currency);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'User':
        return <User className="w-3.5 h-3.5" />;
      case 'Building2':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'PiggyBank':
        return <PiggyBank className="w-3.5 h-3.5" />;
      default:
        return <Home className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Quick Test Scenarios
        </span>
        <span className="text-[11px] text-slate-400 font-medium">1-Click Load</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {presets.map((p) => {
          const isActive = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.inputs)}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between group ${
                isActive
                  ? 'bg-white border-brand-500 shadow-sm ring-2 ring-brand-500/10'
                  : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'bg-slate-100 text-slate-600 group-hover:text-brand-600'
                  }`}
                >
                  {getIcon(p.icon)}
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.tag}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1">
                  {p.inputs.roommates === 0 ? 'Solo' : `${p.inputs.roommates + 1} people`} • {p.inputs.affordabilityTarget}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
