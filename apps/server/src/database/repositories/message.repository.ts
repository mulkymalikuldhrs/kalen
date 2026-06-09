/**
 * KALEN Server — Message Repository Service
 * Wraps TypeORM repository for MessageEntity with business-relevant queries.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity, ContentType } from '../entities';

export interface CreateMessageParams {
  id: string;
  roomId: string;
  senderId: string;
  senderType: 'human' | 'agent';
  contentType?: ContentType;
  content: string;
  metadata?: Record<string, unknown>;
  replyToId?: string;
  senderSuffix?: string;
  mentions?: string[];
}

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repo: Repository<MessageEntity>,
  ) {}

  /** Find message by ID */
  async findById(id: string): Promise<MessageEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Find messages by room with cursor-based pagination */
  async findByRoom(
    roomId: string,
    options?: {
      page?: number;
      limit?: number;
      before?: string;  // Message ID cursor
      after?: string;   // Message ID cursor
    },
  ): Promise<{ data: MessageEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('message')
      .where('message.roomId = :roomId', { roomId })
      .andWhere('message.deleted = false');

    if (options?.before) {
      qb.andWhere('message.createdAt < (SELECT m2.createdAt FROM messages m2 WHERE m2.id = :beforeId)', { beforeId: options.before });
    }

    if (options?.after) {
      qb.andWhere('message.createdAt > (SELECT m2.createdAt FROM messages m2 WHERE m2.id = :afterId)', { afterId: options.after });
    }

    qb.orderBy('message.createdAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Create a new message */
  async create(params: CreateMessageParams): Promise<MessageEntity> {
    const message = this.repo.create({
      id: params.id,
      roomId: params.roomId,
      senderId: params.senderId,
      senderType: params.senderType,
      senderKind: params.senderType, // Legacy compat
      contentType: params.contentType ?? ContentType.TEXT,
      content: params.content,
      metadata: params.metadata ?? null,
      replyToId: params.replyToId ?? null,
      replyTo: params.replyToId ?? null, // Legacy compat
      senderSuffix: params.senderSuffix ?? null,
      mentions: params.mentions ?? [],
      reactions: {},
      readBy: [params.senderId],
      deleted: false,
    });
    return this.repo.save(message);
  }

  /** Soft-delete a message */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.update(id, { deleted: true });
    return (result.affected ?? 0) > 0;
  }

  /** Edit a message (update content and set editedAt) */
  async edit(id: string, content: string): Promise<MessageEntity | null> {
    const message = await this.findById(id);
    if (!message) return null;

    message.content = content;
    message.editedAt = new Date();
    return this.repo.save(message);
  }

  /** Add a reaction to a message */
  async addReaction(messageId: string, emoji: string, userId: string): Promise<MessageEntity | null> {
    const message = await this.findById(messageId);
    if (!message) return null;

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }
    if (!message.reactions[emoji].includes(userId)) {
      message.reactions[emoji].push(userId);
    }
    return this.repo.save(message);
  }

  /** Remove a reaction from a message */
  async removeReaction(messageId: string, emoji: string, userId: string): Promise<MessageEntity | null> {
    const message = await this.findById(messageId);
    if (!message) return null;

    if (message.reactions[emoji]) {
      message.reactions[emoji] = message.reactions[emoji].filter((id) => id !== userId);
      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    }
    return this.repo.save(message);
  }

  /** Mark message as read by a user */
  async markAsRead(messageId: string, userId: string): Promise<MessageEntity | null> {
    const message = await this.findById(messageId);
    if (!message) return null;

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }
    return this.repo.save(message);
  }

  /** Count messages in a room (excluding deleted) */
  async countByRoom(roomId: string): Promise<number> {
    return this.repo.count({ where: { roomId, deleted: false } });
  }

  /** Find messages by sender */
  async findBySender(senderId: string, options?: { page?: number; limit?: number }): Promise<{ data: MessageEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('message')
      .where('message.senderId = :senderId', { senderId })
      .andWhere('message.deleted = false')
      .orderBy('message.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Find a thread (all replies to a message) */
  async findThread(replyToId: string, options?: { page?: number; limit?: number }): Promise<{ data: MessageEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('message')
      .where('message.replyToId = :replyToId', { replyToId })
      .andWhere('message.deleted = false')
      .orderBy('message.createdAt', 'ASC')
      .skip(offset)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
