import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { BunpouController } from "./bunpou.controller";
import { BunpouService } from "./bunpou.service";

@Module({
  imports: [AiModule],
  controllers: [BunpouController],
  providers: [BunpouService],
  exports: [BunpouService],
})
export class BunpouModule {}
