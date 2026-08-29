import {
  CalculatorInputs,
  CalculationResults,
  RoommateComparisonRow,
  SmartInsight,
  Currency,
  AffordabilityStatus
} from './types/calculator';
import { formatCurrency, formatPercent } from './formatters';

export function calculateRentAffordability(inputs: CalculatorInputs): CalculationResults {
  const rent = Math.max(0, inputs.rent || 0);
  const utilities = Math.max(0, inputs.utilities || 0);
  const roommates = Math.max(0, Math.floor(inputs.roommates || 0));
  const income = Math.max(1, inputs.income || 1);
  const affordabilityTarget = Math.min(100, Math.max(1, inputs.affordabilityTarget || 30));

  const totalRent = rent;
  const totalUtilities = utilities;
  const totalHousingCost = totalRent + totalUtilities;
  
  // Total people is User + Roommates
  const peopleCount = roommates + 1;
  const perPersonCost = peopleCount > 0 ? totalHousingCost / peopleCount : totalHousingCost;
  const perPersonRent = peopleCount > 0 ? totalRent / peopleCount : totalRent;
  const perPersonUtilities = peopleCount > 0 ? totalUtilities / peopleCount : totalUtilities;

  const housingPercentage = (totalHousingCost / income) * 100;
  
  let status: AffordabilityStatus = 'affordable';
  let statusTitle = '✓ Affordable';
  let statusDescription = `Your housing cost is ${formatPercent(housingPercentage, 1)} of your monthly income, which is within your ${affordabilityTarget}% target.`;

  if (housingPercentage > affordabilityTarget + 5) {
    status = 'danger';
    statusTitle = '⚠️ Above Target';
    statusDescription = `Your housing cost is ${formatPercent(housingPercentage, 1)} of your monthly income, which is above your ${affordabilityTarget}% target.`;
  } else if (housingPercentage > affordabilityTarget) {
    status = 'warning';
    statusTitle = '⚠️ Close to Limit';
    statusDescription = `Your housing cost is ${formatPercent(housingPercentage, 1)} of your monthly income, just slightly over your ${affordabilityTarget}% target.`;
  }

  const maxHousingBudget = income * (affordabilityTarget / 100);
  const maxAffordableRent = maxHousingBudget - totalUtilities;
  const isMaxRentNegative = maxAffordableRent < 0;
  const budgetDifference = totalHousingCost - maxHousingBudget;

  const annualTotalCost = totalHousingCost * 12;
  const annualPerPersonCost = perPersonCost * 12;

  // Additional roommate savings
  const costWithOneMore = totalHousingCost / (peopleCount + 1);
  const savingsFromOneMoreRoommate = perPersonCost - costWithOneMore;
  const annualSavingsFromOneMoreRoommate = savingsFromOneMoreRoommate * 12;

  // Required monthly income to make current total housing cost equal the target percentage
  const requiredIncomeForTarget = (totalHousingCost / (affordabilityTarget / 100));

  const soloHousingCost = totalHousingCost;

  return {
    totalRent,
    totalUtilities,
    totalHousingCost,
    peopleCount,
    perPersonCost,
    perPersonRent,
    perPersonUtilities,
    housingPercentage,
    affordabilityTarget,
    status,
    statusTitle,
    statusDescription,
    maxHousingBudget,
    maxAffordableRent,
    isMaxRentNegative,
    budgetDifference,
    annualTotalCost,
    annualPerPersonCost,
    savingsFromOneMoreRoommate,
    annualSavingsFromOneMoreRoommate,
    requiredIncomeForTarget,
    soloHousingCost,
  };
}

export function generateRoommateComparisons(
  rent: number,
  utilities: number,
  currentPeopleCount: number,
  income: number
): RoommateComparisonRow[] {
  const totalCost = Math.max(0, rent) + Math.max(0, utilities);
  const soloCost = totalCost;
  const comparisons: RoommateComparisonRow[] = [];

  for (let count = 1; count <= 6; count++) {
    const perPerson = totalCost / count;
    const perPersonRent = rent / count;
    const perPersonUtils = utilities / count;
    const annual = perPerson * 12;
    const monthlySavings = soloCost - perPerson;
    const annualSavings = monthlySavings * 12;
    const pctOfIncome = income > 0 ? (perPerson / income) * 100 : 0;

    let label = `${count} Person`;
    if (count === 1) label = '1 Person (Solo)';
    else label = `${count} People (${count - 1} Roommate${count > 2 ? 's' : ''})`;

    comparisons.push({
      peopleCount: count,
      label,
      perPersonCost: perPerson,
      perPersonRent: perPersonRent,
      perPersonUtilities: perPersonUtils,
      annualCost: annual,
      monthlySavingsVsSolo: monthlySavings,
      annualSavingsVsSolo: annualSavings,
      percentageOfIncome: pctOfIncome,
      isCurrent: count === currentPeopleCount,
    });
  }

  return comparisons;
}

