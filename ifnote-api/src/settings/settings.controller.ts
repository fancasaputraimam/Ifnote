import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { UpdateSettingsDto } from "./dto";
import { SettingsService } from "./settings.service";

@Controller("api/settings")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  get(@CurrentUser() user: JwtUser) {
    return this.svc.get(user.sub);
  }

  @Put()
  update(@CurrentUser() user: JwtUser, @Body() dto: UpdateSettingsDto) {
    return this.svc.update(user.sub, dto);
  }
}
