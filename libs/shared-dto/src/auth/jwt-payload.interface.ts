export interface JwtPayload {
  sub: string;
  email: string;
  role: string[];
  status: 'ACTIVE' | 'SUSPENDED';
  salesStatus?: 'OPEN' | 'FROZEN';
  jti: string;
}
