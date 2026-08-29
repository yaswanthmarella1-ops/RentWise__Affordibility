import { calculateRentAffordability } from './calculations';
import type { AffordabilityStatus, CalculatorInputs } from './types/calculator';
import type { UserProfile } from './profile';

/**
 * Portfolio analytics over a user's saved scenarios.
 *
 * Everything here is derived from data the user actually entered — their own
 * scenarios and whatever optional profile fields they chose to fill in. No
 * field is invented, and every section that depends on an optional profile
 * value returns `null` (with a reason) when that value is absent, rather than
 * guessing at it.
 */

export interface StatScenario {
  id: string;
  name: string;
  currencyCode: string;
  inputs: CalculatorInputs;
}

export interface ScenarioSummary {
  id: string;
  name: string;
  perPersonCost: number;
  totalHousingCost: number;
  housingPercentage: number;
  peopleCount: number;
  status: AffordabilityStatus;
}

export interface IncomeAnalysis {
  /** The profile income every scenario was re-scored against. */
  profileMonthlyIncome: number;
  /** Scenarios whose own income assumption differs from the profile income. */
  mismatchedScenarios: Array<{
    id: string;
    name: string;
    scenarioIncome: number;
    differenceFromProfile: number;
  }>;
  /** Status recomputed against the profile income instead of the scenario's. */
  restatedBreakdown: Record<AffordabilityStatus, number>;
  /** Scenarios that change verdict once the real income is applied. */
  changedVerdict: Array<{
    id: string;
    name: string;
    from: AffordabilityStatus;
    to: AffordabilityStatus;
  }>;
  /** Highest per-person cost that stays within the target on the real income. */
  affordableCeiling: number;
}

export interface HouseholdFit {
  profileHouseholdSize: number;
  matching: number;
  differing: Array<{ id: string; name: string; peopleCount: number }>;
}

export interface PortfolioStats {
  scenarioCount: number;
  /** Currency the stats are expressed in (the most common across scenarios). */
  currencyCode: string;
  /** Scenarios excluded from the aggregate because they use another currency. */
  excludedForCurrency: number;

  averages: {
    monthlyHousingCost: number;
    perPersonCost: number;
    housingPercentage: number;
    peopleCount: number;
    affordabilityTarget: number;
  };

  statusBreakdown: Record<AffordabilityStatus, number>;

  cheapest: ScenarioSummary | null;
  priciest: ScenarioSummary | null;
  /** Monthly gap between the cheapest and priciest per-person share. */
  perPersonSpread: number;
  annualSpread: number;

  /** Null until a profile monthly income is supplied. */
  incomeAnalysis: IncomeAnalysis | null;
  /** Null until a profile household size is supplied. */
  householdFit: HouseholdFit | null;
}

