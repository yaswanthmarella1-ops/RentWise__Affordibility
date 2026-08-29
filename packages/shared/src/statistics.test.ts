import { describe, expect, it } from 'vitest';
import { buildPortfolioStats, median, percentileOf, type StatScenario } from './statistics';
import { profileCompleteness } from './profile';

const scenario = (
  id: string,
  name: string,
  over: Partial<StatScenario['inputs']> = {},
  currencyCode = 'INR',
): StatScenario => ({
  id,
  name,
  currencyCode,
  inputs: {
    rent: 20000,
    utilities: 4000,
    roommates: 2,
    income: 50000,
    affordabilityTarget: 30,
    ...over,
  },
});

describe('buildPortfolioStats — aggregates', () => {
  it('returns an empty-but-valid shape with no scenarios', () => {
    const stats = buildPortfolioStats([], {});

    expect(stats.scenarioCount).toBe(0);
    expect(stats.cheapest).toBeNull();
    expect(stats.priciest).toBeNull();
    expect(stats.perPersonSpread).toBe(0);
    expect(stats.averages.perPersonCost).toBe(0);
    expect(stats.incomeAnalysis).toBeNull();
    expect(stats.householdFit).toBeNull();
  });

  it('averages cost, share and occupancy across scenarios', () => {
    const stats = buildPortfolioStats(
      [
        scenario('a', 'Cheap', { rent: 10000, utilities: 2000 }), // 12000 total, 4000 pp
        scenario('b', 'Pricey', { rent: 30000, utilities: 6000 }), // 36000 total, 12000 pp
      ],
      {},
    );

    expect(stats.scenarioCount).toBe(2);
    expect(stats.averages.monthlyHousingCost).toBe(24000);
    expect(stats.averages.perPersonCost).toBe(8000);
    expect(stats.averages.peopleCount).toBe(3);
  });

  it('identifies the cheapest and priciest by per-person share', () => {
    const stats = buildPortfolioStats(
      [
        scenario('a', 'Mid', { rent: 20000 }),
        scenario('b', 'Cheap', { rent: 10000, utilities: 2000 }),
        scenario('c', 'Pricey', { rent: 30000, utilities: 6000 }),
      ],
      {},
    );

    expect(stats.cheapest?.name).toBe('Cheap');
    expect(stats.priciest?.name).toBe('Pricey');
    expect(stats.perPersonSpread).toBe(8000); // 12000 - 4000
    expect(stats.annualSpread).toBe(96000);
  });

  it('counts each affordability verdict', () => {
    const stats = buildPortfolioStats(
      [
        scenario('a', 'Fine', { rent: 12000, utilities: 3000 }), // 30% exactly
        scenario('b', 'Tight', { rent: 13500, utilities: 3000 }), // 33%
        scenario('c', 'Bad', { rent: 20000, utilities: 4000 }), // 48%
      ],
      {},
    );

    expect(stats.statusBreakdown).toEqual({ affordable: 1, warning: 1, danger: 1 });
  });
});

describe('buildPortfolioStats — mixed currencies', () => {
  it('aggregates only the dominant currency and reports the exclusions', () => {
    const stats = buildPortfolioStats(
      [
        scenario('a', 'Bangalore', {}, 'INR'),
        scenario('b', 'Bengaluru', {}, 'INR'),
        scenario('c', 'London', { rent: 1800, utilities: 300, income: 4500 }, 'GBP'),
      ],
      {},
    );

    expect(stats.currencyCode).toBe('INR');
    expect(stats.excludedForCurrency).toBe(1);
    // The GBP figures must not pollute the INR average.
    expect(stats.averages.monthlyHousingCost).toBe(24000);
    expect(stats.scenarioCount).toBe(3);
  });
});

