import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: Record<string, unknown>;
}

/**
 * Extract the authenticated user from the request object.
 * Usage: @CurrentUser() user  or  @CurrentUser('id') userId
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
