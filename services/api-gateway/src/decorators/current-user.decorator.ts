import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthPayload } from '@truck-shipping/shared-types';

import type { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Extract the current authenticated user from the request.
 * Usage: @CurrentUser() user: AuthPayload
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
