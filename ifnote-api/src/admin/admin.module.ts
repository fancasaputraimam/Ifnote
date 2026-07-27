import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { OwnerGuard } from "../common/auth/owner.guard";

@Module({
  controllers: [AdminController],
  providers: [AdminService, OwnerGuard],
})
export class AdminModule {}
