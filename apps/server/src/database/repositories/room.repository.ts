/**
 * KALEN Server — Room Repository Service
 * Wraps TypeORM repository for RoomEntity and RoomMemberEntity with business queries.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomEntity, RoomType, RoomStatus } from '../entities/room.entity';
import { RoomMemberEntity, RoomMemberRole } from '../entities/room-member.entity';

export interface CreateRoomParams {
  id: string;
  type: RoomType;
  name?: string;
  description?: string;
  createdById: string;
  creatorType: 'human' | 'agent';
  visibility?: 'public' | 'private' | 'agent_only' | 'hybrid';
  metadata?: Record<string, unknown>;
}

export interface CreateRoomMemberParams {
  id: string;
  roomId: string;
  memberId: string;
  memberType: 'human' | 'agent';
  role?: RoomMemberRole;
}

@Injectable()
export class RoomRepository {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,
    @InjectRepository(RoomMemberEntity)
    private readonly memberRepo: Repository<RoomMemberEntity>,
  ) {}

  /** Find room by ID */
  async findById(id: string): Promise<RoomEntity | null> {
    return this.roomRepo.findOne({ where: { id } });
  }

  /** Find room by ID with members */
  async findByIdWithMembers(id: string): Promise<RoomEntity | null> {
    return this.roomRepo.findOne({
      where: { id },
      relations: ['roomMembers'],
    });
  }

  /** Find rooms where a given entity is a member */
  async findByMember(
    memberId: string,
    options?: { type?: RoomType; status?: RoomStatus; page?: number; limit?: number },
  ): Promise<{ data: RoomEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.roomRepo
      .createQueryBuilder('room')
      .innerJoin('room.roomMembers', 'member', 'member.memberId = :memberId', { memberId })
      .where('room.status = :status', { status: options?.status ?? RoomStatus.ACTIVE });

    if (options?.type) {
      qb.andWhere('room.type = :type', { type: options.type });
    }

    qb.orderBy('room.lastActivityAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Find a direct room between two entities */
  async findDirectRoom(entity1Id: string, entity2Id: string): Promise<RoomEntity | null> {
    // Look for a direct room where both entities are members
    const qb = this.roomRepo
      .createQueryBuilder('room')
      .innerJoin('room.roomMembers', 'm1', 'm1.memberId = :entity1Id', { entity1Id })
      .innerJoin('room.roomMembers', 'm2', 'm2.memberId = :entity2Id', { entity2Id })
      .where('room.type = :type', { type: RoomType.DIRECT })
      .andWhere('room.status = :status', { status: RoomStatus.ACTIVE });

    return qb.getOne();
  }

  /** Create a new room */
  async create(params: CreateRoomParams): Promise<RoomEntity> {
    const room = this.roomRepo.create({
      id: params.id,
      type: params.type,
      name: params.name ?? null,
      description: params.description ?? null,
      createdById: params.createdById,
      creatorType: params.creatorType,
      createdBy: params.createdById, // Legacy compat
      visibility: params.visibility ?? 'private',
      status: RoomStatus.ACTIVE,
      metadata: params.metadata ?? {},
      members: [], // Legacy compat
      lastActivityAt: new Date(),
    });
    return this.roomRepo.save(room);
  }

  /** Update room */
  async update(id: string, params: Partial<Pick<RoomEntity, 'name' | 'description' | 'status' | 'visibility' | 'metadata' | 'lastActivityAt'>>): Promise<RoomEntity | null> {
    const room = await this.findById(id);
    if (!room) return null;

    Object.assign(room, params);
    return this.roomRepo.save(room);
  }

  /** Delete room (soft delete by setting status) */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.roomRepo.update(id, { status: RoomStatus.DELETED });
    return (result.affected ?? 0) > 0;
  }

  /** Add a member to a room */
  async addMember(params: CreateRoomMemberParams): Promise<RoomMemberEntity> {
    const member = this.memberRepo.create({
      id: params.id,
      roomId: params.roomId,
      memberId: params.memberId,
      memberType: params.memberType,
      role: params.role ?? RoomMemberRole.MEMBER,
    });
    return this.memberRepo.save(member);
  }

  /** Remove a member from a room */
  async removeMember(roomId: string, memberId: string): Promise<boolean> {
    const result = await this.memberRepo.delete({ roomId, memberId });
    return (result.affected ?? 0) > 0;
  }

  /** Get members of a room */
  async getMembers(roomId: string): Promise<RoomMemberEntity[]> {
    return this.memberRepo.find({ where: { roomId } });
  }

  /** Update a member's role in a room */
  async updateMemberRole(roomId: string, memberId: string, role: RoomMemberRole): Promise<RoomMemberEntity | null> {
    const member = await this.memberRepo.findOne({ where: { roomId, memberId } });
    if (!member) return null;

    member.role = role;
    return this.memberRepo.save(member);
  }

  /** Update member's last read timestamp */
  async updateMemberLastRead(roomId: string, memberId: string): Promise<RoomMemberEntity | null> {
    const member = await this.memberRepo.findOne({ where: { roomId, memberId } });
    if (!member) return null;

    member.lastReadAt = new Date();
    return this.memberRepo.save(member);
  }

  /** Check if an entity is a member of a room */
  async isMember(roomId: string, memberId: string): Promise<boolean> {
    const count = await this.memberRepo.count({ where: { roomId, memberId } });
    return count > 0;
  }

  /** Get member's role in a room */
  async getMemberRole(roomId: string, memberId: string): Promise<RoomMemberRole | null> {
    const member = await this.memberRepo.findOne({ where: { roomId, memberId } });
    return member?.role ?? null;
  }

  /** List rooms with pagination */
  async list(options?: { page?: number; limit?: number; type?: RoomType; status?: RoomStatus }): Promise<{ data: RoomEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.roomRepo.createQueryBuilder('room')
      .where('room.status = :status', { status: options?.status ?? RoomStatus.ACTIVE });

    if (options?.type) {
      qb.andWhere('room.type = :type', { type: options.type });
    }

    qb.orderBy('room.lastActivityAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
