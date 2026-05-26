import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { UpdateProfileDto } from "./dto";
import { UsersService } from "./users.service";

@Controller("api/users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get("me/profile")
  getProfile(@CurrentUser() user: JwtUser) {
    return this.svc.getProfile(user.sub);
  }

  @Put("me/profile")
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.svc.updateProfile(user.sub, dto);
  }
}
