import { AiClientService } from "./ai-client.service";
import type { PrismaService } from "../prisma/prisma.service";
import { encryptSecret } from "../common/crypto";

/**
 * resolveConfig() decides which AI credentials a request uses. It is the
 * security boundary that keeps non-owners from spending the owner's key
 * unless the owner opted in. These tests pin every branch of the hierarchy.
 *
 * NOTE: AiClientService reads env via loadEnv() in its constructor, so we
 * set process.env BEFORE constructing it in each test.
 */

const JWT_SECRET = "test-jwt-secret-that-is-32-chars-min!!";
const OWNER_EMAIL_FOR_TEST = "owner-test@example.com";

function makePrisma(userRow: unknown, ownerRow: unknown = null) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(userRow),
      findFirst: jest.fn().mockResolvedValue(ownerRow),
    },
    aiLog: { create: jest.fn().mockResolvedValue({}) },
  } as unknown as PrismaService;
}

function baseEnv() {
  process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/db";
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.OWNER_EMAIL = OWNER_EMAIL_FOR_TEST;
  delete process.env.AI_API_KEY;
}

describe("AiClientService.resolveConfig — fallback hierarchy", () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
    jest.clearAllMocks();
  });

  it("Path 1: owner with personal key + useRealAi=true uses the owner key", async () => {
    baseEnv();
    const enc = encryptSecret("sk-owner-personal", JWT_SECRET);
    const prisma = makePrisma({
      role: "owner",
      email: OWNER_EMAIL_FOR_TEST,
      settings: {
        aiApiKeyEnc: enc,
        aiBaseUrl: "https://owner.example/v1",
        aiModelId: "gpt-owner",
        aiRequestFormat: "openai",
        useRealAi: true,
      },
    });
    const svc = new AiClientService(prisma);
    const cfg = await svc.resolveConfig("owner-id");
    expect(cfg).toMatchObject({
      apiKey: "sk-owner-personal",
      source: "user",
      modelId: "gpt-owner",
    });
  });

  it("Path owner-mute: owner with useRealAi=false returns null (no cascade)", async () => {
    baseEnv();
    process.env.AI_API_KEY = "sk-env-key"; // even with env present...
    const prisma = makePrisma({
      role: "owner",
      email: OWNER_EMAIL_FOR_TEST,
      settings: { aiApiKeyEnc: null, useRealAi: false, aiRequestFormat: "openai" },
    });
    const svc = new AiClientService(prisma);
    // ...owner explicitly muted real AI, so they get the mock fallback (null)
    await expect(svc.resolveConfig("owner-id")).resolves.toBeNull();
  });

  it("Path 2: non-owner falls back to the server env key", async () => {
    baseEnv();
    process.env.AI_API_KEY = "sk-env-key";
    const prisma = makePrisma({
      role: "user",
      email: "user@example.com",
      settings: { aiApiKeyEnc: null, useRealAi: false, aiRequestFormat: "openai" },
    });
    const svc = new AiClientService(prisma);
    const cfg = await svc.resolveConfig("user-id");
    expect(cfg).toMatchObject({ apiKey: "sk-env-key", source: "env" });
  });

  it("Path 3: no env key — non-owner borrows the owner key as server-wide fallback", async () => {
    baseEnv(); // no AI_API_KEY
    const enc = encryptSecret("sk-owner-as-server", JWT_SECRET);
    const prisma = makePrisma(
      {
        role: "user",
        email: "user@example.com",
        settings: { aiApiKeyEnc: null, useRealAi: false, aiRequestFormat: "openai" },
      },
      {
        settings: {
          aiApiKeyEnc: enc,
          aiBaseUrl: null,
          aiModelId: null,
          aiRequestFormat: "openai",
          useRealAi: true,
        },
      },
    );
    const svc = new AiClientService(prisma);
    const cfg = await svc.resolveConfig("user-id");
    expect(cfg).toMatchObject({ apiKey: "sk-owner-as-server", source: "env" });
  });

  it("returns null when nothing is configured anywhere (mock fallback)", async () => {
    baseEnv(); // no env key
    const prisma = makePrisma(
      {
        role: "user",
        email: "user@example.com",
        settings: { aiApiKeyEnc: null, useRealAi: false, aiRequestFormat: "openai" },
      },
      null, // no owner key either
    );
    const svc = new AiClientService(prisma);
    await expect(svc.resolveConfig("user-id")).resolves.toBeNull();
  });

  it("does not leak the owner key to a non-owner when owner has useRealAi=false", async () => {
    baseEnv(); // no env key
    const enc = encryptSecret("sk-owner-private", JWT_SECRET);
    const prisma = makePrisma(
      {
        role: "user",
        email: "user@example.com",
        settings: { aiApiKeyEnc: null, useRealAi: false, aiRequestFormat: "openai" },
      },
      {
        // owner key exists but real-AI is OFF → must NOT be used as fallback
        settings: { aiApiKeyEnc: enc, useRealAi: false, aiRequestFormat: "openai" },
      },
    );
    const svc = new AiClientService(prisma);
    await expect(svc.resolveConfig("user-id")).resolves.toBeNull();
  });
});
