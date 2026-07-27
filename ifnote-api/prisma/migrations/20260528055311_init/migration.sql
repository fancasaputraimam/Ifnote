-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "jlptGoal" TEXT,
    "dailyTarget" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kotoba" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "jp" TEXT NOT NULL,
    "romaji" TEXT,
    "meaning" TEXT NOT NULL,
    "type" TEXT,
    "level" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "beginnerExample" TEXT,
    "normalExample" TEXT,
    "furiganaExample" TEXT,
    "exampleMeaning" TEXT,
    "mastery" TEXT NOT NULL DEFAULT 'mid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kotoba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bunpou" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pattern" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "formula" TEXT,
    "usage" TEXT,
    "level" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "beginnerExample" TEXT,
    "normalExample" TEXT,
    "furiganaExample" TEXT,
    "exampleMeaning" TEXT,
    "note" TEXT,
    "commonMistake" TEXT,
    "mastery" TEXT NOT NULL DEFAULT 'mid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bunpou_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_order" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hafalan_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quizType" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "totalAnswered" INTEGER NOT NULL DEFAULT 0,
    "lastScore" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanji_cache" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kanji" TEXT NOT NULL,
    "meaning" TEXT,
    "onyomi" TEXT,
    "kunyomi" TEXT,
    "explanation" TEXT,
    "wordsJson" JSONB,
    "exampleJp" TEXT,
    "exampleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanji_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "jpMode" TEXT NOT NULL DEFAULT 'beginner',
    "onboardingSeen" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" TEXT,
    "aiBaseUrl" TEXT,
    "aiModelId" TEXT,
    "aiRequestFormat" TEXT NOT NULL DEFAULT 'openai',
    "useRealAi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mode" TEXT NOT NULL,
    "inputPreview" VARCHAR(280),
    "outputPreview" VARCHAR(280),
    "status" TEXT NOT NULL,
    "errorMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "kotoba_userId_idx" ON "kotoba"("userId");

-- CreateIndex
CREATE INDEX "kotoba_userId_jp_idx" ON "kotoba"("userId", "jp");

-- CreateIndex
CREATE INDEX "kotoba_userId_level_idx" ON "kotoba"("userId", "level");

-- CreateIndex
CREATE INDEX "kotoba_userId_mastery_idx" ON "kotoba"("userId", "mastery");

-- CreateIndex
CREATE INDEX "bunpou_userId_idx" ON "bunpou"("userId");

-- CreateIndex
CREATE INDEX "bunpou_userId_pattern_idx" ON "bunpou"("userId", "pattern");

-- CreateIndex
CREATE INDEX "bunpou_userId_level_idx" ON "bunpou"("userId", "level");

-- CreateIndex
CREATE INDEX "bunpou_userId_mastery_idx" ON "bunpou"("userId", "mastery");

-- CreateIndex
CREATE INDEX "hafalan_order_userId_idx" ON "hafalan_order"("userId");

-- CreateIndex
CREATE INDEX "hafalan_order_userId_itemType_idx" ON "hafalan_order"("userId", "itemType");

-- CreateIndex
CREATE INDEX "hafalan_order_itemId_idx" ON "hafalan_order"("itemId");

-- CreateIndex
CREATE INDEX "hafalan_order_orderIndex_idx" ON "hafalan_order"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "hafalan_order_userId_itemType_itemId_key" ON "hafalan_order"("userId", "itemType", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "hafalan_order_userId_orderIndex_key" ON "hafalan_order"("userId", "orderIndex");

-- CreateIndex
CREATE INDEX "quiz_progress_userId_idx" ON "quiz_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_progress_userId_quizType_key" ON "quiz_progress"("userId", "quizType");

-- CreateIndex
CREATE INDEX "kanji_cache_userId_idx" ON "kanji_cache"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kanji_cache_userId_kanji_key" ON "kanji_cache"("userId", "kanji");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "ai_logs_userId_idx" ON "ai_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_logs_userId_mode_idx" ON "ai_logs"("userId", "mode");

-- CreateIndex
CREATE INDEX "ai_logs_userId_status_idx" ON "ai_logs"("userId", "status");

-- CreateIndex
CREATE INDEX "ai_logs_createdAt_idx" ON "ai_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kotoba" ADD CONSTRAINT "kotoba_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bunpou" ADD CONSTRAINT "bunpou_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_order" ADD CONSTRAINT "hafalan_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_progress" ADD CONSTRAINT "quiz_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanji_cache" ADD CONSTRAINT "kanji_cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
