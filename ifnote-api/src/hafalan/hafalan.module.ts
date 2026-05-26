import { Module } from "@nestjs/common";
import { HafalanController } from "./hafalan.controller";
import { HafalanService } from "./hafalan.service";

@Module({
  controllers: [HafalanController],
  providers: [HafalanService],
  exports: [HafalanService],
})
export class HafalanModule {}
