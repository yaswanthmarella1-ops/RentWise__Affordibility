import { describe, expect, it } from 'vitest';
import {
  calculateRentAffordability,
  generateRoommateComparisons,
  generateSmartInsights,
  validateInputs,
} from './calculations';
import { CURRENCIES } from './currencies';
import type { CalculatorInputs } from './types/calculator';

const base: CalculatorInputs = {
  rent: 20000,
  utilities: 4000,
  roommates: 2,
  income: 50000,
  affordabilityTarget: 30,
};

const inputs = (over: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
  ...base,
  ...over,
});

describe('calculateRentAffordability — core split math', () => {
  it('splits total housing cost across roommates + self', () => {
    const r = calculateRentAffordability(base);

    expect(r.totalHousingCost).toBe(24000);
    expect(r.peopleCount).toBe(3); // 2 roommates + you
    expect(r.perPersonCost).toBe(8000);
    expect(r.perPersonRent).toBeCloseTo(20000 / 3, 6);
    expect(r.perPersonUtilities).toBeCloseTo(4000 / 3, 6);
  });

  it('treats zero roommates as living solo', () => {
    const r = calculateRentAffordability(inputs({ roommates: 0 }));

    expect(r.peopleCount).toBe(1);
    expect(r.perPersonCost).toBe(r.totalHousingCost);
    expect(r.soloHousingCost).toBe(24000);
  });

  it('derives annual figures as 12x monthly', () => {
    const r = calculateRentAffordability(base);

    expect(r.annualTotalCost).toBe(24000 * 12);
    expect(r.annualPerPersonCost).toBe(8000 * 12);
  });

  it('computes the saving from adding one more roommate', () => {
    const r = calculateRentAffordability(base);

    // 24000/3 = 8000 now, 24000/4 = 6000 with one more
    expect(r.savingsFromOneMoreRoommate).toBe(2000);
    expect(r.annualSavingsFromOneMoreRoommate).toBe(24000);
  });

  it('floors fractional roommate counts', () => {
    expect(calculateRentAffordability(inputs({ roommates: 2.9 })).peopleCount).toBe(3);
  });
});

describe('calculateRentAffordability — affordability status thresholds', () => {
  it('is affordable exactly at the target boundary', () => {
    // 12000 + 3000 = 15000 = exactly 30% of 50000
    const r = calculateRentAffordability(inputs({ rent: 12000, utilities: 3000 }));

    expect(r.housingPercentage).toBe(30);
    expect(r.status).toBe('affordable');
  });

  it('warns when over target but within 5 points', () => {
    // 16500 / 50000 = 33%
    const r = calculateRentAffordability(inputs({ rent: 13500, utilities: 3000 }));

    expect(r.housingPercentage).toBe(33);
    expect(r.status).toBe('warning');
  });

  it('is still a warning exactly at target + 5', () => {
    // 17500 / 50000 = 35% — boundary is `> target + 5`, so 35 stays a warning
    const r = calculateRentAffordability(inputs({ rent: 14500, utilities: 3000 }));

    expect(r.housingPercentage).toBe(35);
    expect(r.status).toBe('warning');
  });

  it('flags danger beyond target + 5', () => {
    // 24000 / 50000 = 48%
    const r = calculateRentAffordability(base);

    expect(r.housingPercentage).toBe(48);
    expect(r.status).toBe('danger');
  });

  it('respects a custom affordability target', () => {
    // 48% against a 50% target is comfortably affordable
    const r = calculateRentAffordability(inputs({ affordabilityTarget: 50 }));

    expect(r.status).toBe('affordable');
    expect(r.affordabilityTarget).toBe(50);
  });
});

describe('calculateRentAffordability — budget ceiling', () => {
  it('computes max affordable rent as budget minus utilities', () => {
    const r = calculateRentAffordability(base);

    expect(r.maxHousingBudget).toBe(15000); // 30% of 50000
    expect(r.maxAffordableRent).toBe(11000); // 15000 - 4000
    expect(r.isMaxRentNegative).toBe(false);
    expect(r.budgetDifference).toBe(9000); // 24000 over a 15000 budget
  });

  it('reports a deficit when utilities alone exceed the housing budget', () => {
    const r = calculateRentAffordability(inputs({ utilities: 20000 }));

    expect(r.maxAffordableRent).toBe(-5000);
    expect(r.isMaxRentNegative).toBe(true);
  });

  it('reports a negative budget difference when under budget', () => {
    const r = calculateRentAffordability(inputs({ rent: 8000, utilities: 2000 }));

    expect(r.budgetDifference).toBe(-5000); // 10000 against a 15000 budget
  });

  it('computes the income required to hit the target', () => {
    const r = calculateRentAffordability(base);

    expect(r.requiredIncomeForTarget).toBe(80000); // 24000 / 0.30
  });
});

