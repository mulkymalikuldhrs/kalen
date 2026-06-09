/**
 * KALEN Server — Audit Log Entity
 * Comprehensive audit trail for compliance and observability.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Actor (user or agent) who performed the action */
  @Index()
  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @ManyToOne(() => UserEntity, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: UserEntity | null;

  /** Actor type discriminator */
  @Column({ name: 'actor_type', default: 'human' })
  actorType: 'human' | 'agent';

  /** Legacy: actor_kind kept for backward compat */
  @Column({ name: 'actor_kind', default: 'human' })
  actorKind: 'human' | 'agent';

  /** Actor suffix */
  @Column({ name: 'actor_suffix', nullable: true })
  actorSuffix: string | null;

  /** Action performed — indexed for fast filtering */
  @Index()
  @Column()
  action: string;

  /** Target resource type */
  @Column({ name: 'target_type', nullable: true })
  targetType: string | null;

  /** Target resource ID */
  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId: string | null;

  /** Legacy: resource_type kept for backward compat */
  @Column({ name: 'resource_type', nullable: true })
  resourceType: string | null;

  /** Legacy: resource_id kept for backward compat */
  @Column({ name: 'resource_id', nullable: true })
  resourceId: string | null;

  /** Detailed metadata / details (JSONB) */
  @Column({ type: 'jsonb', default: '{}' })
  details: Record<string, unknown>;

  /** Legacy: metadata column kept for backward compat */
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  /** Request ID for correlation */
  @Column({ name: 'request_id', nullable: true })
  requestId: string | null;

  /** Trace ID for distributed tracing */
  @Column({ name: 'trace_id', nullable: true })
  traceId: string | null;

  /** IP address */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string | null;

  /** User agent */
  @Column({ name: 'user_agent', nullable: true })
  userAgent: string | null;

  /** Access decision (for permission-gated actions) */
  @Column({ name: 'access_decision', default: 'allowed' })
  accessDecision: 'allowed' | 'denied';

  /** Denial reason (if denied) */
  @Column({ name: 'denial_reason', nullable: true })
  denialReason: string | null;

  /** Indexed creation timestamp for fast time-range queries */
  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
