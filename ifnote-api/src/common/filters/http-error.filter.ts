import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Single global error filter.
 * - Returns sanitized error JSON
 * - Never leaks stack traces in production
 * - Maps Prisma known errors to 400/404
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (typeof body === "object" && body !== null) {
        const b = body as { message?: string | string[]; error?: string };
        message = b.message ?? exception.message;
        code = b.error;
      }
    } else if (exception && typeof exception === "object") {
      const e = exception as { code?: string; message?: string };
      // Prisma known errors
      if (e.code === "P2002") {
        status = HttpStatus.CONFLICT;
        message = "Resource already exists";
        code = "PRISMA_UNIQUE_VIOLATION";
      } else if (e.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        message = "Resource not found";
        code = "PRISMA_NOT_FOUND";
      } else {
        this.logger.error(`[unhandled] ${req.method} ${req.url} → ${e.message ?? exception}`);
      }
    }

    const isProd = process.env.NODE_ENV === "production";
    res.status(status).json({
      statusCode: status,
      error: code ?? "Error",
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
      ...(isProd
        ? {}
        : { detail: exception instanceof Error ? exception.message : undefined }),
    });
  }
}
