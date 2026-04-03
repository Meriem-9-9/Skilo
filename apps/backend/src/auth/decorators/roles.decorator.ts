// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Role {
  User = 'user',
  Admin = 'admin',
  Moderator = 'moderator',
}

export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles) — restreint l'accès aux utilisateurs avec le rôle requis
 *
 * Usage :
 *   @Roles(Role.Admin)
 *   @Get('admin-only')
 *   adminPanel() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
