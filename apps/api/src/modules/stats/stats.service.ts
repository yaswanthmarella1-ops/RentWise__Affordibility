import { Injectable, NotFoundException } from '@nestjs/common';
import {
  buildPortfolioStats,
  calculateRentAffordability,
  median,
  percentileOf,
  profileCompleteness,
  type PortfolioStats,
  type StatScenario,
} from '@rentwise/shared';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Minimum number of *other* users required before a city cohort is reported.
 * Below this the "median" would describe one or two identifiable people, so the
 * comparison is withheld entirely rather than shown with a caveat.
 */
const MIN_COHORT_USERS = 5;

export interface CityCohort {
  city: string;
  currencyCode: string;
  /** Number of other users contributing — never fewer than MIN_COHORT_USERS. */
  sampleSize: number;
  medianHousingPercentage: number;
  medianPerPersonCost: number;
  /** Where this user's average share sits in the cohort, 0-100. */
  yourPercentile: number | null;
  yourAveragePerPersonCost: number | null;
}

export interface CohortUnavailable {
  available: false;
  reason: 'no_city' | 'not_enough_peers';
  message: string;
  /** Peers found so far, when the only problem is sample size. */
  peersFound?: number;
  required?: number;
}

export interface StatsResponse {
  portfolio: PortfolioStats;
  profileCompletion: ReturnType<typeof profileCompleteness>;
  /** Which optional profile fields are powering the analysis right now. */
  activeSignals: string[];
  cohort: CityCohort | CohortUnavailable;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<StatsResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { scenarios: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const profile = {
      name: user.name,
      city: user.city,
      country: user.country,
      occupation: user.occupation,
      ageGroup: user.ageGroup,
      monthlyIncome: user.monthlyIncome === null ? null : Number(user.monthlyIncome),
      householdSize: user.householdSize,
    };

    const scenarios: StatScenario[] = user.scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      currencyCode: s.currencyCode,
      inputs: {
        rent: Number(s.rent),
        utilities: Number(s.utilities),
        roommates: s.roommates,
        income: Number(s.income),
        affordabilityTarget: s.affordabilityTarget,
      },
    }));

    const portfolio = buildPortfolioStats(scenarios, profile, user.defaultCurrency);

    const activeSignals: string[] = [];
    if (profile.monthlyIncome !== null) activeSignals.push('monthlyIncome');
    if (profile.householdSize !== null) activeSignals.push('householdSize');
    if (profile.city) activeSignals.push('city');
    if (profile.occupation) activeSignals.push('occupation');
    if (profile.ageGroup) activeSignals.push('ageGroup');

    return {
      portfolio,
      profileCompletion: profileCompleteness(profile),
      activeSignals,
      cohort: await this.buildCityCohort(userId, user.city, portfolio),
    };
  }

  /**
   * Anonymous aggregate over other users renting in the same city and currency.
   * Only medians and a percentile are exposed — never another user's rows — and
   * nothing is returned at all until enough peers exist to keep it anonymous.
   */
  private async buildCityCohort(
    userId: string,
    city: string | null,
    portfolio: PortfolioStats,
  ): Promise<CityCohort | CohortUnavailable> {
    if (!city) {
      return {
        available: false,
        reason: 'no_city',
        message: 'Add your city to compare your housing costs with other renters there.',
      };
    }

    const peers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        city: { equals: city, mode: 'insensitive' },
        defaultCurrency: portfolio.currencyCode,
        scenarios: { some: {} },
      },
      select: {
        id: true,
        scenarios: {
          select: {
            rent: true,
            utilities: true,
            roommates: true,
            income: true,
            affordabilityTarget: true,
            currencyCode: true,
          },
        },
      },
    });

    if (peers.length < MIN_COHORT_USERS) {
      return {
        available: false,
        reason: 'not_enough_peers',
        message: `Not enough renters in ${city} yet to show an anonymous comparison. This unlocks at ${MIN_COHORT_USERS}.`,
        peersFound: peers.length,
        required: MIN_COHORT_USERS,
      };
    }

    // One data point per peer (their own average) so a user with many saved
    // scenarios cannot dominate the median.
    const peerShares: number[] = [];
    const peerPercentages: number[] = [];

    for (const peer of peers) {
      const relevant = peer.scenarios.filter((s) => s.currencyCode === portfolio.currencyCode);
      if (relevant.length === 0) continue;

      const results = relevant.map((s) =>
        calculateRentAffordability({
          rent: Number(s.rent),
          utilities: Number(s.utilities),
          roommates: s.roommates,
          income: Number(s.income),
          affordabilityTarget: s.affordabilityTarget,
        }),
      );

      peerShares.push(results.reduce((a, r) => a + r.perPersonCost, 0) / results.length);
      peerPercentages.push(results.reduce((a, r) => a + r.housingPercentage, 0) / results.length);
    }

    if (peerShares.length < MIN_COHORT_USERS) {
      return {
        available: false,
        reason: 'not_enough_peers',
        message: `Not enough comparable scenarios in ${city} yet. This unlocks at ${MIN_COHORT_USERS} renters.`,
        peersFound: peerShares.length,
        required: MIN_COHORT_USERS,
      };
    }

    const yourAverage = portfolio.scenarioCount > 0 ? portfolio.averages.perPersonCost : null;

    return {
      city,
      currencyCode: portfolio.currencyCode,
      sampleSize: peerShares.length,
      medianHousingPercentage: median(peerPercentages),
      medianPerPersonCost: median(peerShares),
      yourPercentile: yourAverage === null ? null : percentileOf(yourAverage, peerShares),
      yourAveragePerPersonCost: yourAverage,
    };
  }
}
