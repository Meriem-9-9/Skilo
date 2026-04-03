// auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — injecte l'utilisateur depuis req.user (posé par JwtStrategy ou LocalStrategy)
 *
 * Usage :
 *   @Get('me')
 *   me(@CurrentUser() user: AuthUser) { ... }
 *
 *   Ou un seul champ :
 *   @Get('id')
 *   getId(@CurrentUser('id') id: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: Record<string, any> }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
