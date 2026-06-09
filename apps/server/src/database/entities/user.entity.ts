/**
 * KALEN Server — User Entity
 * Human identity backed by WebAuthn passkey credentials.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AgentEntity } from './agent.entity';
import { MessageEntity } from './message.entity';
import { AuditLogEntity } from './audit-log.entity';
import { RoomMemberEntity } from './room-member.entity';

/** User role enum matching @kalen/identity RBAC */
export enum UserRole {
  HUMAN_USER = 'human_user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/** User status enum */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Unique username (indexed) */
  @Index({ unique: true })
  @Column({ unique: true })
  username: string;

  /** Human-readable display name */
  @Column({ name: 'display_name' })
  displayName: string;

  /** Email address (indexed) */
  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  /** KALEN suffix: @username#hex4 */
  @Column({ unique: true })
  suffix: string;

  /** Entity kind discriminator */
  @Column({ default: 'human' })
  kind: 'human' | 'agent';

  /** WebAuthn credentials stored as JSONB array */
  @Column({ name: 'webauthn_credentials', type: 'jsonb', default: '[]' })
  webauthnCredentials: Array<{
    id: string;
    publicKey: string;
    counter: number;
    transports?: string[];
    deviceType?: string;
    backedUp?: boolean;
  }>;

  /** Legacy credentials field (alias for webauthn_credentials, for backward compat) */
  @Column({ type: 'jsonb', default: '[]' })
  credentials: Array<{
    id: string;
    publicKey: string;
    counter: number;
    transports?: string[];
    deviceType?: string;
    backedUp?: boolean;
  }>;

  /** Bcrypt hash of BIP39 recovery phrase (if generated) */
  @Column({ name: 'recovery_hash', nullable: true })
  recoveryHash: string | null;

  /** RBAC role */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.HUMAN_USER })
  role: UserRole;

  /** Account status */
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  /** Legacy active flag — kept for backward compat, derived from status */
  @Column({ default: true })
  active: boolean;

  /** Avatar URL */
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  /** Ed25519 public key for future use (base64url-encoded) */
  @Column({ name: 'public_key', nullable: true, type: 'text' })
  publicKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_auth_at', nullable: true })
  lastAuthAt: Date | null;

  @OneToMany(() => AgentEntity, (agent) => agent.owner)
  agents: AgentEntity[];

  @OneToMany(() => MessageEntity, (message) => message.sender)
  messages: MessageEntity[];

  @OneToMany(() => AuditLogEntity, (log) => log.actor)
  auditLogs: AuditLogEntity[];

  @OneToMany(() => RoomMemberEntity, (member) => member.user)
  roomMemberships: RoomMemberEntity[];
}
