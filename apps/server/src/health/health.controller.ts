/**
 * KALEN Server — Health Controller
 * Health check endpoints outside the /api/v1 prefix.
 * Provides liveness, readiness, and detailed health checks.
 */

import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  /**
   * GET /health
   * Basic health check endpoint.
   */
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'kalen-server',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /health/live
   * Liveness probe — is the process running?
   */
  @Get('live')
  liveness() {
    return { status: 'alive' };
  }

  /**
   * GET /health/ready
   * Readiness probe — is the service ready to accept traffic?
   * Checks database connectivity.
   */
  @Get('ready')
  async readiness() {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Check database connectivity
    try {
      const start = Date.now();
      await this.userRepo.query('SELECT 1');
      checks.database = {
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      checks.database = {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'Unknown database error',
      };
    }

    // Redis check — TODO: Wire to real Redis client
    // For now, report as not configured
    checks.redis = {
      status: 'not_configured',
      error: 'Redis not yet connected — using in-memory challenge store',
    };

    // OpenIM check — TODO: Wire to real OpenIM client
    checks.openim = {
      status: 'not_configured',
      error: 'OpenIM not yet connected — using database-backed messaging',
    };

    const allHealthy = Object.values(checks).every(
      (c) => c.status === 'healthy' || c.status === 'not_configured',
    );

    return {
      status: allHealthy ? 'ready' : 'degraded',
      checks,
    };
  }
}
