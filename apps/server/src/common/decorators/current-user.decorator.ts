/**
 * KALEN Server — Current User Decorator
 * Parameter decorator that extracts the authenticated identity from the request.
 * Must be used on routes protected by JwtAuthGuard.
 *
 * @example
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * getMe(@CurrentUser() identity: TokenPayload) { ... }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const identity = request.identity;

    if (data) {
      return identity?.[data];
    }

    return identity;
  },
);
