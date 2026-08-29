import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

/**
 * Injects the authenticated user resolved by JwtStrategy.validate().
 * Only valid on routes behind JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: RequestUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
