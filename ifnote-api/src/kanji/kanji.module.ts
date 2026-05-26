import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { KanjiController } from "./kanji.controller";
import { KanjiService } from "./kanji.service";

@Module({
  imports: [AiModule],
  controllers: [KanjiController],
  providers: [KanjiService],
})
export class KanjiModule {}
