import type {
  CalculationResults,
  CalculatorInputs,
  CurrencyCode,
  PortfolioStats,
} from '@rentwise/shared';

export interface ProfileCompletionInfo {
  filledCount: number;
  totalCount: number;
  percent: number;
  missing: Array<{ key: string; label: string; unlocks: string }>;
}

export interface AuthUser {
  id: string;
  email: string;
  defaultCurrency: string;
  createdAt: string;
  // Optional profile — null when the user chose not to supply it.
  name: string | null;
  city: string | null;
  country: string | null;
  occupation: string | null;
  ageGroup: string | null;
  monthlyIncome: number | null;
  householdSize: number | null;
  profileCompletion: ProfileCompletionInfo;
}

/** Payload for PATCH /api/auth/me — every field optional. */
export interface ProfileUpdate {
  name?: string | null;
  city?: string | null;
  country?: string | null;
  occupation?: string | null;
  ageGroup?: string | null;
  monthlyIncome?: number | null;
  householdSize?: number | null;
  defaultCurrency?: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface SavedSplitMember {
  name: string;
  roomType: string | null;
  sharePercent: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  currencyCode: CurrencyCode;
  inputs: CalculatorInputs;
  splitMembers: SavedSplitMember[];
  results: CalculationResults;
  createdAt: string;
  updatedAt: string;
}

export interface SaveScenarioPayload extends CalculatorInputs {
  name: string;
  currencyCode: CurrencyCode;
  splitMembers?: Array<{ name: string; roomType?: string; sharePercent: number }>;
}

export interface CohortUnavailable {
  available: false;
  reason: 'no_city' | 'not_enough_peers';
  message: string;
  peersFound?: number;
  required?: number;
}

export interface CityCohort {
  city: string;
  currencyCode: string;
  sampleSize: number;
  medianHousingPercentage: number;
  medianPerPersonCost: number;
  yourPercentile: number | null;
  yourAveragePerPersonCost: number | null;
}

export interface StatsResponse {
  portfolio: PortfolioStats;
  profileCompletion: ProfileCompletionInfo;
  activeSignals: string[];
  cohort: CityCohort | CohortUnavailable;
}
