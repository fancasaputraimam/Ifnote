import { Module } from "@nestjs/common";
import { BunpouController } from "./bunpou.controller";
import { BunpouService } from "./bunpou.service";

@Module({
  controllers: [BunpouController],
  providers: [BunpouService],
  exports: [BunpouService],
})
export class BunpouModule {}
