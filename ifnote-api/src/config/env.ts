/**
 * Centralised env config. Read from process.env, validate, and expose
 * typed accessors. Never log secrets.
 */
export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  ai: {
    apiKey?: string;
    baseUrl: string;
    modelId: string;
    requestFormat: "openai" | "azure" | "custom";
    bulkMaxItems: number;
  };
  frontendUrl: string;
}

const truthy = (v: string | undefined) => v && v.length > 0;

export function loadEnv(): AppConfig {
  const env = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];
  const port = Number(process.env.PORT ?? 3000);
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const jwtSecret = process.env.JWT_SECRET ?? "";
  const jwtExpires = process.env.JWT_EXPIRES_IN ?? "7d";
  const aiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const aiModelId = process.env.AI_MODEL_ID ?? "gpt-4o-mini";
  const aiFormat = (process.env.AI_REQUEST_FORMAT ?? "openai") as AppConfig["ai"]["requestFormat"];
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  if (!truthy(databaseUrl)) {
    throw new Error("DATABASE_URL is required");
  }
  if (env === "production" && !truthy(jwtSecret)) {
    throw new Error("JWT_SECRET is required in production");
  }
  if (jwtSecret.length > 0 && jwtSecret.length < 32 && env !== "test") {
    // soft guard, not fatal in dev
    // eslint-disable-next-line no-console
    console.warn("[config] JWT_SECRET shorter than 32 chars — generate a stronger one for production");
  }

  return {
    nodeEnv: env,
    port,
    databaseUrl,
    jwt: {
      secret: jwtSecret || "dev-only-not-for-production",
      expiresIn: jwtExpires,
    },
    ai: {
      apiKey: aiKey,
      baseUrl: aiBaseUrl,
      modelId: aiModelId,
      requestFormat: aiFormat,
      bulkMaxItems: Number(process.env.AI_BULK_MAX_ITEMS ?? 50),
    },
    frontendUrl,
  };
}
