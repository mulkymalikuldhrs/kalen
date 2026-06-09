/**
 * KALEN Server — HTTP Exception Filter
 * Formats all exceptions into the KALEN error response structure.
 *
 * Per API.md:
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error description",
 *     "details": [...]
 *   },
 *   "requestId": "uuid",
 *   "timestamp": "ISO8601"
 * }
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        errorCode = (resp.error as string) || this.getErrorCodeFromStatus(status);
        message = (resp.message as string) || exception.message;

        if (Array.isArray(resp.details)) {
          details = resp.details as Array<{ field: string; message: string }>;
        }

        // Handle class-validator errors
        if (Array.isArray(resp.message)) {
          details = (resp.message as string[]).map((msg) => ({
            field: 'unknown',
            message: msg,
          }));
          message = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
        }
      } else {
        message = exception.message;
        errorCode = this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    const requestId =
      (request.headers['x-request-id'] as string) || crypto.randomUUID();

    response.status(status).json({
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorCodeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'SUFFIX_VIOLATION',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] || 'INTERNAL_ERROR';
  }
}
