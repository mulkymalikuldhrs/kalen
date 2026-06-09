/**
 * KALEN Server — A2A Controller
 * Agent-to-agent communication endpoints.
 * Supports both REST and JSON-RPC 2.0 (A2A protocol) requests.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { A2aService } from './a2a.service';
import { CreateA2aTaskDto, JsonRpcRequestDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@kalen/identity';

@ApiTags('A2A Protocol')
@ApiBearerAuth('bearer')
@Controller('a2a')
@UseGuards(JwtAuthGuard, RbacGuard)
export class A2aController {
  constructor(private readonly a2aService: A2aService) {}

  /**
   * POST /api/v1/a2a/tasks
   * Create a new A2A task.
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new A2A task' })
  @RequirePermissions(Permission.A2A_TASK_CREATE)
  async createTask(@Body() dto: CreateA2aTaskDto, @Request() req: any) {
    return this.a2aService.createTask(
      dto.agentId,
      req.identity.sub,
      dto.creatorKind ?? req.identity.kind,
      dto.message,
    );
  }

  /**
   * GET /api/v1/a2a/agents/:id/card
   * Get an agent's card for discovery.
   */
  @Get('agents/:id/card')
  @ApiOperation({ summary: "Get an agent's A2A card for discovery" })
  @RequirePermissions(Permission.A2A_AGENT_DISCOVER)
  async getAgentCard(@Param('id') id: string) {
    return this.a2aService.getAgentCard(id);
  }

  /**
   * GET /api/v1/a2a/tasks
   * List tasks for the current user/agent.
   */
  @Get('tasks')
  @ApiOperation({ summary: 'List A2A tasks for the current identity' })
  @RequirePermissions(Permission.A2A_TASK_READ)
  async listTasks(@Request() req: any) {
    return this.a2aService.listTasksByCreator(req.identity.sub);
  }
}

/**
 * Separate controller for A2A JSON-RPC protocol endpoint.
 * POST /api/v1/a2a-rpc — handles JSON-RPC 2.0 requests per A2A specification.
 */
@ApiTags('A2A JSON-RPC')
@ApiBearerAuth('bearer')
@Controller('a2a-rpc')
export class A2aJsonRpcController {
  constructor(private readonly a2aService: A2aService) {}

  /**
   * POST /api/v1/a2a-rpc
   * Handle JSON-RPC 2.0 A2A protocol requests.
   * This endpoint follows the A2A specification for inter-agent communication.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Handle A2A JSON-RPC 2.0 protocol requests' })
  async handleJsonRpc(@Body() body: JsonRpcRequestDto) {
    return this.a2aService.handleJsonRpcRequest(body);
  }
}
