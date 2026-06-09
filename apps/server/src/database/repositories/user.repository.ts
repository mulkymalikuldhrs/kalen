/**
 * KALEN Server — User Repository Service
 * Wraps TypeORM repository for UserEntity with business-relevant queries.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole, UserStatus } from '../entities';

export interface CreateUserParams {
  id: string;
  username: string;
  displayName: string;
  email: string;
  suffix: string;
  credentials?: Array<{
    id: string;
    publicKey: string;
    counter: number;
    transports?: string[];
    deviceType?: string;
    backedUp?: boolean;
  }>;
  role?: UserRole;
  status?: UserStatus;
  avatarUrl?: string;
  publicKey?: string;
}

export interface UpdateUserParams {
  displayName?: string;
  email?: string;
  credentials?: Array<{
    id: string;
    publicKey: string;
    counter: number;
    transports?: string[];
    deviceType?: string;
    backedUp?: boolean;
  }>;
  role?: UserRole;
  status?: UserStatus;
  active?: boolean;
  avatarUrl?: string;
  publicKey?: string;
  lastAuthAt?: Date;
  recoveryHash?: string;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  /** Find user by ID */
  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Find user by username */
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  /** Find user by email */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  /** Find user by suffix */
  async findBySuffix(suffix: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { suffix } });
  }

  /** Create a new user */
  async create(params: CreateUserParams): Promise<UserEntity> {
    const user = this.repo.create({
      id: params.id,
      username: params.username,
      displayName: params.displayName,
      email: params.email,
      suffix: params.suffix,
      credentials: params.credentials ?? [],
      webauthnCredentials: params.credentials ?? [],
      role: params.role ?? UserRole.HUMAN_USER,
      status: params.status ?? UserStatus.ACTIVE,
      active: params.status !== UserStatus.DEACTIVATED,
      avatarUrl: params.avatarUrl ?? null,
      publicKey: params.publicKey ?? null,
    });
    return this.repo.save(user);
  }

  /** Update an existing user */
  async update(id: string, params: UpdateUserParams): Promise<UserEntity | null> {
    const user = await this.findById(id);
    if (!user) return null;

    if (params.displayName !== undefined) user.displayName = params.displayName;
    if (params.email !== undefined) user.email = params.email;
    if (params.credentials !== undefined) {
      user.credentials = params.credentials;
      user.webauthnCredentials = params.credentials;
    }
    if (params.role !== undefined) user.role = params.role;
    if (params.status !== undefined) {
      user.status = params.status;
      user.active = params.status === UserStatus.ACTIVE;
    }
    if (params.active !== undefined) user.active = params.active;
    if (params.avatarUrl !== undefined) user.avatarUrl = params.avatarUrl;
    if (params.publicKey !== undefined) user.publicKey = params.publicKey;
    if (params.lastAuthAt !== undefined) user.lastAuthAt = params.lastAuthAt;
    if (params.recoveryHash !== undefined) user.recoveryHash = params.recoveryHash;

    return this.repo.save(user);
  }

  /** Delete a user by ID */
  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** List users with pagination */
  async list(options?: { page?: number; limit?: number; status?: UserStatus }): Promise<{ data: UserEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('user');

    if (options?.status) {
      qb.andWhere('user.status = :status', { status: options.status });
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Check if email is already taken */
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo.createQueryBuilder('user')
      .where('user.email = :email', { email });
    if (excludeId) {
      qb.andWhere('user.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  /** Check if username is already taken */
  async isUsernameTaken(username: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo.createQueryBuilder('user')
      .where('user.username = :username', { username });
    if (excludeId) {
      qb.andWhere('user.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }
}
