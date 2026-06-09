/**
 * KALEN Server — Room Entity
 * Conversation/room container for messages.
 * Members are stored in a separate RoomMemberEntity for proper normalization.
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
import { MessageEntity } from './message.entity';
import { RoomMemberEntity } from './room-member.entity';

/** Room types per KALEN design */
export enum RoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  AGENT_COLLABORATION = 'agent_collaboration',
}

/** Room status */
export enum RoomStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('rooms')
export class RoomEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Room type */
  @Column({ type: 'enum', enum: RoomType, default: RoomType.GROUP })
  type: RoomType;

  /** Room display name */
  @Column({ nullable: true })
  name: string | null;

  /** Description */
  @Column({ nullable: true })
  description: string | null;

  /** Creator reference (UUID — can be user or agent) */
  @Index()
  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  /** Creator type discriminator */
  @Column({ name: 'creator_type', default: 'human' })
  creatorType: 'human' | 'agent';

  /** Room visibility */
  @Column({ default: 'private' })
  visibility: 'public' | 'private' | 'agent_only' | 'hybrid';

  /** Room status */
  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.ACTIVE })
  status: RoomStatus;

  /** Additional metadata (JSONB) */
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  /** Legacy members stored as JSONB (kept for backward compat during migration) */
  @Column({ type: 'jsonb', default: '[]' })
  members: Array<{
    id: string;
    kind: 'human' | 'agent';
    role: 'member' | 'admin' | 'owner';
    joinedAt: string;
  }>;

  /** Legacy created_by column (kept for backward compat) */
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date | null;

  @OneToMany(() => MessageEntity, (message) => message.room)
  messages: MessageEntity[];

  @OneToMany(() => RoomMemberEntity, (member) => member.room)
  roomMembers: RoomMemberEntity[];
}
