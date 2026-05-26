import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { BackupService } from "./backup.service";
import { ImportBackupDto } from "./dto";

@Controller("api/backup")
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly svc: BackupService) {}

  @Get("export")
  exportData(@CurrentUser() user: JwtUser) {
    return this.svc.exportData(user.sub);
  }

  @Post("import")
  importData(@CurrentUser() user: JwtUser, @Body() dto: ImportBackupDto) {
    return this.svc.importData(user.sub, dto);
  }

  @Post("reset")
  @HttpCode(HttpStatus.OK)
  reset(@CurrentUser() user: JwtUser) {
    return this.svc.reset(user.sub);
  }
}
