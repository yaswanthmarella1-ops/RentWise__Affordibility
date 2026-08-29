export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'AED';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  step: number;
  defaultRent: number;
  defaultUtilities: number;
  defaultIncome: number;
}

export interface CalculatorInputs {
  rent: number;
  utilities: number;
  roommates: number; // Number of roommates living with you (excluding you)
  income: number;
  affordabilityTarget: number; // Target percentage e.g. 30%
}

export type AffordabilityStatus = 'affordable' | 'warning' | 'danger';

export interface CalculationResults {
  totalRent: number;
  totalUtilities: number;
  totalHousingCost: number;
  peopleCount: number; // roommates + 1
  perPersonCost: number;
  perPersonRent: number;
  perPersonUtilities: number;
  housingPercentage: number;
  affordabilityTarget: number;
  status: AffordabilityStatus;
  statusTitle: string;
  statusDescription: string;
  maxHousingBudget: number;
  maxAffordableRent: number;
  isMaxRentNegative: boolean;
  budgetDifference: number; // positive = over budget, negative = under budget
  annualTotalCost: number;
  annualPerPersonCost: number;
  savingsFromOneMoreRoommate: number;
  annualSavingsFromOneMoreRoommate: number;
  requiredIncomeForTarget: number;
  soloHousingCost: number;
}

export interface RoommateComparisonRow {
  peopleCount: number;
  label: string;
  perPersonCost: number;
  perPersonRent: number;
  perPersonUtilities: number;
  annualCost: number;
  monthlySavingsVsSolo: number;
  annualSavingsVsSolo: number;
  percentageOfIncome: number;
  isCurrent: boolean;
}

export interface CustomRoommate {
  id: string;
  name: string;
  sharePercent: number;
  customAmount: number;
  roomType?: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  inputs: CalculatorInputs;
}

export interface SmartInsight {
  id: string;
  type: 'budget' | 'roommate' | 'savings' | 'income' | 'advice';
  title: string;
  valueText: string;
  description: string;
  sentiment: 'positive' | 'warning' | 'negative' | 'neutral';
}
