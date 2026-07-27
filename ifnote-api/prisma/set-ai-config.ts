/**
 * One-off ops script: simpan konfigurasi AI untuk satu user owner,
 * memakai enkripsi yang sama dengan SettingsService (AES-256-GCM,
 * key diturunkan dari JWT_SECRET).
 *
 * Jalankan dari folder ifnote-api:
 *   npx ts-node --transpile-only prisma/set-ai-config.ts <email> <apiKey> <baseUrl> <modelId> [format]
 */
import { PrismaClient } from "@prisma/client";
import { encryptSecret, maskSecret, decryptSecret } from "../src/common/crypto";

const prisma = new PrismaClient();

async function main() {
  const [email, apiKey, baseUrl, modelId, format = "openai", provider = "9router"] =
    process.argv.slice(2);
  if (!email || !apiKey || !baseUrl || !modelId) {
    throw new Error("usage: set-ai-config.ts <email> <apiKey> <baseUrl> <modelId> [format] [provider]");
  }
  const secret = process.env.JWT_SECRET ?? "";
  if (!secret) throw new Error("JWT_SECRET tidak ada di env (.env)");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User ${email} tidak ditemukan`);

  const enc = encryptSecret(apiKey, secret);
  // Sanity: pastikan round-trip decrypt cocok sebelum disimpan.
  if (decryptSecret(enc, secret) !== apiKey) throw new Error("round-trip decrypt mismatch");

  const data = {
    aiProvider: provider,
    aiBaseUrl: baseUrl,
    aiModelId: modelId,
    aiRequestFormat: format,
    useRealAi: true,
    aiApiKeyEnc: enc,
    aiApiKeyHint: maskSecret(apiKey).slice(0, 8),
  };

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  const row = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  console.log(
    JSON.stringify(
      {
        email,
        aiProvider: row?.aiProvider,
        aiBaseUrl: row?.aiBaseUrl,
        aiModelId: row?.aiModelId,
        aiRequestFormat: row?.aiRequestFormat,
        useRealAi: row?.useRealAi,
        aiApiKeyHint: row?.aiApiKeyHint,
        keySaved: !!row?.aiApiKeyEnc,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
