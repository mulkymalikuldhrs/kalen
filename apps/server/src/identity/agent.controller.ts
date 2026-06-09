/**
 * KALEN Server — Agent Controller
 * CRUD operations for agent identities.
 * Routes match the API.md specification.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { CreateAgentDto, UpdateAgentDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@kalen/identity';

@ApiTags('Agents')
@ApiBearerAuth('bearer')
@Controller('agents')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * POST /api/v1/agents
   * Create a new agent. Requires human JWT.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new agent with Ed25519 keypair' })
  @RequirePermissions(Permission.AGENT_CREATE)
  async create(@Body() dto: CreateAgentDto, @Request() req: any) {
    return this.agentService.createAgent(
      req.identity.sub,
      dto.displayName,
      dto.publicKey,
      dto.capabilities as any,
    );
  }

  /**
   * GET /api/v1/agents
   * List agents.
   */
  @Get()
  @ApiOperation({ summary: 'List agents with optional filters' })
  @RequirePermissions(Permission.AGENT_READ)
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
  ) {
    return this.agentService.listAgents({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      ownerId,
      status,
    });
  }

  /**
   * GET /api/v1/agents/:id
   * Get agent details.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get agent details by ID' })
  @RequirePermissions(Permission.AGENT_READ)
  async get(@Param('id') id: string) {
    return this.agentService.getAgent(id);
  }

  /**
   * PATCH /api/v1/agents/:id
   * Update agent.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update agent details' })
  @RequirePermissions(Permission.AGENT_UPDATE_ANY)
  async update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentService.updateAgent(id, dto);
  }

  /**
   * DELETE /api/v1/agents/:id
   * Revoke agent (soft delete via status change).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an agent (soft delete)' })
  @RequirePermissions(Permission.AGENT_DEACTIVATE_ANY)
  async revoke(@Param('id') id: string) {
    return this.agentService.updateAgent(id, { status: 'revoked' });
  }

  /**
   * GET /api/v1/agents/:id/manifest
   * Get agent manifest.
   */
  @Get(':id/manifest')
  @ApiOperation({ summary: "Get agent's signed manifest" })
  @RequirePermissions(Permission.AGENT_READ)
  async getManifest(@Param('id') id: string) {
    return this.agentService.getAgentManifest(id);
  }
}
