import { randomBytes, createHash, randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Algorithm, hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { Prisma, User } from '@prisma/client';
import { profileCompleteness } from '@rentwise/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthResponseDto,
  AuthUserDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

const ARGON_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // 19 MiB — OWASP baseline for Argon2id
  timeCost: 2,
  parallelism: 1,
};

/**
 * A real Argon2id hash of a throwaway secret, computed once on first use.
 * Login verifies against this when the email is unknown, so a missing account
 * burns the same CPU as a wrong password and cannot be spotted by timing.
 * It must be a genuine hash — a malformed one would throw immediately and
 * reintroduce the very timing difference this is here to remove.
 */
let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= argonHash(randomBytes(32).toString('hex'), ARGON_OPTIONS);
  return dummyHashPromise;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ auth: AuthResponseDto; refreshToken: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await argonHash(dto.password, ARGON_OPTIONS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        // Every profile field is optional: an omitted one is stored as null and
        // simply sits out of the statistics until the user fills it in later.
        name: dto.name ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        occupation: dto.occupation ?? null,
        ageGroup: dto.ageGroup ?? null,
        monthlyIncome: dto.monthlyIncome ?? null,
        householdSize: dto.householdSize ?? null,
        ...(dto.defaultCurrency ? { defaultCurrency: dto.defaultCurrency } : {}),
      },
    });

    this.logger.log(`Registered user ${user.id}`);
    return this.issueTokens(user, randomUUID());
  }

  /**
   * Partial profile update. Only keys actually present on the DTO are written,
   * so omitting a field leaves it untouched; sending it as null clears it.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthUserDto> {
    const data: Prisma.UserUpdateInput = {};

    // Test against `undefined`, never `'key' in dto`: class-transformer
    // materialises every declared property on the DTO instance, so an `in`
    // check is true even for fields the client never sent — which would turn
    // "update my income" into "erase everything else".
    //   undefined -> field omitted, leave the stored value alone
    //   null      -> client explicitly cleared the field
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.occupation !== undefined) data.occupation = dto.occupation;
    if (dto.ageGroup !== undefined) data.ageGroup = dto.ageGroup;
    if (dto.monthlyIncome !== undefined) data.monthlyIncome = dto.monthlyIncome;
    if (dto.householdSize !== undefined) data.householdSize = dto.householdSize;
    if (dto.defaultCurrency) data.defaultCurrency = dto.defaultCurrency;

    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return this.toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<{ auth: AuthResponseDto; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always run a verification so the response time does not reveal whether
    // the account exists.
    const hashToCheck = user?.passwordHash ?? (await getDummyHash());
    const passwordMatches = await this.safeVerify(hashToCheck, dto.password);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user, randomUUID());
  }

  async refresh(rawToken: string | undefined): Promise<{ auth: AuthResponseDto; refreshToken: string }> {
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Replay of an already-rotated token means the cookie leaked. Burn the
    // whole rotation family so the attacker's copy is useless too.
    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(`Refresh token reuse detected for user ${stored.userId}; family revoked`);
      throw new UnauthorizedException('Refresh token has already been used');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user, stored.familyId);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findById(userId: string): Promise<AuthUserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toPublicUser(user) : null;
  }

  /** Removes expired and long-revoked rows. Safe to call from a cron. */
  async pruneExpiredTokens(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }

  private async issueTokens(
    user: User,
    familyId: string,
  ): Promise<{ auth: AuthResponseDto; refreshToken: string }> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = this.config.get<number>('REFRESH_TTL_DAYS', 30);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      auth: {
        accessToken,
        expiresIn: this.accessTtlSeconds(),
        user: this.toPublicUser(user),
      },
      refreshToken,
    };
  }

  private toPublicUser(user: User): AuthUserDto {
    const profile = {
      name: user.name,
      city: user.city,
      country: user.country,
      occupation: user.occupation,
      ageGroup: user.ageGroup,
      // Prisma returns Decimal; the API surface speaks plain numbers.
      monthlyIncome: user.monthlyIncome === null ? null : Number(user.monthlyIncome),
      householdSize: user.householdSize,
    };

    return {
      id: user.id,
      email: user.email,
      defaultCurrency: user.defaultCurrency,
      createdAt: user.createdAt,
      ...profile,
      profileCompletion: profileCompleteness(profile),
    };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async safeVerify(hash: string, password: string): Promise<boolean> {
    try {
      return await argonVerify(hash, password, ARGON_OPTIONS);
    } catch {
      // A malformed stored hash must read as "wrong password", never as a 500.
      return false;
    }
  }

  private accessTtlSeconds(): number {
    const ttl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) return 900;

    const value = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
    return value * multiplier;
  }
}
