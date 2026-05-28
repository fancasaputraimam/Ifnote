import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { KotobaController } from "./kotoba.controller";
import { KotobaService } from "./kotoba.service";

@Module({
  imports: [AiModule],
  controllers: [KotobaController],
  providers: [KotobaService],
  exports: [KotobaService],
})
export class KotobaModule {}
