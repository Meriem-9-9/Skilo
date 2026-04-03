// auth/types/auth-user.type.ts

/**
 * Type minimal retourné par LocalStrategy.validate() et injecté dans req.user.
 * Correspond aux champs disponibles immédiatement après validation email/password.
 */
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};
