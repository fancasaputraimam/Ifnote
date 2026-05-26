import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { loadEnv } from "../../config/env";
import { JwtUser } from "./jwt.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const env = loadEnv();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
