import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { CatatanService } from "./catatan.service";
import { CatatanQueryDto } from "./dto";

@Controller("api/catatan")
@UseGuards(JwtAuthGuard)
export class CatatanController {
  constructor(private readonly svc: CatatanService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query() q: CatatanQueryDto) {
    return this.svc.list(user.sub, q);
  }
}
