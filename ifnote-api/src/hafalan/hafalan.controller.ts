import { Body, Controller, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import {
  AddHafalanDto,
  HafalanQueryDto,
  ShufflePreviewDto,
  UpdateMasteryDto,
} from "./dto";
import { HafalanService } from "./hafalan.service";

@Controller("api/hafalan")
@UseGuards(JwtAuthGuard)
export class HafalanController {
  constructor(private readonly svc: HafalanService) {}

  @Get()
  getSlide(@CurrentUser() user: JwtUser, @Query() q: HafalanQueryDto) {
    return this.svc.getSlide(user.sub, q.mode ?? "mixed", q.slide ?? 1);
  }

  @Get("slides")
  getSlides(@CurrentUser() user: JwtUser, @Query() q: HafalanQueryDto) {
    return this.svc.getSlides(user.sub, q.mode ?? "mixed");
  }

  @Post("add")
  add(@CurrentUser() user: JwtUser, @Body() dto: AddHafalanDto) {
    return this.svc.add(user.sub, dto);
  }

  @Put("mastery")
  updateMastery(@CurrentUser() user: JwtUser, @Body() dto: UpdateMasteryDto) {
    return this.svc.updateMastery(user.sub, dto);
  }

  @Post("shuffle-preview")
  shufflePreview(@CurrentUser() user: JwtUser, @Body() dto: ShufflePreviewDto) {
    return this.svc.shufflePreview(user.sub, dto);
  }

  @Post("rebuild-order")
  rebuildOrder(@CurrentUser() user: JwtUser) {
    return this.svc.rebuildOrder(user.sub);
  }
}
