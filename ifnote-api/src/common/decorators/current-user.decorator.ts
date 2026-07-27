import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Request } from "express";
import { JwtUser } from "../auth/jwt.types";

/**
 * Extracts the JWT-authenticated user from the request.
 * Use as: getMe(@CurrentUser() user: JwtUser).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return (req as Request & { user: JwtUser }).user;
  },
);
