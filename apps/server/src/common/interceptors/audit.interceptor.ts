/**
 * KALEN Server — Audit Interceptor
 * Automatically logs significant actions to the audit_log table
 * via AuditLogRepository.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogRepository } from '../../database/repositories/audit-log.repository';

@Injectable()
export class AuditInterceptor<T> implements NestInterceptor<T, any> {
  constructor(
    private auditLogRepo: AuditLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const identity = request.identity;

    // Only audit authenticated requests
    if (!identity) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordAudit(context, identity, startTime, 'allowed', null);
        },
        error: (error) => {
          const isDenial =
            error?.response?.error === 'INSUFFICIENT_SCOPE' ||
            error?.response?.error === 'FORBIDDEN';
          this.recordAudit(
            context,
            identity,
            startTime,
            isDenial ? 'denied' : 'allowed',
            isDenial ? error?.response?.message : null,
          );
        },
      }),
    );
  }

  private async recordAudit(
    context: ExecutionContext,
    identity: any,
    startTime: number,
    accessDecision: 'allowed' | 'denied',
    denialReason: string | null,
  ): Promise<void> {
    try {
      const request = context.switchToHttp().getRequest();
      const handler = context.getHandler();
      const controller = context.getClass();

      await this.auditLogRepo.log({
        id: crypto.randomUUID(),
        actorId: identity.sub,
        actorType: identity.kind,
        action: `${controller.name}.${handler.name}`,
        targetType: null,
        targetId: null,
        details: {
          method: request.method,
          url: request.url,
          durationMs: Date.now() - startTime,
        },
        requestId: request.headers?.['x-request-id'] ?? null,
        ipAddress: request.ip ?? null,
        userAgent: request.headers?.['user-agent'] ?? null,
        accessDecision,
        denialReason,
      });
    } catch {
      // Audit logging should never fail the request
      // Silently swallow errors to prevent disrupting the response
    }
  }
}
