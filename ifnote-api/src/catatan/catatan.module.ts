import { Module } from "@nestjs/common";
import { CatatanController } from "./catatan.controller";
import { CatatanService } from "./catatan.service";

@Module({
  controllers: [CatatanController],
  providers: [CatatanService],
})
export class CatatanModule {}
