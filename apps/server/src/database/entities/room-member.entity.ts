/**
 * KALEN Server — Room Member Entity
 * Proper normalized room membership (instead of JSONB array on RoomEntity).
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
import { RoomEntity } from './room.entity';
import { UserEntity } from './user.entity';
import { AgentEntity } from './agent.entity';

/** Room member role */
export enum RoomMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('room_members')
@Index(['roomId', 'memberId', 'memberType'], { unique: true })
export class RoomMemberEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Room this member belongs to */
  @Index()
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => RoomEntity, (room) => room.roomMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  /** Member ID (UUID — either user or agent) */
  @Index()
  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  /** Member type discriminator */
  @Column({ name: 'member_type', default: 'human' })
  memberType: 'human' | 'agent';

  /** Member role in this room */
  @Column({ type: 'enum', enum: RoomMemberRole, default: RoomMemberRole.MEMBER })
  role: RoomMemberRole;

  /** When the member joined */
  @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'NOW()' })
  joinedAt: Date;

  /** Last read timestamp for this room (for unread counts) */
  @Column({ name: 'last_read_at', type: 'timestamptz', nullable: true })
  lastReadAt: Date | null;

  /** Optional FK to UserEntity (null if member is an agent) */
  @ManyToOne(() => UserEntity, (user) => user.roomMemberships, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  user: UserEntity | null;

  /** Optional FK to AgentEntity (null if member is a human) */
  @ManyToOne(() => AgentEntity, (agent) => agent.roomMemberships, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  agent: AgentEntity | null;
}
