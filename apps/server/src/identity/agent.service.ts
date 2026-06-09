/**
 * KALEN Server — Agent Service
 * Manages agent identities, creation, verification, and RBAC using @kalen/identity.
 * Uses AgentRepository and UserRepository for database access.
 *
 * Key integration points:
 * - createAgentIdentity() from @kalen/identity generates Ed25519 keypair + signed manifest
 * - validateAgentName() from @kalen/shared enforces the (ai) suffix rule
 * - Ed25519Signer from @kalen/identity provides real cryptographic signing/verification
 * - The private key from createAgentIdentity is NOT stored — only the public key is persisted
 */

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentRepository } from '../database/repositories/agent.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { AgentRole, AgentStatus } from '../database/entities';
import { validateAgentName, validatePublicKey, AGENT_DISPLAY_SUFFIX } from '@kalen/shared';
import { createAgentIdentity, Ed25519Signer, type CreateAgentIdentityResult } from '@kalen/identity';
import { Permission } from '@kalen/identity';

@Injectable()
export class AgentService {
  constructor(
    private configService: ConfigService,
    private agentRepo: AgentRepository,
    private userRepo: UserRepository,
  ) {}

  /**
   * Create a new agent.
   * Requires a human JWT (ownerId from token).
   *
   * Flow:
   * 1. Validate display name ends with (ai) via @kalen/shared
   * 2. Validate Ed25519 public key format via @kalen/shared
   * 3. Verify owner exists in database
   * 4. Create agent identity via @kalen/identity (generates keypair + manifest)
   * 5. Persist to database with public key, manifest, and scopes
   */
  async createAgent(
    ownerId: string,
    displayName: string,
    publicKey: string,
    capabilities?: { skills?: string[]; tools?: string[]; rateLimits?: Record<string, number> },
  ) {
    // Validate display name ends with (ai)
    const nameValidation = validateAgentName(displayName);
    if (!nameValidation.valid) {
      throw new BadRequestException({
        error: 'SUFFIX_VIOLATION',
        message: nameValidation.error ?? `Agent display name must end with "${AGENT_DISPLAY_SUFFIX}"`,
        details: [{ field: 'displayName', message: nameValidation.error ?? 'Invalid agent name' }],
      });
    }

    // Validate public key format
    const keyValidation = validatePublicKey(publicKey);
    if (!keyValidation.valid) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: keyValidation.error ?? 'Invalid public key',
        details: [{ field: 'publicKey', message: keyValidation.error ?? 'Invalid public key format' }],
      });
    }

    // Verify owner exists and is a human user
    const owner = await this.userRepo.findById(ownerId);
    if (!owner) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Owner identity not found',
      });
    }

    if (owner.kind !== 'human') {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Only human users can create agents',
      });
    }

    // Generate suffix for agent
    const suffix = this.generateAgentSuffix(displayName);

    // Create agent identity using @kalen/identity
    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const tools = capabilities?.tools ?? [];
    const skills = capabilities?.skills ?? [];
    const scopes = this.inferScopesFromCapabilities(skills, tools);

    let identityResult: CreateAgentIdentityResult;
    try {
      identityResult = await createAgentIdentity(
        displayName,
        `Agent ${displayName}`,
        ownerId,
        tools,
        skills,
        scopes,
        jwtSecret,
      );
    } catch (err) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to create agent identity',
      });
    }

    // Use the agent ID from the identity creation
    const agentId = identityResult.identity.agentId;

    // Store the public key from the client request (for Ed25519 auth verification)
    const agent = await this.agentRepo.create({
      id: agentId,
      name: displayName, // Agent name (must end with (ai))
      displayName,
      suffix,
      publicKey, // Client-provided public key for authentication
      capabilities: capabilities ?? {},
      manifest: identityResult.identity.manifest as unknown as Record<string, unknown>,
      scopes,
      role: scopes.length > 5 ? AgentRole.AGENT_PRIVILEGED : AgentRole.AGENT_BASIC,
      status: AgentStatus.ACTIVE,
      ownerId,
    });

    return {
      id: agent.id,
      suffix,
      entityType: 'agent',
      displayName,
      publicKey,
      capabilities: capabilities ?? {},
      ownerId,
      status: 'active',
      createdAt: agent.createdAt.toISOString(),
      accessToken: identityResult.accessToken,
    };
  }

  /**
   * Get agent by ID.
   */
  async getAgent(id: string) {
    const agent = await this.agentRepo.findById(id);
    if (!agent) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Agent "${id}" not found`,
      });
    }
    return this.formatAgent(agent);
  }

  /**
   * List agents with optional filters.
   */
  async listAgents(options?: { ownerId?: string; status?: string; page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    const statusFilter = options?.status as AgentStatus | undefined;
    const { data: agents, total } = await this.agentRepo.list({
      ownerId: options?.ownerId,
      status: statusFilter,
      page,
      limit,
    });

    return {
      data: agents.map((a) => this.formatAgent(a)),
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
   * Update agent.
   */
  async updateAgent(id: string, updates: { displayName?: string; capabilities?: Record<string, unknown>; status?: 'active' | 'suspended' | 'deactivated' }) {
    const agent = await this.agentRepo.findById(id);
    if (!agent) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Agent "${id}" not found`,
      });
    }

    if (updates.displayName !== undefined) {
      const nameValidation = validateAgentName(updates.displayName);
      if (!nameValidation.valid) {
        throw new BadRequestException({
          error: 'SUFFIX_VIOLATION',
          message: nameValidation.error,
        });
      }
    }

    const updateParams: any = {};
    if (updates.displayName !== undefined) updateParams.displayName = updates.displayName;
    if (updates.capabilities !== undefined) updateParams.capabilities = updates.capabilities as any;
    if (updates.status !== undefined) updateParams.status = updates.status as AgentStatus;

    const updated = await this.agentRepo.update(id, updateParams);
    if (!updated) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Agent "${id}" not found after update`,
      });
    }

    return this.formatAgent(updated);
  }

  /**
   * Get agent manifest.
   */
  async getAgentManifest(id: string) {
    const agent = await this.agentRepo.findById(id);
    if (!agent) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Agent "${id}" not found`,
      });
    }
    return agent.manifest;
  }

  /**
   * Format an agent entity for API response.
   */
  private formatAgent(agent: AgentEntity) {
    return {
      id: agent.id,
      name: agent.name,
      suffix: agent.suffix,
      entityType: 'agent',
      displayName: agent.displayName,
      publicKey: agent.publicKey,
      capabilities: agent.capabilities,
      ownerId: agent.ownerId,
      status: agent.status,
      scopes: agent.scopes,
      role: agent.role,
      createdAt: agent.createdAt.toISOString(),
      lastActiveAt: agent.lastActiveAt?.toISOString() ?? null,
      lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
    };
  }

  /**
   * Generate an agent suffix: @name.agent#hex4
   */
  private generateAgentSuffix(displayName: string): string {
    const base = displayName
      .replace(AGENT_DISPLAY_SUFFIX, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    const hex = crypto.randomUUID().slice(0, 4);
    return `@${base}.agent#${hex}`;
  }

  /**
   * Infer permission scopes from capabilities.
   * Maps declared skills and tools to KALEN permission enums.
   */
  private inferScopesFromCapabilities(skills: string[], tools: string[]): string[] {
    const scopes: string[] = [];

    if (skills.length > 0 || tools.length > 0) {
      scopes.push(Permission.MCP_TOOL_CALL);
      scopes.push(Permission.MCP_TOOL_LIST);
    }

    if (skills.some((s) => s.startsWith('code.'))) {
      scopes.push(Permission.MESSAGE_SEND);
      scopes.push(Permission.ROOM_CREATE);
    }

    // Default agent scopes
    scopes.push(Permission.MESSAGE_READ);
    scopes.push(Permission.IDENTITY_READ);

    return [...new Set(scopes)];
  }
}
