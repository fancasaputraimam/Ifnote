import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { JwtUser } from "../common/auth/jwt.types";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Register — ketat: max 5 attempt per IP per 1 jam.
   * Tujuan: cegah bot mass-register tanpa mengganggu user normal
   * yang biasanya tidak akan mendaftar lebih dari sekali.
   */
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
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
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout() {
    // Stateless JWT — frontend just discards the token.
    // For session revocation we'd need a token blacklist; out of scope for MVP.
    return;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }
}