describe('calculateRentAffordability — hostile input clamping', () => {
  it('never divides by zero income', () => {
    const r = calculateRentAffordability(inputs({ income: 0 }));

    expect(Number.isFinite(r.housingPercentage)).toBe(true);
    expect(Number.isNaN(r.housingPercentage)).toBe(false);
    expect(r.maxHousingBudget).toBeGreaterThanOrEqual(0);
  });

  it('clamps negative rent and utilities to zero', () => {
    const r = calculateRentAffordability(inputs({ rent: -5000, utilities: -100 }));

    expect(r.totalRent).toBe(0);
    expect(r.totalUtilities).toBe(0);
    expect(r.totalHousingCost).toBe(0);
  });

  it('clamps negative roommate counts to solo occupancy', () => {
    expect(calculateRentAffordability(inputs({ roommates: -3 })).peopleCount).toBe(1);
  });

  it('clamps the affordability target into 1..100', () => {
    expect(calculateRentAffordability(inputs({ affordabilityTarget: 250 })).affordabilityTarget).toBe(100);
    // -10 is truthy, so it survives the `|| 30` default and clamps up to the floor of 1
    expect(calculateRentAffordability(inputs({ affordabilityTarget: -10 })).affordabilityTarget).toBe(1);
  });

  it('falls back to a 30% target when the target is zero', () => {
    // 0 is falsy, so it takes the `|| 30` default rather than clamping to 1
    expect(calculateRentAffordability(inputs({ affordabilityTarget: 0 })).affordabilityTarget).toBe(30);
  });

  it('produces finite numbers for every field on degenerate input', () => {
    const r = calculateRentAffordability({
      rent: 0,
      utilities: 0,
      roommates: 0,
      income: 0,
      affordabilityTarget: 0,
    });

    for (const [key, value] of Object.entries(r)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value), `${key} should be finite`).toBe(true);
      }
    }
  });
});

describe('generateRoommateComparisons', () => {
  it('returns one row per occupancy from 1 to 6', () => {
    const rows = generateRoommateComparisons(20000, 4000, 3, 50000);

    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.peopleCount)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('shows zero savings for the solo row and rising savings after', () => {
    const rows = generateRoommateComparisons(20000, 4000, 3, 50000);

    expect(rows[0].perPersonCost).toBe(24000);
    expect(rows[0].monthlySavingsVsSolo).toBe(0);
    expect(rows[1].monthlySavingsVsSolo).toBe(12000);
    expect(rows[2].monthlySavingsVsSolo).toBe(16000);
    expect(rows[2].annualSavingsVsSolo).toBe(16000 * 12);
  });

  it('marks exactly one row as current', () => {
    const rows = generateRoommateComparisons(20000, 4000, 3, 50000);
    const current = rows.filter((r) => r.isCurrent);

    expect(current).toHaveLength(1);
    expect(current[0].peopleCount).toBe(3);
  });

  it('marks no row current when occupancy is outside the 1..6 range', () => {
    expect(generateRoommateComparisons(20000, 4000, 9, 50000).some((r) => r.isCurrent)).toBe(false);
  });

  it('pluralises labels correctly', () => {
    const rows = generateRoommateComparisons(20000, 4000, 1, 50000);

    expect(rows[0].label).toBe('1 Person (Solo)');
    expect(rows[1].label).toBe('2 People (1 Roommate)');
    expect(rows[2].label).toBe('3 People (2 Roommates)');
  });

  it('does not divide by zero income', () => {
    const rows = generateRoommateComparisons(20000, 4000, 3, 0);

    rows.forEach((r) => expect(Number.isFinite(r.percentageOfIncome)).toBe(true));
  });
});

describe('generateSmartInsights', () => {
  const currency = CURRENCIES.INR;

  it('reports a budget overrun when over the target', () => {
    const results = calculateRentAffordability(base);
    const ids = generateSmartInsights(base, results, currency).map((i) => i.id);

    expect(ids).toContain('budget-gap');
    expect(ids).not.toContain('budget-surplus');
  });

  it('reports a surplus when under the target', () => {
    const cheap = inputs({ rent: 8000, utilities: 2000 });
    const ids = generateSmartInsights(cheap, calculateRentAffordability(cheap), currency).map((i) => i.id);

    expect(ids).toContain('budget-surplus');
    expect(ids).not.toContain('budget-gap');
  });

  it('omits roommate savings when there is nothing left to save', () => {
    const free = inputs({ rent: 0, utilities: 0 });
    const ids = generateSmartInsights(free, calculateRentAffordability(free), currency).map((i) => i.id);

    expect(ids).not.toContain('roommate-savings');
  });

  it('always includes the income target and budgeting guidance', () => {
    const ids = generateSmartInsights(base, calculateRentAffordability(base), currency).map((i) => i.id);

    expect(ids).toContain('income-target');
    expect(ids).toContain('income-usage');
    expect(ids).toContain('financial-rule');
  });
});

describe('validateInputs', () => {
  it('accepts a well-formed scenario', () => {
    const { isValid, errors } = validateInputs(base);

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  it('rejects non-positive rent and income', () => {
    const { errors, isValid } = validateInputs(inputs({ rent: 0, income: 0 }));

    expect(isValid).toBe(false);
    expect(errors.rent).toBeDefined();
    expect(errors.income).toBeDefined();
  });

  it('rejects negative utilities and roommates', () => {
    const { errors } = validateInputs(inputs({ utilities: -1, roommates: -1 }));

    expect(errors.utilities).toBeDefined();
    expect(errors.roommates).toBeDefined();
  });

  it('rejects an out-of-range affordability target', () => {
    expect(validateInputs(inputs({ affordabilityTarget: 0 })).errors.affordabilityTarget).toBeDefined();
    expect(validateInputs(inputs({ affordabilityTarget: 101 })).errors.affordabilityTarget).toBeDefined();
  });

  it('allows zero utilities and zero roommates', () => {
    expect(validateInputs(inputs({ utilities: 0, roommates: 0 })).isValid).toBe(true);
  });
});
