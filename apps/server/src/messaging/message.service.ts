/**
 * KALEN Server — Message Service
 * Manages messages within rooms via MessageRepository.
 * TODO: Wire to OpenIM for actual message delivery and real-time push.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageRepository } from '../database/repositories/message.repository';
import { RoomRepository } from '../database/repositories/room.repository';
import { SendMessageDto } from './dto';
import { MAX_MESSAGE_LENGTH } from '@kalen/shared';

@Injectable()
export class MessageService {
  constructor(
    private messageRepo: MessageRepository,
    private roomRepo: RoomRepository,
  ) {}

  /**
   * Send a message to a room.
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    senderKind: 'human' | 'agent',
    senderSuffix: string | null,
    dto: SendMessageDto,
  ) {
    // Verify room exists and sender is a member
    const room = await this.roomRepo.findById(roomId);
    if (!room) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Room "${roomId}" not found`,
      });
    }

    const isMember = await this.roomRepo.isMember(roomId, senderId);
    if (!isMember) {
      // Fallback: check legacy JSONB members for backward compat
      const legacyMember = room.members?.some((m) => m.id === senderId);
      if (!legacyMember) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          message: 'You are not a member of this room',
        });
      }
    }

    const messageId = crypto.randomUUID();

    const message = await this.messageRepo.create({
      id: messageId,
      roomId,
      senderId,
      senderType: senderKind,
      content: dto.content,
      contentType: (dto.type as any) ?? undefined,
      replyToId: dto.replyTo ?? undefined,
      senderSuffix: senderSuffix ?? undefined,
      mentions: dto.mentions ?? undefined,
    });

    // Update room's last activity timestamp
    await this.roomRepo.update(roomId, { lastActivityAt: new Date() });

    return this.formatMessage(message);
  }

  /**
   * List messages in a room.
   */
  async listMessages(
    roomId: string,
    userId: string,
    options?: { page?: number; limit?: number; before?: string },
  ) {
    // Verify room exists and user is a member
    const room = await this.roomRepo.findById(roomId);
    if (!room) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Room "${roomId}" not found`,
      });
    }

    const isMember = await this.roomRepo.isMember(roomId, userId);
    if (!isMember) {
      // Fallback: check legacy JSONB members for backward compat
      const legacyMember = room.members?.some((m) => m.id === userId);
      if (!legacyMember) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          message: 'You are not a member of this room',
        });
      }
    }

    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    const { data: messages, total } = await this.messageRepo.findByRoom(roomId, {
      page,
      limit,
      before: options?.before,
    });

    return {
      data: messages.map((m) => this.formatMessage(m)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Format a message entity for API response.
   */
  private formatMessage(message: any) {
    return {
      id: message.id,
      roomId: message.roomId,
      content: message.content,
      type: message.contentType,
      senderSuffix: message.senderSuffix,
      senderEntityType: message.senderType ?? message.senderKind,
      mentions: message.mentions,
      reactions: message.reactions,
      readBy: message.readBy,
      replyTo: message.replyToId ?? message.replyTo,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
    };
  }
}
