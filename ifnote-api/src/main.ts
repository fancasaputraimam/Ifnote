import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";
import { HttpErrorFilter } from "./common/filters/http-error.filter";

async function bootstrap() {
  const env = loadEnv();
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule, {
    logger: env.nodeEnv === "production" ? ["log", "warn", "error"] : ["log", "warn", "error", "debug", "verbose"],
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.enableCors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());

  await app.listen(env.port, "0.0.0.0");
  logger.log(`ifnote-api listening on :${env.port} (${env.nodeEnv})`);
  if (!env.ai.apiKey) {
    logger.warn(
      "AI_API_KEY not set — server-level fallback unavailable. Users tanpa API key di Settings akan menerima 503 (AI_NOT_CONFIGURED).",
    );
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
