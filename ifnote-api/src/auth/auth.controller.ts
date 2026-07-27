import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { JwtUser } from "../common/auth/jwt.types";
import { setAuthCookie, clearAuthCookie } from "../common/auth/auth-cookie";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Register — ketat: max 5 attempt per IP per 1 jam.
   * Tujuan: cegah bot mass-register tanpa mengganggu user normal
   * yang biasanya tidak akan mendaftar lebih dari sekali.
   *
   * Token di-set sebagai httpOnly cookie (primary). Tetap dikembalikan
   * di response body untuk kompatibilitas klien non-browser / transisi.
   */
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto);
    setAuthCookie(res, result.token);
    return result;
  }

  /**
   * Login — ketat: max 5 attempt per IP per 15 menit.
   * Cegah brute-force password tanpa mengunci akun yang sah
   * (window 15 menit cukup pendek).
   *
   * 6th attempt: throttler akan kirim 429 "ThrottlerException".
   * HttpErrorFilter di common/filters menerjemahkan ini ke pesan
   * Indonesia ramah: "Terlalu banyak percobaan masuk".
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);
    setAuthCookie(res, result.token);
    return result;
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    // Stateless JWT — selain frontend membuang token, kita juga hapus
    // httpOnly cookie supaya sesi benar-benar berakhir di browser.
    // Untuk revocation penuh perlu token blacklist (out of scope MVP).
    clearAuthCookie(res);
    return;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }
}