export function generateSmartInsights(
  inputs: CalculatorInputs,
  results: CalculationResults,
  currency: Currency
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // Insight 1: Budget Target Analysis
  if (results.budgetDifference > 0) {
    insights.push({
      id: 'budget-gap',
      type: 'budget',
      title: 'Target Budget Overrun',
      valueText: `+${formatCurrency(results.budgetDifference, currency)}`,
      description: `Your monthly housing cost is ${formatCurrency(results.budgetDifference, currency)} above your target ${inputs.affordabilityTarget}% budget limit (${formatCurrency(results.maxHousingBudget, currency)}/mo).`,
      sentiment: 'warning',
    });
  } else {
    insights.push({
      id: 'budget-surplus',
      type: 'budget',
      title: 'Healthy Budget Buffer',
      valueText: `${formatCurrency(Math.abs(results.budgetDifference), currency)} under`,
      description: `Your housing cost is ${formatCurrency(Math.abs(results.budgetDifference), currency)} under your maximum ${inputs.affordabilityTarget}% budget of ${formatCurrency(results.maxHousingBudget, currency)}/mo.`,
      sentiment: 'positive',
    });
  }

  // Insight 2: Roommate Leverage / Savings
  if (results.savingsFromOneMoreRoommate > 0) {
    insights.push({
      id: 'roommate-savings',
      type: 'roommate',
      title: 'Additional Roommate Savings',
      valueText: `Save ${formatCurrency(results.savingsFromOneMoreRoommate, currency)}/mo`,
      description: `Adding one more roommate would reduce your share from ${formatCurrency(results.perPersonCost, currency)} to ${formatCurrency(results.perPersonCost - results.savingsFromOneMoreRoommate, currency)}/mo — saving you ${formatCurrency(results.annualSavingsFromOneMoreRoommate, currency)} annually!`,
      sentiment: 'positive',
    });
  }

  // Insight 3: Income Threshold
  insights.push({
    id: 'income-target',
    type: 'income',
    title: 'Recommended Income Target',
    valueText: `${formatCurrency(results.requiredIncomeForTarget, currency)}/mo`,
    description: `To comfortably afford this apartment while keeping housing costs at or below your ${inputs.affordabilityTarget}% target, a monthly income of ${formatCurrency(results.requiredIncomeForTarget, currency)} is recommended.`,
    sentiment: 'neutral',
  });

  // Insight 4: Income Usage Breakdown
  insights.push({
    id: 'income-usage',
    type: 'savings',
    title: 'Income Allocation',
    valueText: `${formatPercent(results.housingPercentage, 1)} of income`,
    description: `Your current total monthly housing cost consumes ${formatPercent(results.housingPercentage, 1)} of your monthly income (${formatCurrency(inputs.income, currency)}).`,
    sentiment: results.status === 'affordable' ? 'positive' : results.status === 'warning' ? 'warning' : 'negative',
  });

  // Insight 5: Standard 50/30/20 Guideline
  insights.push({
    id: 'financial-rule',
    type: 'advice',
    title: '50/30/20 Budgeting Principle',
    valueText: 'Needs ≤ 50%',
    description: `Financial experts recommend keeping total essential needs (housing, utilities, groceries, transport) under 50% of take-home pay, leaving 30% for wants and 20% for savings.`,
    sentiment: 'neutral',
  });

  return insights;
}

export function validateInputs(inputs: CalculatorInputs): {
  errors: Record<string, string>;
  isValid: boolean;
} {
  const errors: Record<string, string> = {};

  if (!inputs.rent || inputs.rent <= 0) {
    errors.rent = 'Rent must be greater than 0';
  }
  if (inputs.utilities < 0) {
    errors.utilities = 'Utilities cannot be negative';
  }
  if (inputs.roommates < 0) {
    errors.roommates = 'Roommates cannot be negative';
  }
  if (!inputs.income || inputs.income <= 0) {
    errors.income = 'Income must be greater than 0';
  }
  if (!inputs.affordabilityTarget || inputs.affordabilityTarget < 1 || inputs.affordabilityTarget > 100) {
    errors.affordabilityTarget = 'Affordability percentage must be between 1% and 100%';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
