import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { RequestWithUser } from '../types/request-with-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator = any authenticated user can access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // BUG FIX: was "if (requiredRoles.length > 0) throw" — always blocked everyone
    // Correct: block only if the user's role is NOT in the required list
    if (
      !requiredRoles
        .map((role) => role.toLowerCase())
        .includes(user.role.toLowerCase())
    ) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
