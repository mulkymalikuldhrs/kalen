/**
 * KALEN Server — Audit Log Repository Service
 * Wraps TypeORM repository for AuditLogEntity with business-relevant queries.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities';

export interface LogAuditParams {
  id: string;
  actorId: string;
  actorType?: 'human' | 'agent';
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  accessDecision?: 'allowed' | 'denied';
  denialReason?: string;
}

export interface AuditLogFilters {
  actorId?: string;
  actorType?: 'human' | 'agent';
  action?: string;
  targetType?: string;
  targetId?: string;
  accessDecision?: 'allowed' | 'denied';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /** Log an audit event */
  async log(params: LogAuditParams): Promise<AuditLogEntity> {
    const entry = this.repo.create({
      id: params.id,
      actorId: params.actorId,
      actorType: params.actorType ?? 'human',
      actorKind: params.actorType ?? 'human', // Legacy compat
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      resourceType: params.targetType ?? null, // Legacy compat
      resourceId: params.targetId ?? null, // Legacy compat
      details: params.details ?? {},
      metadata: params.details ?? {}, // Legacy compat
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      requestId: params.requestId ?? null,
      accessDecision: params.accessDecision ?? 'allowed',
      denialReason: params.denialReason ?? null,
    });
    return this.repo.save(entry);
  }

  /** Query audit logs with filters and pagination */
  async query(filters: AuditLogFilters): Promise<{ data: AuditLogEntity[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('log');

    if (filters.actorId) {
      qb.andWhere('log.actorId = :actorId', { actorId: filters.actorId });
    }
    if (filters.actorType) {
      qb.andWhere('log.actorType = :actorType', { actorType: filters.actorType });
    }
    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.targetType) {
      qb.andWhere('log.targetType = :targetType', { targetType: filters.targetType });
    }
    if (filters.targetId) {
      qb.andWhere('log.targetId = :targetId', { targetId: filters.targetId });
    }
    if (filters.accessDecision) {
      qb.andWhere('log.accessDecision = :accessDecision', { accessDecision: filters.accessDecision });
    }
    if (filters.startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Find a specific audit log entry by ID */
  async findById(id: string): Promise<AuditLogEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Get audit logs for a specific actor */
  async findByActor(actorId: string, options?: { page?: number; limit?: number }): Promise<{ data: AuditLogEntity[]; total: number }> {
    return this.query({ actorId, ...options });
  }

  /** Get audit logs for a specific target */
  async findByTarget(targetType: string, targetId: string, options?: { page?: number; limit?: number }): Promise<{ data: AuditLogEntity[]; total: number }> {
    return this.query({ targetType, targetId, ...options });
  }

  /** Get recent access denials */
  async findDenials(options?: { page?: number; limit?: number }): Promise<{ data: AuditLogEntity[]; total: number }> {
    return this.query({ accessDecision: 'denied', ...options });
  }

  /** Count logs by action type in a time range */
  async countByAction(startDate: Date, endDate: Date): Promise<Array<{ action: string; count: number }>> {
    const result = await this.repo
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .andWhere('log.createdAt <= :endDate', { endDate })
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      action: r.action,
      count: parseInt(r.count, 10),
    }));
  }
}
