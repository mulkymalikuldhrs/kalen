/**
 * KALEN Server — Agent Repository Service
 * Wraps TypeORM repository for AgentEntity with business-relevant queries.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity, AgentRole, AgentStatus } from '../entities';

export interface CreateAgentParams {
  id: string;
  name: string;
  displayName: string;
  suffix: string;
  publicKey: string;
  capabilities?: {
    skills?: string[];
    tools?: string[];
    rateLimits?: Record<string, number>;
  };
  manifest?: Record<string, unknown> | null;
  scopes?: string[];
  role?: AgentRole;
  status?: AgentStatus;
  ownerId: string;
  agentCardUrl?: string;
}

export interface UpdateAgentParams {
  displayName?: string;
  capabilities?: {
    skills?: string[];
    tools?: string[];
    rateLimits?: Record<string, number>;
  };
  manifest?: Record<string, unknown> | null;
  scopes?: string[];
  role?: AgentRole;
  status?: AgentStatus;
  lastActiveAt?: Date;
  lastSeenAt?: Date;
  agentCardUrl?: string;
}

@Injectable()
export class AgentRepository {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly repo: Repository<AgentEntity>,
  ) {}

  /** Find agent by ID */
  async findById(id: string): Promise<AgentEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Find agent by name */
  async findByName(name: string): Promise<AgentEntity | null> {
    return this.repo.findOne({ where: { name } });
  }

  /** Find agents by owner ID */
  async findByOwner(ownerId: string, options?: { page?: number; limit?: number; status?: AgentStatus }): Promise<{ data: AgentEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('agent')
      .where('agent.ownerId = :ownerId', { ownerId });

    if (options?.status) {
      qb.andWhere('agent.status = :status', { status: options.status });
    }

    qb.orderBy('agent.createdAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Create a new agent */
  async create(params: CreateAgentParams): Promise<AgentEntity> {
    const agent = this.repo.create({
      id: params.id,
      name: params.name,
      displayName: params.displayName,
      suffix: params.suffix,
      publicKey: params.publicKey,
      capabilities: params.capabilities ?? {},
      manifest: params.manifest ?? null,
      scopes: params.scopes ?? [],
      role: params.role ?? AgentRole.AGENT_BASIC,
      status: params.status ?? AgentStatus.ACTIVE,
      ownerId: params.ownerId,
      agentCardUrl: params.agentCardUrl ?? null,
    });
    return this.repo.save(agent);
  }

  /** Update an existing agent */
  async update(id: string, params: UpdateAgentParams): Promise<AgentEntity | null> {
    const agent = await this.findById(id);
    if (!agent) return null;

    if (params.displayName !== undefined) agent.displayName = params.displayName;
    if (params.capabilities !== undefined) agent.capabilities = params.capabilities as any;
    if (params.manifest !== undefined) agent.manifest = params.manifest;
    if (params.scopes !== undefined) agent.scopes = params.scopes;
    if (params.role !== undefined) agent.role = params.role;
    if (params.status !== undefined) agent.status = params.status;
    if (params.lastActiveAt !== undefined) agent.lastActiveAt = params.lastActiveAt;
    if (params.lastSeenAt !== undefined) agent.lastSeenAt = params.lastSeenAt;
    if (params.agentCardUrl !== undefined) agent.agentCardUrl = params.agentCardUrl;

    return this.repo.save(agent);
  }

  /** Delete an agent by ID */
  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** List agents with pagination and optional filters */
  async list(options?: { ownerId?: string; status?: AgentStatus; page?: number; limit?: number }): Promise<{ data: AgentEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('agent');

    if (options?.ownerId) {
      qb.andWhere('agent.ownerId = :ownerId', { ownerId: options.ownerId });
    }
    if (options?.status) {
      qb.andWhere('agent.status = :status', { status: options.status });
    }

    qb.orderBy('agent.createdAt', 'DESC');
    qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Find agent by public key */
  async findByPublicKey(publicKey: string): Promise<AgentEntity | null> {
    return this.repo.findOne({ where: { publicKey } });
  }

  /** Count agents for a given owner */
  async countByOwner(ownerId: string): Promise<number> {
    return this.repo.count({ where: { ownerId } });
  }
}
