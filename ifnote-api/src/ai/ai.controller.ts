import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { AiService } from "./ai.service";
import { AiClientService } from "./ai-client.service";
import {
  AnalyzeSentenceDto,
  BulkKotobaDto,
  CorrectSentenceDto,
  CreateHafalanAiDto,
  ExplainBunpouDto,
  ExplainKotobaDto,
  GenerateQuizAiDto,
  GenerateSakubunDto,
  MakeExampleDto,
  TranslateExampleDto,
  TranslateReadingDto,
} from "./dto";

/**
 * AI endpoints. Setiap endpoint memanggil provider berbayar, jadi selain
 * global default ThrottlerGuard (lihat AppModule) kita pasang throttle
 * khusus AI: maksimal 20 request AI per menit per user/IP. Endpoint paling
 * mahal (bulk import + generate) dibatasi lebih ketat lagi (5/menit) lewat
 * @Throttle per-handler di bawah. Login & register punya throttle sendiri
 * di AuthController.
 *
 * 429 diterjemahkan jadi pesan Indonesia ramah oleh HttpErrorFilter.
 */
@Controller("api/ai")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(
    private readonly svc: AiService,
    private readonly client: AiClientService,
  ) {}

  /**
   * Cek konfigurasi AI untuk user saat ini. Tidak memanggil provider AI.
   * Frontend pakai ini untuk pre-detect status sebelum user kirim pesan.
   */
  @Get("status")
  async status(@CurrentUser() user: JwtUser) {
    const cfg = await this.client.resolveConfig(user.sub);
    return {
      configured: !!cfg,
      source: cfg?.source ?? null,
    };
  }

  @Post("explain-kotoba")
  explainKotoba(@CurrentUser() user: JwtUser, @Body() dto: ExplainKotobaDto) {
    return this.svc.explainKotoba(user.sub, dto);
  }

  @Post("translate-example")
  translateExample(
    @CurrentUser() user: JwtUser,
    @Body() dto: TranslateExampleDto,
  ) {
    return this.svc.translateExample(user.sub, dto);
  }

  @Post("translate-reading")
  translateReading(
    @CurrentUser() user: JwtUser,
    @Body() dto: TranslateReadingDto,
  ) {
    return this.svc.translateReading(user.sub, dto);
  }

  @Post("explain-bunpou")
  explainBunpou(@CurrentUser() user: JwtUser, @Body() dto: ExplainBunpouDto) {
    return this.svc.explainBunpou(user.sub, dto);
  }

  @Post("correct-sentence")
  correctSentence(@CurrentUser() user: JwtUser, @Body() dto: CorrectSentenceDto) {
    return this.svc.correctSentence(user.sub, dto);
  }

  @Post("make-example")
  makeExample(@CurrentUser() user: JwtUser, @Body() dto: MakeExampleDto) {
    return this.svc.makeExample(user.sub, dto);
  }

  @Post("generate-quiz")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  generateQuiz(@CurrentUser() user: JwtUser, @Body() dto: GenerateQuizAiDto) {
    return this.svc.generateQuiz(user.sub, dto);
  }

  @Post("create-hafalan")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  createHafalan(@CurrentUser() user: JwtUser, @Body() dto: CreateHafalanAiDto) {
    return this.svc.createHafalan(user.sub, dto);
  }

  @Post("bulk-kotoba")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  bulkKotoba(@CurrentUser() user: JwtUser, @Body() dto: BulkKotobaDto) {
    return this.svc.bulkKotoba(user.sub, dto);
  }

  @Post("analyze-sentence")
  analyzeSentence(@CurrentUser() user: JwtUser, @Body() dto: AnalyzeSentenceDto) {
    return this.svc.analyzeSentence(user.sub, dto);
  }

  @Post("generate-sakubun")
  generateSakubun(@CurrentUser() user: JwtUser, @Body() dto: GenerateSakubunDto) {
    return this.svc.generateSakubun(user.sub, dto);
  }
}
