import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtUser } from "./jwt.types";
import { isOwnerUser } from "./owner";

/**
 * 403s the request unless the JWT-authenticated user is the owner.
 *
 * Always pair with `JwtAuthGuard` first so `req.user` exists:
 *
 *   @UseGuards(JwtAuthGuard, OwnerGuard)
 *
 * Why DB-check, bukan cuma email JWT?
 *  - role bisa diubah server-side (mis. owner di-revoke) tanpa rotate token.
 *  - kita tetap percaya email cuma sebagai *fallback* (PART 1 dari spec).
 */
@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const jwtUser = req.user;
    if (!jwtUser?.sub) {
      throw new ForbiddenException("Only owner can manage AI configuration");
    }

    const u = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
      select: { role: true, email: true },
    });

    if (!isOwnerUser(u)) {
      throw new ForbiddenException("Only owner can manage AI configuration");
    }
    return true;
  }
}
