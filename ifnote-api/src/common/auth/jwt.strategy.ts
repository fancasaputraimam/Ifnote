import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, JwtFromRequestFunction } from "passport-jwt";
import type { Request } from "express";
import { loadEnv } from "../../config/env";
import { JwtUser } from "./jwt.types";
import { AUTH_COOKIE_NAME } from "./auth-cookie";

/**
 * Ambil JWT dari httpOnly cookie lebih dulu (primary), lalu fallback ke
 * Authorization: Bearer header. Header fallback dipertahankan untuk
 * kompatibilitas (klien non-browser, test, transisi dari localStorage).
 */
const fromCookie: JwtFromRequestFunction = (req: Request) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[AUTH_COOKIE_NAME] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const env = loadEnv();
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: env.jwt.secret,
    });
  }

  /**
   * Whatever this returns becomes req.user.
   * Keep it minimal — only sub + email — never trust client claims for anything else.
   */
  validate(payload: JwtUser): JwtUser {
    return { sub: payload.sub, email: payload.email };
  }
}
