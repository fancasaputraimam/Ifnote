import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { CacheKanjiDto } from "./dto";
import { KanjiService } from "./kanji.service";

@Controller("api/kanji")
@UseGuards(JwtAuthGuard)
export class KanjiController {
  constructor(private readonly svc: KanjiService) {}

  @Get(":kanji")
  get(@CurrentUser() user: JwtUser, @Param("kanji") kanji: string) {
    return this.svc.get(user.sub, kanji);
  }

  @Post("cache")
  cache(@CurrentUser() user: JwtUser, @Body() dto: CacheKanjiDto) {
    return this.svc.cache(user.sub, dto);
  }
}
