import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CatatanModule } from "./catatan/catatan.module";
import { KotobaModule } from "./kotoba/kotoba.module";
import { BunpouModule } from "./bunpou/bunpou.module";
import { HafalanModule } from "./hafalan/hafalan.module";
import { QuizModule } from "./quiz/quiz.module";
import { AiModule } from "./ai/ai.module";
import { SettingsModule } from "./settings/settings.module";
import { KanjiModule } from "./kanji/kanji.module";
import { BackupModule } from "./backup/backup.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      // Global default: 60 requests per minute per IP
      { name: "default", ttl: 60_000, limit: 60 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CatatanModule,
    KotobaModule,
    BunpouModule,
    HafalanModule,
    QuizModule,
    AiModule,
    SettingsModule,
    KanjiModule,
    BackupModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
