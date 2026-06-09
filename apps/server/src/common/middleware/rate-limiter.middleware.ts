/**
 * KALEN Server — Rate Limiter Middleware
 * Simple in-memory rate limiting middleware.
 * TODO: Replace with Redis-backed rate limiter for production multi-instance deployments.
 *
 * Rate limits per API.md:
 * - Authentication: 10 req/min per IP
 * - Message send: 60 msg/min per user
 * - General API: 300 req/min per user
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private limits = new Map<string, RateLimitEntry>();

  /** Cleanup interval — remove expired entries every 60 seconds */
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.resolveKey(req);
    const limit = this.resolveLimit(req);
    const windowMs = 60_000; // 1 minute window

    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      // New window
      this.limits.set(key, { count: 1, windowStart: now });
      this.setRateLimitHeaders(res, limit, limit - 1, Math.ceil((entry?.windowStart ?? now) / 1000) + 60);
      next();
      return;
    }

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      this.setRateLimitHeaders(res, limit, 0, retryAfter);
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
          retryAfter,
        },
        requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    entry.count++;
    const remaining = limit - entry.count;
    const resetAt = Math.ceil((entry.windowStart + windowMs) / 1000);
    this.setRateLimitHeaders(res, limit, remaining, resetAt);
    next();
  }

  private setRateLimitHeaders(
    res: Response,
    limit: number,
    remaining: number,
    reset: number,
  ) {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);
  }

  private resolveKey(req: Request): string {
    // Use identity sub if available, otherwise IP
    const identity = (req as any).identity;
    if (identity?.sub) {
      return `ratelimit:${identity.sub}`;
    }
    return `ratelimit:ip:${req.ip ?? 'unknown'}`;
  }

  private resolveLimit(req: Request): number {
    const path = req.path;

    // Authentication endpoints: 10 req/min
    if (path.includes('/auth/')) {
      return 10;
    }

    // Message send: 60 msg/min
    if (req.method === 'POST' && path.includes('/messages')) {
      return 60;
    }

    // MCP invoke: 100 invocations/min per agent
    if (path.includes('/mcp/invoke')) {
      return 100;
    }

    // Search: 30 queries/min
    if (path.includes('/search')) {
      return 30;
    }

    // Default general API: 300 req/min
    return 300;
  }

  private cleanup() {
    const now = Date.now();
    const windowMs = 60_000;

    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.windowStart > windowMs * 2) {
        this.limits.delete(key);
      }
    }
  }
}
