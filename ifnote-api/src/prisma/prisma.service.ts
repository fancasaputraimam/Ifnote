import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Wraps the Prisma client as an injectable Nest service.
 * Connects on bootstrap, disconnects on shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ["error", "warn"],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log("Prisma connected");
    } catch (err) {
      // Don't crash the whole app on a flaky DB connection at boot.
      // Prisma will lazily reconnect on the next query.
      this.logger.warn(
        `Prisma initial connect failed (will retry on demand): ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
