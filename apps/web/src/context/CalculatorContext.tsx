import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  calculateRentAffordability,
  type CalculationResults,
  type CalculatorInputs,
  type Currency,
  type CurrencyCode,
} from '@rentwise/shared';
import type { SavedScenario } from '../lib/types';

const STORAGE_KEY = 'rentwise.calculator.v1';

const DEFAULT_INPUTS: CalculatorInputs = {
  rent: DEFAULT_CURRENCY.defaultRent,
  utilities: DEFAULT_CURRENCY.defaultUtilities,
  roommates: 2,
  income: DEFAULT_CURRENCY.defaultIncome,
  affordabilityTarget: 30,
};

interface PersistedState {
  currencyCode: CurrencyCode;
  inputs: CalculatorInputs;
  activePresetId?: string;
}

interface CalculatorContextValue {
  currencyCode: CurrencyCode;
  currency: Currency;
  inputs: CalculatorInputs;
  results: CalculationResults;
  activePresetId?: string;
  /** Id of the saved scenario currently loaded, if any. */
  loadedScenarioId?: string;
  loadedScenarioName?: string;
  setCurrency: (code: CurrencyCode) => void;
  setInput: (field: keyof CalculatorInputs, value: number) => void;
  applyPreset: (inputs: CalculatorInputs, presetId?: string) => void;
  setPeopleCount: (peopleCount: number) => void;
  reset: () => void;
  loadScenario: (scenario: SavedScenario) => void;
  clearLoadedScenario: () => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

function isValidInputs(value: unknown): value is CalculatorInputs {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (['rent', 'utilities', 'roommates', 'income', 'affordabilityTarget'] as const).every(
    (k) => typeof v[k] === 'number' && Number.isFinite(v[k] as number),
  );
}

function readPersisted(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!isValidInputs(parsed.inputs)) return null;
    if (!parsed.currencyCode || !(parsed.currencyCode in CURRENCIES)) return null;

    return {
      currencyCode: parsed.currencyCode,
      inputs: parsed.inputs,
      activePresetId: parsed.activePresetId,
    };
  } catch {
    // Private mode, disabled storage, or corrupt JSON — fall back to defaults.
    return null;
  }
}

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(readPersisted, []);

  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(persisted?.currencyCode ?? 'INR');
  const [inputs, setInputs] = useState<CalculatorInputs>(persisted?.inputs ?? DEFAULT_INPUTS);
  const [activePresetId, setActivePresetId] = useState<string | undefined>(
    persisted ? persisted.activePresetId : 'student-2bhk',
  );
  const [loadedScenarioId, setLoadedScenarioId] = useState<string | undefined>();
  const [loadedScenarioName, setLoadedScenarioName] = useState<string | undefined>();

  const currency = CURRENCIES[currencyCode] ?? DEFAULT_CURRENCY;

  // Persist on every change so a refresh no longer discards the user's work.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currencyCode, inputs, activePresetId } satisfies PersistedState),
      );
    } catch {
      // Storage full or blocked — the app still works, it just won't remember.
    }
  }, [currencyCode, inputs, activePresetId]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    const next = CURRENCIES[code];
    if (!next) return;

    setCurrencyCode(code);
    setInputs((prev) => ({
      ...prev,
      rent: next.defaultRent,
      utilities: next.defaultUtilities,
      income: next.defaultIncome,
    }));
    setActivePresetId(undefined);
    setLoadedScenarioId(undefined);
    setLoadedScenarioName(undefined);
  }, []);

  const setInput = useCallback((field: keyof CalculatorInputs, value: number) => {
    setActivePresetId(undefined);
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  const applyPreset = useCallback((presetInputs: CalculatorInputs, presetId?: string) => {
    setInputs(presetInputs);
    setActivePresetId(presetId);
    setLoadedScenarioId(undefined);
    setLoadedScenarioName(undefined);
  }, []);

  const setPeopleCount = useCallback((peopleCount: number) => {
    setInputs((prev) => ({ ...prev, roommates: Math.max(0, peopleCount - 1) }));
    setActivePresetId(undefined);
  }, []);

  const reset = useCallback(() => {
    const c = CURRENCIES[currencyCode] ?? DEFAULT_CURRENCY;
    setInputs({
      rent: c.defaultRent,
      utilities: c.defaultUtilities,
      roommates: 2,
      income: c.defaultIncome,
      affordabilityTarget: 30,
    });
    setActivePresetId(currencyCode === 'INR' ? 'student-2bhk' : 'shared-2bed');
    setLoadedScenarioId(undefined);
    setLoadedScenarioName(undefined);
  }, [currencyCode]);

  const loadScenario = useCallback((scenario: SavedScenario) => {
    setCurrencyCode(scenario.currencyCode);
    setInputs(scenario.inputs);
    setActivePresetId(undefined);
    setLoadedScenarioId(scenario.id);
    setLoadedScenarioName(scenario.name);
  }, []);

  const clearLoadedScenario = useCallback(() => {
    setLoadedScenarioId(undefined);
    setLoadedScenarioName(undefined);
  }, []);

  const results = useMemo(() => calculateRentAffordability(inputs), [inputs]);

  const value = useMemo(
    () => ({
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
      loadScenario,
      clearLoadedScenario,
    }),
    [
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
      loadScenario,
      clearLoadedScenario,
    ],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
};

export function useCalculator(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculator must be used inside a CalculatorProvider');
  return ctx;
}
