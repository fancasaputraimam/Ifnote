import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { BunpouService } from "./bunpou.service";
import { CreateBunpouDto, UpdateBunpouDto } from "./dto";

@Controller("api/bunpou")
@UseGuards(JwtAuthGuard)
export class BunpouController {
  constructor(private readonly svc: BunpouService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.svc.list(user.sub);
  }

  /**
   * Database-first lookup. Wajib di-declare *sebelum* `:id` route biar
   * "lookup" tidak di-parse sebagai UUID.
   */
  @Get("lookup")
  lookup(@CurrentUser() user: JwtUser, @Query("q") q: string) {
    return this.svc.lookup(user.sub, q ?? "");
  }

  @Get(":id")
  get(@CurrentUser() user: JwtUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.svc.getById(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateBunpouDto) {
    return this.svc.create(user.sub, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: JwtUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBunpouDto,
  ) {
    return this.svc.update(user.sub, id, dto);
  }

  @Delete(":id")
  delete(@CurrentUser() user: JwtUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.svc.delete(user.sub, id);
  }

  /** Combined AI explain endpoint (task spec PART 6). */
  @Post(":id/ai-explain")
  aiExplain(
    @CurrentUser() user: JwtUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.aiExplain(user.sub, id);
  }
}
