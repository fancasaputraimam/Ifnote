import { Module } from "@nestjs/common";
import { KotobaController } from "./kotoba.controller";
import { KotobaService } from "./kotoba.service";

@Module({
  controllers: [KotobaController],
  providers: [KotobaService],
  exports: [KotobaService],
})
export class KotobaModule {}
