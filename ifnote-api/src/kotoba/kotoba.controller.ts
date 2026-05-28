import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { CreateKotobaDto, UpdateKotobaDto } from "./dto";
import { KotobaService } from "./kotoba.service";

@Controller("api/kotoba")
@UseGuards(JwtAuthGuard)
export class KotobaController {
  constructor(private readonly svc: KotobaService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.svc.list(user.sub);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.svc.getById(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateKotobaDto) {
    return this.svc.create(user.sub, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: JwtUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateKotobaDto,
  ) {
    return this.svc.update(user.sub, id, dto);
  }

  @Delete(":id")
  delete(@CurrentUser() user: JwtUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.svc.delete(user.sub, id);
  }

  /**
   * Combined AI explain endpoint (task spec PART 6).
   *   - Cek item exists + milik user.
   *   - Jika sudah punya penjelasan, return tanpa call AI (`generated: false`).
   *   - Jika belum, call AI, simpan, return updated item (`generated: true`).
   */
  @Post(":id/ai-explain")
  aiExplain(
    @CurrentUser() user: JwtUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.aiExplain(user.sub, id);
  }
}
