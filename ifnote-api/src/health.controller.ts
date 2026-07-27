import { Controller, Get } from "@nestjs/common";

/**
 * Tiny health endpoint so Heroku release/scale checks don't 404.
 * Returns 200 with status payload — no auth required.
 */
@Controller()
export class HealthController {
  @Get("/")
  root() {
    return { name: "ifnote-api", status: "ok" };
  }

  @Get("/health")
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