describe('buildPortfolioStats — income analysis (optional profile field)', () => {
  it('is null when no profile income is supplied', () => {
    expect(buildPortfolioStats([scenario('a', 'A')], {}).incomeAnalysis).toBeNull();
    expect(
      buildPortfolioStats([scenario('a', 'A')], { monthlyIncome: null }).incomeAnalysis,
    ).toBeNull();
  });

  it('is null for a non-positive income rather than dividing by it', () => {
    expect(
      buildPortfolioStats([scenario('a', 'A')], { monthlyIncome: 0 }).incomeAnalysis,
    ).toBeNull();
  });

  it('restates verdicts against the real income', () => {
    // Scenario assumes 50000 income => 24000/50000 = 48% => danger.
    // Real income 100000 => 24% => affordable.
    const stats = buildPortfolioStats([scenario('a', 'Flat')], { monthlyIncome: 100000 });

    expect(stats.incomeAnalysis).not.toBeNull();
    expect(stats.incomeAnalysis?.restatedBreakdown).toEqual({
      affordable: 1,
      warning: 0,
      danger: 0,
    });
    expect(stats.incomeAnalysis?.changedVerdict).toHaveLength(1);
    expect(stats.incomeAnalysis?.changedVerdict[0]).toMatchObject({
      name: 'Flat',
      from: 'danger',
      to: 'affordable',
    });
  });

  it('flags scenarios whose income assumption differs from the profile', () => {
    const stats = buildPortfolioStats(
      [scenario('a', 'Optimistic', { income: 80000 }), scenario('b', 'Realistic', { income: 50000 })],
      { monthlyIncome: 50000 },
    );

    const mismatched = stats.incomeAnalysis?.mismatchedScenarios ?? [];
    expect(mismatched).toHaveLength(1);
    expect(mismatched[0]).toMatchObject({ name: 'Optimistic', differenceFromProfile: 30000 });
  });

  it('reports no changed verdicts when the incomes already agree', () => {
    const stats = buildPortfolioStats([scenario('a', 'Flat')], { monthlyIncome: 50000 });

    expect(stats.incomeAnalysis?.changedVerdict).toHaveLength(0);
    expect(stats.incomeAnalysis?.mismatchedScenarios).toHaveLength(0);
  });

  it('tracks the highest per-person share that still clears the target', () => {
    const stats = buildPortfolioStats(
      [
        scenario('a', 'Cheap', { rent: 10000, utilities: 2000 }), // 12000 -> 12% of 100k
        scenario('b', 'Pricey', { rent: 60000, utilities: 6000 }), // 66000 -> 66% of 100k
      ],
      { monthlyIncome: 100000 },
    );

    // Only the cheap one clears 30%, and its share is 12000/3 = 4000.
    expect(stats.incomeAnalysis?.affordableCeiling).toBe(4000);
  });
});

describe('buildPortfolioStats — household fit (optional profile field)', () => {
  it('is null when no household size is supplied', () => {
    expect(buildPortfolioStats([scenario('a', 'A')], {}).householdFit).toBeNull();
  });

  it('separates matching from differing occupancy', () => {
    const stats = buildPortfolioStats(
      [
        scenario('a', 'Three', { roommates: 2 }), // 3 people
        scenario('b', 'Solo', { roommates: 0 }), // 1 person
      ],
      { householdSize: 3 },
    );

    expect(stats.householdFit?.matching).toBe(1);
    expect(stats.householdFit?.differing).toHaveLength(1);
    expect(stats.householdFit?.differing[0]).toMatchObject({ name: 'Solo', peopleCount: 1 });
  });
});

describe('profileCompleteness', () => {
  it('reports 0% for a fully empty profile', () => {
    const c = profileCompleteness({});

    expect(c.filledCount).toBe(0);
    expect(c.percent).toBe(0);
    expect(c.missing).toHaveLength(c.totalCount);
  });

  it('counts only fields that carry a real value', () => {
    const c = profileCompleteness({
      name: 'Jyothi',
      city: '',
      country: null,
      occupation: 'student',
      ageGroup: undefined,
      monthlyIncome: 50000,
      householdSize: null,
    });

    expect(c.filledCount).toBe(3);
    expect(c.missing.map((m) => m.key).sort()).toEqual([
      'ageGroup',
      'city',
      'country',
      'householdSize',
    ]);
  });

  it('reports 100% once every field is supplied', () => {
    const c = profileCompleteness({
      name: 'Jyothi',
      city: 'Bengaluru',
      country: 'India',
      occupation: 'salaried',
      ageGroup: '25_29',
      monthlyIncome: 50000,
      householdSize: 3,
    });

    expect(c.percent).toBe(100);
    expect(c.missing).toHaveLength(0);
  });

  it('explains what each missing field would unlock', () => {
    const c = profileCompleteness({});

    expect(c.missing.every((m) => m.unlocks.length > 0)).toBe(true);
  });
});

describe('median and percentileOf', () => {
  it('handles empty input without dividing by zero', () => {
    expect(median([])).toBe(0);
    expect(percentileOf(5, [])).toBe(0);
  });

  it('averages the two middle values for an even count', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('takes the middle value for an odd count', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('places a value within its population', () => {
    expect(percentileOf(30, [10, 20, 30, 40, 50])).toBe(60);
    expect(percentileOf(10, [10, 20, 30, 40, 50])).toBe(20);
    expect(percentileOf(50, [10, 20, 30, 40, 50])).toBe(100);
  });
});
