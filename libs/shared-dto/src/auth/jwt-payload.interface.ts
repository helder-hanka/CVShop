import { Role, SalesStatus, UserStatus } from './roles.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role[];
  status: UserStatus;
  salesStatus: SalesStatus;
  jti: string;
}
