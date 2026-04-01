// types/auth-user.type.ts
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  creditBalance: number;
  isOnboarded: boolean;
};
