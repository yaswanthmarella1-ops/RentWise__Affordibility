import { useState } from 'react';
import { CurrencyCode, CalculatorInputs } from './types/calculator';
import { CURRENCIES, DEFAULT_CURRENCY } from './utils/currencies';
import { calculateRentAffordability } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RentCalculator } from './components/RentCalculator';
import { RoommateComparison } from './components/RoommateComparison';
import { CustomSplit } from './components/CustomSplit';
import { SmartInsights } from './components/SmartInsights';
import { HowItWorks } from './components/HowItWorks';
import { RentalGuide } from './components/RentalGuide';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';

export function App() {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('INR');
  const currency = CURRENCIES[currencyCode] || DEFAULT_CURRENCY;

  // Global inputs state for deep integration between Calculator, Comparison, and Custom Split
  const [inputs, setInputs] = useState<CalculatorInputs>({
    rent: DEFAULT_CURRENCY.defaultRent,
    utilities: DEFAULT_CURRENCY.defaultUtilities,
    roommates: 2, // 2 roommates => 3 people total
    income: DEFAULT_CURRENCY.defaultIncome,
    affordabilityTarget: 30,
  });

  const [activePresetId, setActivePresetId] = useState<string | undefined>('student-2bhk');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync defaults when currency changes
  const handleCurrencyChange = (newCode: CurrencyCode) => {
    setCurrencyCode(newCode);
    const newCurr = CURRENCIES[newCode];
    setInputs((prev) => ({
      ...prev,
      rent: newCurr.defaultRent,
      utilities: newCurr.defaultUtilities,
      income: newCurr.defaultIncome,
    }));
    setActivePresetId(undefined);
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: number) => {
    setActivePresetId(undefined);
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectPreset = (presetInputs: CalculatorInputs) => {
    setInputs(presetInputs);
  };

  const handleReset = () => {
    setInputs({
      rent: currency.defaultRent,
      utilities: currency.defaultUtilities,
      roommates: 2,
      income: currency.defaultIncome,
      affordabilityTarget: 30,
    });
    setActivePresetId('student-2bhk');
  };

  const results = calculateRentAffordability(inputs);

  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSelectPeopleCount = (peopleCount: number) => {
    setInputs((prev) => ({
      ...prev,
      roommates: Math.max(0, peopleCount - 1),
    }));
    setActivePresetId(undefined);
    scrollToSection('#calculator');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentCurrency={currencyCode}
        onCurrencyChange={handleCurrencyChange}
      />

      {/* Main Landing Flow */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onCalculateClick={() => scrollToSection('#calculator')}
          onHowItWorksClick={() => scrollToSection('#how-it-works')}
        />

        {/* Calculator & Live Results Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RentCalculator
            inputs={inputs}
            onInputChange={handleInputChange}
            onSelectPreset={handleSelectPreset}
            onReset={handleReset}
            activePresetId={activePresetId}
            results={results}
            currency={currency}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />

          {/* Roommate Sensitivity Comparison Grid */}
          <RoommateComparison
            rent={inputs.rent}
            utilities={inputs.utilities}
            currentRoommates={inputs.roommates}
            income={inputs.income}
            currency={currency}
            onSelectPeopleCount={handleSelectPeopleCount}
          />

          {/* Advanced Custom Weighted Splitter */}
          <CustomSplit
            totalHousingCost={results.totalHousingCost}
            totalRent={results.totalRent}
            totalUtilities={results.totalUtilities}
            initialPeopleCount={results.peopleCount}
            currency={currency}
          />

          {/* Dynamic Smart Financial Insights */}
          <SmartInsights
            inputs={inputs}
            results={results}
            currency={currency}
          />

          {/* How It Works (3 Steps) */}
          <HowItWorks />

          {/* Financial Rules of Smart Renting Guide */}
          <RentalGuide />
        </div>
      </main>

      {/* Share / Export Summary Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        results={results}
        inputs={inputs}
        currency={currency}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
