/**
 * KALEN Server — Message Entity
 * Individual messages within rooms.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { RoomEntity } from './room.entity';
import { MessageEntity } from './message.entity';

/** Content types for messages */
export enum ContentType {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json',
  FILE_REFERENCE = 'file_reference',
}

@Entity('messages')
export class MessageEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Room this message belongs to — indexed for fast room queries */
  @Index()
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => RoomEntity, (room) => room.messages)
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  /** Sender ID (UUID — user or agent) */
  @Index()
  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  /** Sender type discriminator */
  @Column({ name: 'sender_type', default: 'human' })
  senderType: 'human' | 'agent';

  /** Content type */
  @Column({ name: 'content_type', type: 'enum', enum: ContentType, default: ContentType.TEXT })
  contentType: ContentType;

  /** Message content */
  @Column({ type: 'text' })
  content: string;

  /** Additional metadata (JSONB) */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /** Reply-to message ID (self-referencing FK) */
  @Column({ name: 'reply_to_id', type: 'uuid', nullable: true })
  replyToId: string | null;

  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: MessageEntity | null;

  /** Polymorphic sender reference (no FK — could be user or agent) */
  @ManyToOne(() => /* will be resolved dynamically */ Object)
  sender: any;

  /** Legacy: sender_kind kept for backward compat */
  @Column({ name: 'sender_kind', default: 'human' })
  senderKind: 'human' | 'agent';

  /** Sender suffix at time of sending */
  @Column({ name: 'sender_suffix', nullable: true })
  senderSuffix: string | null;

  /** Legacy: replyTo column kept for backward compat */
  @Column({ name: 'reply_to', type: 'uuid', nullable: true })
  replyTo: string | null;

  /** Mentioned entity suffixes */
  @Column({ type: 'simple-array', nullable: true })
  mentions: string[];

  /** Reactions (emoji → user IDs, stored as JSONB) */
  @Column({ type: 'jsonb', default: '{}' })
  reactions: Record<string, string[]>;

  /** Read-by user IDs */
  @Column({ type: 'simple-array', default: '' })
  readBy: string[];

  /** Soft delete flag */
  @Column({ default: false })
  deleted: boolean;

  /** Indexed creation timestamp for fast time-range queries */
  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'edited_at', nullable: true })
  editedAt: Date | null;
}
