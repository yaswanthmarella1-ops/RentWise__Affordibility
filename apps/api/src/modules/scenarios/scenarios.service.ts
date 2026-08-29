import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Scenario, SplitMember } from '@prisma/client';
import {
  CURRENCIES,
  calculateRentAffordability,
  type CalculationResults,
  type CurrencyCode,
} from '@rentwise/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScenarioDto, SplitMemberDto, UpdateScenarioDto } from './dto/scenario.dto';

type ScenarioWithMembers = Scenario & { splitMembers: SplitMember[] };

export interface ScenarioResponse {
  id: string;
  name: string;
  currencyCode: CurrencyCode;
  inputs: {
    rent: number;
    utilities: number;
    roommates: number;
    income: number;
    affordabilityTarget: number;
  };
  splitMembers: Array<{ name: string; roomType: string | null; sharePercent: number }>;
  /** Derived on read from `inputs` — never persisted, so it cannot drift. */
  results: CalculationResults;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<ScenarioResponse[]> {
    const scenarios = await this.prisma.scenario.findMany({
      where: { userId },
      include: { splitMembers: { orderBy: { position: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });

    return scenarios.map((s) => this.toResponse(s));
  }

  async findOne(userId: string, id: string): Promise<ScenarioResponse> {
    return this.toResponse(await this.getOwned(userId, id));
  }

  async create(userId: string, dto: CreateScenarioDto): Promise<ScenarioResponse> {
    const scenario = await this.prisma.scenario.create({
      data: {
        userId,
        name: dto.name,
        currencyCode: dto.currencyCode,
        rent: dto.rent,
        utilities: dto.utilities,
        roommates: dto.roommates,
        income: dto.income,
        affordabilityTarget: dto.affordabilityTarget,
        splitMembers: {
          create: this.toMemberRows(dto.splitMembers),
        },
      },
      include: { splitMembers: { orderBy: { position: 'asc' } } },
    });

    return this.toResponse(scenario);
  }

  async update(userId: string, id: string, dto: UpdateScenarioDto): Promise<ScenarioResponse> {
    await this.getOwned(userId, id);

    const data: Prisma.ScenarioUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.currencyCode !== undefined) data.currencyCode = dto.currencyCode;
    if (dto.rent !== undefined) data.rent = dto.rent;
    if (dto.utilities !== undefined) data.utilities = dto.utilities;
    if (dto.roommates !== undefined) data.roommates = dto.roommates;
    if (dto.income !== undefined) data.income = dto.income;
    if (dto.affordabilityTarget !== undefined) data.affordabilityTarget = dto.affordabilityTarget;

    // Replacing the member list and updating the scenario must land together,
    // or a failed write could leave a scenario with no members at all.
    const scenario = await this.prisma.$transaction(async (tx) => {
      if (dto.splitMembers !== undefined) {
        await tx.splitMember.deleteMany({ where: { scenarioId: id } });
        await tx.splitMember.createMany({
          data: this.toMemberRows(dto.splitMembers).map((m) => ({ ...m, scenarioId: id })),
        });
      }

      return tx.scenario.update({
        where: { id },
        data,
        include: { splitMembers: { orderBy: { position: 'asc' } } },
      });
    });

    return this.toResponse(scenario);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    // Cascades to split_members via the FK.
    await this.prisma.scenario.delete({ where: { id } });
  }

  /**
   * Loads a scenario only if it belongs to `userId`. A scenario owned by
   * someone else raises 404 rather than 403 — a 403 would confirm that the id
   * exists and leak other users' data.
   */
  private async getOwned(userId: string, id: string): Promise<ScenarioWithMembers> {
    const scenario = await this.prisma.scenario.findFirst({
      where: { id, userId },
      include: { splitMembers: { orderBy: { position: 'asc' } } },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    return scenario;
  }

  private toMemberRows(members: SplitMemberDto[] | undefined) {
    return (members ?? []).map((m, index) => ({
      name: m.name,
      roomType: m.roomType ?? null,
      sharePercent: m.sharePercent,
      position: index,
    }));
  }

  private toResponse(scenario: ScenarioWithMembers): ScenarioResponse {
    const inputs = {
      rent: Number(scenario.rent),
      utilities: Number(scenario.utilities),
      roommates: scenario.roommates,
      income: Number(scenario.income),
      affordabilityTarget: scenario.affordabilityTarget,
    };

    const currencyCode = (
      scenario.currencyCode in CURRENCIES ? scenario.currencyCode : 'INR'
    ) as CurrencyCode;

    return {
      id: scenario.id,
      name: scenario.name,
      currencyCode,
      inputs,
      splitMembers: scenario.splitMembers.map((m) => ({
        name: m.name,
        roomType: m.roomType,
        sharePercent: Number(m.sharePercent),
      })),
      // Same engine the browser runs, so saved scenarios can never disagree
      // with what the calculator shows.
      results: calculateRentAffordability(inputs),
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
    };
  }
}
