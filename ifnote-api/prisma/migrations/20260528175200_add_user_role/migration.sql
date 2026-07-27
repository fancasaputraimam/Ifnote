-- Add role column for owner/admin gating of AI configuration.
-- Default "user" untuk semua row lama. Owner ditandai oleh:
--   1. seed migration di bawah (email owner spesifik)
--   2. fallback first-account rule di register flow
ALTER TABLE "users"
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Tandai owner berdasarkan email yang sudah ditentukan di task spec.
-- Aman idempotent: hanya match email tertentu, abaikan kalau tidak ada.
UPDATE "users"
SET "role" = 'owner'
WHERE LOWER("email") = LOWER('7384imamfancasaputraaa02@gmail.com');

-- Fallback: kalau tabel tidak punya owner sama sekali, promote user
-- terlama (createdAt paling awal) menjadi owner.
UPDATE "users"
SET "role" = 'owner'
WHERE "id" = (
  SELECT "id" FROM "users"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM "users" WHERE "role" = 'owner'
);
