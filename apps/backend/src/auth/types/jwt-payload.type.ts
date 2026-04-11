import { Role } from '../enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
};
