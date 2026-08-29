import React from 'react';
import {
  Calculator,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { CalculatorInputs, CalculationResults, Currency } from '../types/calculator';
import { validateInputs } from '../utils/calculations';
import { InputField } from './InputField';
import { PresetSelector } from './PresetSelector';
import { ResultsDashboard } from './ResultsDashboard';

interface RentCalculatorProps {
  inputs: CalculatorInputs;
  onInputChange: (field: keyof CalculatorInputs, value: number) => void;
  onSelectPreset: (presetInputs: CalculatorInputs) => void;
  onReset: () => void;
  activePresetId?: string;
  results: CalculationResults;
  currency: Currency;
  onOpenShareModal: () => void;
}

export const RentCalculator: React.FC<RentCalculatorProps> = ({
  inputs,
  onInputChange,
  onSelectPreset,
  onReset,
  activePresetId,
  results,
  currency,
  onOpenShareModal,
}) => {
  const { errors } = validateInputs(inputs);

  const handleApplyMaxRent = (val: number) => {
    onInputChange('rent', Math.round(val));
  };

  // Quick pills step configurations
  const isINR = currency.code === 'INR';
  const rentStep = isINR ? 1000 : 50;
  const rentSliderMax = isINR ? 100000 : 8000;
  const utilStep = isINR ? 500 : 25;
  const utilSliderMax = isINR ? 25000 : 2000;
  const incomeStep = isINR ? 2000 : 200;
  const incomeSliderMax = isINR ? 300000 : 20000;

  return (
    <section id="calculator" className="py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" />
            Live Rent Calculator
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Calculate Housing Affordability & Split
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Adjust your numbers below to see instant per-person shares and 30% affordability checks.
          </p>
        </div>

        {/* Quick Scenario Preset Chips */}
        <PresetSelector
          currency={currency}
          onSelectPreset={onSelectPreset}
          activePresetId={activePresetId}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Inputs Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Rental & Budget Details
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Updates live as you type
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Input 1: Monthly Rent */}
            <InputField
              id="monthly-rent"
              label="Monthly Rent"
              value={inputs.rent}
              onChange={(val) => onInputChange('rent', val)}
              prefix={currency.symbol}
              min={1}
              step={rentStep}
              tooltip="The base total monthly rent charged for the entire apartment or house."
              error={errors.rent}
              showSlider={true}
              sliderMin={0}
              sliderMax={rentSliderMax}
              sliderStep={rentStep}
              quickPills={
                isINR
                  ? [
                      { label: '₹15k', value: 15000 },
                      { label: '₹20k', value: 20000 },
                      { label: '₹30k', value: 30000 },
                      { label: '₹45k', value: 45000 },
                    ]
                  : [
                      { label: '$1,200', value: 1200 },
                      { label: '$1,600', value: 1600 },
                      { label: '$2,400', value: 2400 },
                      { label: '$3,200', value: 3200 },
                    ]
              }
            />

            {/* Input 2: Monthly Utilities */}
            <InputField
              id="monthly-utilities"
              label="Monthly Utilities & Bills"
              value={inputs.utilities}
              onChange={(val) => onInputChange('utilities', val)}
              prefix={currency.symbol}
              min={0}
              step={utilStep}
              tooltip="Estimated monthly cost for electricity, water, gas, WiFi internet, and maintenance fees."
              error={errors.utilities}
              showSlider={true}
              sliderMin={0}
              sliderMax={utilSliderMax}
              sliderStep={utilStep}
              quickPills={
                isINR
                  ? [
                      { label: '₹2k', value: 2000 },
                      { label: '₹4k', value: 4000 },
                      { label: '₹6k', value: 6000 },
                    ]
                  : [
                      { label: '$150', value: 150 },
                      { label: '$250', value: 250 },
                      { label: '$400', value: 400 },
                    ]
              }
            />

            {/* Input 3: Number of Roommates */}
            <InputField
              id="number-of-roommates"
              label="Number of Roommates"
              value={inputs.roommates}
              onChange={(val) => onInputChange('roommates', Math.max(0, Math.floor(val)))}
              min={0}
              max={10}
              step={1}
              suffix={
                inputs.roommates === 0
                  ? '(Living Solo)'
                  : `${inputs.roommates + 1} Total People`
              }
              tooltip="How many roommates share the house with you (e.g., 2 roommates means 3 people total sharing costs)."
              error={errors.roommates}
              quickPills={[
                { label: 'Solo (0)', value: 0 },
                { label: '1 Roommate', value: 1 },
                { label: '2 Roommates', value: 2 },
                { label: '3 Roommates', value: 3 },
                { label: '4 Roommates', value: 4 },
              ]}
            />

            {/* Input 4: Monthly Income */}
            <InputField
              id="monthly-income"
              label="Your Monthly Take-Home Income"
              value={inputs.income}
              onChange={(val) => onInputChange('income', val)}
              prefix={currency.symbol}
              min={1}
              step={incomeStep}
              tooltip="Your monthly net/gross take-home earnings or personal budget used to calculate your affordability percentage."
              error={errors.income}
              showSlider={true}
              sliderMin={1000}
              sliderMax={incomeSliderMax}
              sliderStep={incomeStep}
              quickPills={
                isINR
                  ? [
                      { label: '₹35k', value: 35000 },
                      { label: '₹50k', value: 50000 },
                      { label: '₹75k', value: 75000 },
                      { label: '₹1L', value: 100000 },
                    ]
                  : [
                      { label: '$3,500', value: 3500 },
                      { label: '$4,500', value: 4500 },
                      { label: '$6,000', value: 6000 },
                      { label: '$8,000', value: 8000 },
                    ]
              }
            />

            {/* Input 5: Max Affordable Rent Percentage */}
            <InputField
              id="affordability-target"
              label="Affordability Target Limit (%)"
              value={inputs.affordabilityTarget}
              onChange={(val) => onInputChange('affordabilityTarget', Math.min(100, Math.max(1, val)))}
              min={1}
              max={100}
              step={1}
              suffix="% of income"
              tooltip="The maximum percentage of your income you aim to spend on housing. Standard financial recommendation is 30%."
              error={errors.affordabilityTarget}
              showSlider={true}
              sliderMin={15}
              sliderMax={50}
              sliderStep={1}
              quickPills={[
                { label: '25% (Conservative)', value: 25 },
                { label: '30% (Standard)', value: 30 },
                { label: '35% (Flexible)', value: 35 },
                { label: '40% (Metro)', value: 40 },
              ]}
            />
          </div>

          {/* Right Column: Live Results Dashboard */}
          <div className="lg:col-span-7">
            <ResultsDashboard
              results={results}
              inputs={inputs}
              currency={currency}
              onApplyMaxRent={handleApplyMaxRent}
              onOpenShareModal={onOpenShareModal}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
