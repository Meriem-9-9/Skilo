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
    // get the roles required by the route
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // no @Roles() decorator = route is open to any authenticated user
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    //  if (!requiredRoles.includes(user.role)) {
    if (requiredRoles.length > 0) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
