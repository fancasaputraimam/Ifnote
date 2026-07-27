-- Per-example reading + meaning columns. Sebelumnya semua contoh
-- (beginner / normal / lainnya) berbagi satu kolom `exampleReading` dan
-- `exampleMeaning`, jadi UI bisa salah menempelkan reading kalimat
-- normal di atas kalimat beginner. Kolom-kolom baru ini memungkinkan
-- setiap level contoh punya reading + meaning sendiri.

-- AlterTable
ALTER TABLE "kotoba"
  ADD COLUMN "beginnerExampleReading" TEXT,
  ADD COLUMN "beginnerExampleMeaning" TEXT,
  ADD COLUMN "normalExampleReading"   TEXT,
  ADD COLUMN "normalExampleMeaning"   TEXT;

-- AlterTable
ALTER TABLE "bunpou"
  ADD COLUMN "beginnerExampleReading" TEXT,
  ADD COLUMN "beginnerExampleMeaning" TEXT,
  ADD COLUMN "normalExampleReading"   TEXT,
  ADD COLUMN "normalExampleMeaning"   TEXT;
