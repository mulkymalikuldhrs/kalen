/**
 * KALEN Server — Room Service
 * Manages rooms/conversations using KALEN's database via RoomRepository.
 * TODO: Wire to OpenIM for actual message delivery.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoomRepository } from '../database/repositories/room.repository';
import { RoomType, RoomStatus, RoomMemberRole } from '../database/entities';
import { CreateRoomDto } from './dto';
import { MAX_ROOM_MEMBERS } from '@kalen/shared';

@Injectable()
export class RoomService {
  constructor(
    private roomRepo: RoomRepository,
  ) {}

  /**
   * Create a new room.
   */
  async createRoom(creatorId: string, creatorKind: 'human' | 'agent', dto: CreateRoomDto) {
    // Validate room member count
    if (dto.members.length > MAX_ROOM_MEMBERS) {
      throw new ForbiddenException({
        error: 'VALIDATION_ERROR',
        message: `Room cannot have more than ${MAX_ROOM_MEMBERS} members`,
      });
    }

    const roomId = crypto.randomUUID();

    // Create the room
    const room = await this.roomRepo.create({
      id: roomId,
      type: dto.type as RoomType,
      name: dto.name ?? undefined,
      createdById: creatorId,
      creatorType: creatorKind,
      visibility: dto.visibility as any,
    });

    // Add creator as owner member
    await this.roomRepo.addMember({
      id: crypto.randomUUID(),
      roomId,
      memberId: creatorId,
      memberType: creatorKind,
      role: RoomMemberRole.OWNER,
    });

    // Add other members
    for (const member of dto.members) {
      if (member.id !== creatorId) {
        await this.roomRepo.addMember({
          id: crypto.randomUUID(),
          roomId,
          memberId: member.id,
          memberType: member.kind,
          role: RoomMemberRole.MEMBER,
        });
      }
    }

    // Fetch room with members for response
    const createdRoom = await this.roomRepo.findByIdWithMembers(roomId);
    if (!createdRoom) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Room creation failed' });
    }

    return this.formatRoom(createdRoom);
  }

  /**
   * Get room by ID.
   */
  async getRoom(id: string, userId?: string) {
    const room = await this.roomRepo.findByIdWithMembers(id);
    if (!room) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Room "${id}" not found`,
      });
    }

    // Check membership for private rooms
    if (room.visibility === 'private' && userId) {
      const isMember = await this.roomRepo.isMember(id, userId);
      if (!isMember) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          message: 'You are not a member of this room',
        });
      }
    }

    return this.formatRoom(room);
  }

  /**
   * List rooms for a user.
   */
  async listRooms(userId: string, options?: { type?: string; page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    const { data: rooms, total } = await this.roomRepo.findByMember(userId, {
      type: options?.type as RoomType | undefined,
      status: RoomStatus.ACTIVE,
      page,
      limit,
    });

    return {
      data: rooms.map((r) => this.formatRoom(r)),
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
   * Format a room entity for API response.
   */
  private formatRoom(room: any) {
    // Support both legacy (JSONB members) and new (RoomMemberEntity) format
    const members = room.roomMembers
      ? room.roomMembers.map((m: any) => ({
          id: m.memberId,
          kind: m.memberType,
          role: m.role,
        }))
      : (room.members ?? []).map((m: any) => ({
          id: m.id,
          kind: m.kind,
          role: m.role,
        }));

    return {
      id: room.id,
      type: room.type,
      name: room.name,
      description: room.description,
      members,
      visibility: room.visibility,
      createdBy: room.createdById ?? room.createdBy,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      lastActivityAt: room.lastActivityAt?.toISOString() ?? null,
    };
  }
}
