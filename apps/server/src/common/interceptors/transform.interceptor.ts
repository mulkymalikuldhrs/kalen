/**
 * KALEN Server — Transform Interceptor
 * Wraps successful responses in a consistent structure:
 * { data: ..., meta: { timestamp, requestId } }
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string | null;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) ?? null;

    return next.handle().pipe(
      map((data) => {
        // If the response is already paginated, pass through as-is
        if (data && typeof data === 'object' && 'pagination' in data) {
          return {
            ...data,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}
