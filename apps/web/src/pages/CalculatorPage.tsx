import { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { RentCalculator } from '../components/RentCalculator';
import { RoommateComparison } from '../components/RoommateComparison';
import { CustomSplit } from '../components/CustomSplit';
import { SmartInsights } from '../components/SmartInsights';
import { HowItWorks } from '../components/HowItWorks';
import { RentalGuide } from '../components/RentalGuide';
import { ShareModal } from '../components/ShareModal';
import { Footer } from '../components/Footer';
import { useCalculator } from '../context/CalculatorContext';

function scrollToSection(id: string): void {
  const el = document.querySelector(id);
  if (!el) return;

  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export function CalculatorPage() {
  const {
    currencyCode,
    currency,
    inputs,
    results,
    activePresetId,
    loadedScenarioId,
    loadedScenarioName,
    setCurrency,
    setInput,
    applyPreset,
    setPeopleCount,
    reset,
    clearLoadedScenario,
  } = useCalculator();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar currentCurrency={currencyCode} onCurrencyChange={setCurrency} />

      <main className="flex-1">
        <Hero
          onCalculateClick={() => scrollToSection('#calculator')}
          onHowItWorksClick={() => scrollToSection('#how-it-works')}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Shown when the inputs came from a saved scenario, so it is obvious
              which record a subsequent "Update" will overwrite. */}
          {loadedScenarioId && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Bookmark className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="truncate">
                  Editing saved scenario <strong>{loadedScenarioName}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={clearLoadedScenario}
                className="shrink-0 p-1 rounded-lg text-brand-700 hover:bg-brand-100 transition-colors"
                aria-label="Stop editing this saved scenario"
                title="Detach from this saved scenario"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <RentCalculator
            inputs={inputs}
            onInputChange={setInput}
            onSelectPreset={applyPreset}
            onReset={reset}
            activePresetId={activePresetId}
            results={results}
            currency={currency}
            currencyCode={currencyCode}
            loadedScenarioId={loadedScenarioId}
            loadedScenarioName={loadedScenarioName}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />

          <RoommateComparison
            rent={inputs.rent}
            utilities={inputs.utilities}
            currentRoommates={inputs.roommates}
            income={inputs.income}
            currency={currency}
            onSelectPeopleCount={(count) => {
              setPeopleCount(count);
              scrollToSection('#calculator');
            }}
          />

          <CustomSplit
            totalHousingCost={results.totalHousingCost}
            totalRent={results.totalRent}
            totalUtilities={results.totalUtilities}
            initialPeopleCount={results.peopleCount}
            currency={currency}
          />

          <SmartInsights inputs={inputs} results={results} currency={currency} />

          <HowItWorks />

          <RentalGuide />
        </div>
      </main>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        results={results}
        inputs={inputs}
        currency={currency}
      />

      <Footer />
    </div>
  );
}
