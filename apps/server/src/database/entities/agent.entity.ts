/**
 * KALEN Server — Agent Entity
 * Agent identity with Ed25519 keypair, capabilities, and owner.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { MessageEntity } from './message.entity';
import { AuditLogEntity } from './audit-log.entity';
import { RoomMemberEntity } from './room-member.entity';

/** Agent role enum matching @kalen/identity RBAC */
export enum AgentRole {
  AGENT_BASIC = 'agent_basic',
  AGENT_PRIVILEGED = 'agent_privileged',
}

/** Agent status enum */
export enum AgentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

@Entity('agents')
export class AgentEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Unique agent name, must end with (ai) — indexed */
  @Index({ unique: true })
  @Column({ unique: true })
  name: string;

  /** Human-readable display name */
  @Column({ name: 'display_name' })
  displayName: string;

  /** KALEN suffix: @name.agent#hex4 */
  @Column({ unique: true })
  suffix: string;

  /** Ed25519 public key (base64url-encoded) */
  @Column({ name: 'public_key', type: 'text' })
  publicKey: string;

  /** Key algorithm */
  @Column({ name: 'key_algorithm', default: 'Ed25519' })
  keyAlgorithm: string;

  /** Agent card URL for A2A discovery */
  @Column({ name: 'agent_card_url', nullable: true })
  agentCardUrl: string | null;

  /** Agent capabilities as JSONB */
  @Column({ type: 'jsonb', default: '{}' })
  capabilities: {
    skills?: string[];
    tools?: string[];
    rateLimits?: Record<string, number>;
  };

  /** Full capability manifest (signed, JSONB) */
  @Column({ type: 'jsonb', nullable: true })
  manifest: Record<string, unknown> | null;

  /** Permission scopes */
  @Column({ type: 'simple-array', default: '' })
  scopes: string[];

  /** RBAC role */
  @Column({ type: 'enum', enum: AgentRole, default: AgentRole.AGENT_BASIC })
  role: AgentRole;

  /** Agent status */
  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.ACTIVE })
  status: AgentStatus;

  /** Owner (human user) reference */
  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => UserEntity, (user) => user.agents)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** Last time agent was active / authenticated */
  @Column({ name: 'last_active_at', nullable: true })
  lastActiveAt: Date | null;

  /** Legacy: last_seen_at kept for backward compat */
  @Column({ name: 'last_seen_at', nullable: true })
  lastSeenAt: Date | null;

  @OneToMany(() => MessageEntity, (message) => message.sender)
  messages: MessageEntity[];

  @OneToMany(() => AuditLogEntity, (log) => log.actor)
  auditLogs: AuditLogEntity[];

  @OneToMany(() => RoomMemberEntity, (member) => member.agent)
  roomMemberships: RoomMemberEntity[];
}
