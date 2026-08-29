import React from 'react';
import { HelpCircle, Plus, Minus, AlertCircle } from 'lucide-react';

interface InputFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  error?: string;
  quickPills?: Array<{ label: string; value: number }>;
  showSlider?: boolean;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
  tooltip,
  error,
  quickPills,
  showSlider = false,
  sliderMin = min || 0,
  sliderMax = max || 100000,
  sliderStep = step,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      onChange(0);
      return;
    }
    const num = parseFloat(rawVal);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleIncrement = () => {
    const newVal = (value || 0) + step;
    if (max !== undefined && newVal > max) return;
    onChange(newVal);
  };

  const handleDecrement = () => {
    const newVal = (value || 0) - step;
    if (min !== undefined && newVal < min) return;
    onChange(Math.max(min, newVal));
  };

  return (
    <div className="space-y-2">
      {/* Label and Tooltip Header */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
        >
          <span>{label}</span>
          {tooltip && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={`More info about ${label}`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {showTooltip && (
                <div className="absolute left-0 bottom-full mb-1.5 w-48 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-30 leading-tight">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </label>

        {error && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
            <AlertCircle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>

      {/* Main Input Box with Steppers */}
      <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all group overflow-hidden">
        {prefix && (
          <div className="pl-3.5 pr-1 font-mono font-bold text-slate-400 text-sm select-none group-focus-within:text-brand-600 transition-colors">
            {prefix}
          </div>
        )}

        <input
          type="number"
          id={id}
          value={value === 0 ? '' : value}
          placeholder="0"
          min={min}
          max={max}
          step={step}
          onChange={handleInputChange}
          className="w-full py-2.5 px-2 bg-transparent text-slate-900 font-bold text-base focus:outline-none placeholder-slate-400 tracking-tight"
        />

        {suffix && (
          <div className="pr-3 text-xs font-semibold text-slate-400 select-none">
            {suffix}
          </div>
        )}

        {/* Stepper buttons */}
        <div className="flex items-center border-l border-slate-200 px-1 py-1 gap-0.5 bg-white/60">
          <button
            type="button"
            onClick={handleDecrement}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label={`Increase ${label}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Range Slider */}
      {showSlider && (
        <div className="pt-1 px-1">
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={value || sliderMin}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none"
            aria-label={`${label} slider`}
          />
        </div>
      )}

      {/* Quick Pills */}
      {quickPills && quickPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {quickPills.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => onChange(pill.value)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                value === pill.value
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
