import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  AuthUserDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

export const REFRESH_COOKIE = 'rentwise_refresh';

/**
 * Readable companion to the httpOnly refresh cookie. Holds no secret — it only
 * tells the SPA that a session may exist, so a guest does not fire a refresh
 * request (and log a 401) on every page load. Authorization never consults it.
 */
export const SESSION_HINT_COOKIE = 'rentwise_session';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create an account and sign in' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { auth, refreshToken } = await this.auth.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return auth;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { auth, refreshToken } = await this.auth.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return auth;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotate the refresh cookie for a fresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    try {
      const { auth, refreshToken } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]);
      this.setRefreshCookie(res, refreshToken);
      return auth;
    } catch (error) {
      // A rejected refresh means the cookie is useless — clear it so the
      // browser stops replaying a token that will never work again.
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearRefreshCookie(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the signed-in user and their optional profile' })
  @ApiResponse({ status: 200, type: AuthUserDto })
  async me(@CurrentUser('id') userId: string): Promise<AuthUserDto> {
    const user = await this.auth.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the optional profile',
    description:
      'Every field is optional. Omitted fields are left unchanged; explicit nulls clear them.',
  })
  @ApiResponse({ status: 200, type: AuthUserDto })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthUserDto> {
    return this.auth.updateProfile(userId, dto);
  }

  private cookieOptions(): CookieOptions {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      // Scope the cookie to the refresh/logout routes so it is not attached to
      // every API call.
      path: '/api/auth',
      ...(isProd ? { domain: this.config.get<string>('COOKIE_DOMAIN') } : {}),
    };
  }

  private setRefreshCookie(res: Response, token: string): void {
    const ttlDays = this.config.get<number>('REFRESH_TTL_DAYS', 30);
    const maxAge = ttlDays * 24 * 60 * 60 * 1000;
    const base = this.cookieOptions();

    res.cookie(REFRESH_COOKIE, token, { ...base, maxAge });

    // Path '/' and httpOnly:false so the SPA can read it from any route.
    res.cookie(SESSION_HINT_COOKIE, '1', {
      ...base,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const base = this.cookieOptions();

    res.clearCookie(REFRESH_COOKIE, base);
    res.clearCookie(SESSION_HINT_COOKIE, {
      ...base,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
  }
}
