-- Per-kanji furigana eksplisit. `reading` lama menyimpan pembacaan
-- gabungan satu kata (mis. "べんきょう" untuk 勉強). Kolom `readingRuby`
-- menyimpan pembacaan PER-KANJI dalam format kurung (mis.
-- "勉(べん)強(きょう)") yang dihasilkan AI, supaya furigana bisa
-- ditampilkan tepat di atas tiap kanji, bukan membentang satu kata.
-- Nullable: baris lama tetap valid; frontend fallback memecah `reading`
-- via kamus kanji bila kolom ini kosong.

-- AlterTable
ALTER TABLE "kotoba" ADD COLUMN "readingRuby" TEXT;

-- AlterTable
ALTER TABLE "bunpou" ADD COLUMN "readingRuby" TEXT;
