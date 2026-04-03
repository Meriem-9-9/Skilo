// auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — vérifie que l'utilisateur a le rôle requis.
 * Doit être utilisé APRÈS JwtAuthGuard (req.user doit être populé).
 *
 * Usage dans le module ou sur le controller :
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.Admin)
 *
 * Note : si votre modèle User n'a pas de champ `role` encore,
 * ajoutez `role String @default("user")` dans le schema Prisma.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Pas de @Roles() sur la route → accès libre (guard passthrough)
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user: { role: Role } }>();
    const { user } = request;

    const hasRole = requiredRoles.some((role) => user?.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Accès refusé : rôle insuffisant');
    }

    return true;
  }
}