function summarise(scenario: StatScenario): ScenarioSummary {
  const r = calculateRentAffordability(scenario.inputs);

  return {
    id: scenario.id,
    name: scenario.name,
    perPersonCost: r.perPersonCost,
    totalHousingCost: r.totalHousingCost,
    housingPercentage: r.housingPercentage,
    peopleCount: r.peopleCount,
    status: r.status,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Most frequently used currency across the scenarios; ties break to the first. */
function dominantCurrency(scenarios: StatScenario[], fallback: string): string {
  const counts = new Map<string, number>();
  for (const s of scenarios) {
    counts.set(s.currencyCode, (counts.get(s.currencyCode) ?? 0) + 1);
  }

  let best = fallback;
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

export function buildPortfolioStats(
  scenarios: StatScenario[],
  profile: Partial<UserProfile>,
  fallbackCurrency = 'INR',
): PortfolioStats {
  const currencyCode = dominantCurrency(scenarios, fallbackCurrency);

  // Mixing currencies in an average would produce a meaningless number, so the
  // aggregate covers only the dominant currency and reports what it left out.
  const inScope = scenarios.filter((s) => s.currencyCode === currencyCode);
  const excludedForCurrency = scenarios.length - inScope.length;

  const summaries = inScope.map(summarise);

  const statusBreakdown: Record<AffordabilityStatus, number> = {
    affordable: 0,
    warning: 0,
    danger: 0,
  };
  for (const s of summaries) statusBreakdown[s.status] += 1;

  const sortedByShare = [...summaries].sort((a, b) => a.perPersonCost - b.perPersonCost);
  const cheapest = sortedByShare[0] ?? null;
  const priciest = sortedByShare[sortedByShare.length - 1] ?? null;
  const perPersonSpread =
    cheapest && priciest ? priciest.perPersonCost - cheapest.perPersonCost : 0;

  return {
    scenarioCount: scenarios.length,
    currencyCode,
    excludedForCurrency,

    averages: {
      monthlyHousingCost: mean(summaries.map((s) => s.totalHousingCost)),
      perPersonCost: mean(summaries.map((s) => s.perPersonCost)),
      housingPercentage: mean(summaries.map((s) => s.housingPercentage)),
      peopleCount: mean(summaries.map((s) => s.peopleCount)),
      affordabilityTarget: mean(inScope.map((s) => s.inputs.affordabilityTarget)),
    },

    statusBreakdown,
    cheapest,
    priciest,
    perPersonSpread,
    annualSpread: perPersonSpread * 12,

    incomeAnalysis: buildIncomeAnalysis(inScope, summaries, profile),
    householdFit: buildHouseholdFit(summaries, profile),
  };
}

function buildIncomeAnalysis(
  scenarios: StatScenario[],
  summaries: ScenarioSummary[],
  profile: Partial<UserProfile>,
): IncomeAnalysis | null {
  const income = profile.monthlyIncome;
  if (income === null || income === undefined || income <= 0) return null;
  if (scenarios.length === 0) return null;

  const restatedBreakdown: Record<AffordabilityStatus, number> = {
    affordable: 0,
    warning: 0,
    danger: 0,
  };
  const changedVerdict: IncomeAnalysis['changedVerdict'] = [];
  const mismatchedScenarios: IncomeAnalysis['mismatchedScenarios'] = [];
  let affordableCeiling = 0;

  scenarios.forEach((scenario, i) => {
    const original = summaries[i];

    // Re-run the same engine with the profile's real income in place of the
    // one stored on the scenario.
    const restated = calculateRentAffordability({ ...scenario.inputs, income });
    restatedBreakdown[restated.status] += 1;

    if (restated.status !== original.status) {
      changedVerdict.push({
        id: scenario.id,
        name: scenario.name,
        from: original.status,
        to: restated.status,
      });
    }

    if (Math.abs(scenario.inputs.income - income) > 0.5) {
      mismatchedScenarios.push({
        id: scenario.id,
        name: scenario.name,
        scenarioIncome: scenario.inputs.income,
        differenceFromProfile: scenario.inputs.income - income,
      });
    }

    if (restated.status === 'affordable') {
      affordableCeiling = Math.max(affordableCeiling, restated.perPersonCost);
    }
  });

  return {
    profileMonthlyIncome: income,
    mismatchedScenarios,
    restatedBreakdown,
    changedVerdict,
    affordableCeiling,
  };
}

function buildHouseholdFit(
  summaries: ScenarioSummary[],
  profile: Partial<UserProfile>,
): HouseholdFit | null {
  const size = profile.householdSize;
  if (size === null || size === undefined || size <= 0) return null;
  if (summaries.length === 0) return null;

  const differing = summaries
    .filter((s) => s.peopleCount !== size)
    .map((s) => ({ id: s.id, name: s.name, peopleCount: s.peopleCount }));

  return {
    profileHouseholdSize: size,
    matching: summaries.length - differing.length,
    differing,
  };
}

/** Median of a numeric list. Returns 0 for an empty list. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Where `value` sits within `population`, as a 0-100 percentile.
 * Uses the "percentage of values at or below" definition.
 */
export function percentileOf(value: number, population: number[]): number {
  if (population.length === 0) return 0;

  const atOrBelow = population.filter((v) => v <= value).length;
  return Math.round((atOrBelow / population.length) * 100);
}
