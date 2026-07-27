-- Cleanup AI configuration for accounts that are NOT owners.
--
-- Konteks: sebelum aturan owner-only diberlakukan, user biasa mungkin
-- sempat menyimpan AI config (provider/base url/model/api key) lewat
-- /api/settings. Data itu sekarang sudah inert (resolveConfig di backend
-- selalu fallback ke env untuk non-owner), tapi tetap kita bersihkan
-- agar tidak ada API key user biasa yang nempel di DB.
--
-- Aman re-run: idempotent — kalau sudah null, tetap null.
UPDATE "user_settings"
SET "aiApiKeyEnc"     = NULL,
    "aiApiKeyHint"    = NULL,
    "aiProvider"      = NULL,
    "aiBaseUrl"       = NULL,
    "aiModelId"       = NULL,
    "aiRequestFormat" = 'openai',
    "useRealAi"       = false
WHERE "userId" IN (
  SELECT "id" FROM "users" WHERE "role" <> 'owner'
);
