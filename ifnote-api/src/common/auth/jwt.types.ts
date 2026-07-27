export interface JwtUser {
  /** Internal user id (UUID) */
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
