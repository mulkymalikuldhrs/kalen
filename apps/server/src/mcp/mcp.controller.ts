/**
 * KALEN Server — MCP Controller
 * MCP tool discovery, invocation, and server management.
 * Routes match the API.md specification.
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { McpService } from './mcp.service';
import { InvokeToolDto, RegisterServerDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission, Role } from '@kalen/identity';

@ApiTags('MCP Gateway')
@ApiBearerAuth('bearer')
@Controller('mcp')
@UseGuards(JwtAuthGuard, RbacGuard)
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  /**
   * GET /api/v1/mcp/tools
   * List available tools.
   */
  @Get('tools')
  @ApiOperation({ summary: 'List all available MCP tools' })
  @RequirePermissions(Permission.MCP_TOOL_LIST)
  async listTools() {
    const tools = this.mcpService.listTools();
    return { data: tools };
  }

  /**
   * POST /api/v1/mcp/invoke
   * Invoke a tool.
   */
  @Post('invoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invoke an MCP tool' })
  @RequirePermissions(Permission.MCP_TOOL_CALL)
  async invokeTool(@Body() dto: InvokeToolDto, @Request() req: any) {
    // Determine role from identity
    const role = req.identity.kind === 'agent' ? Role.AGENT_BASIC : Role.HUMAN_USER;

    return this.mcpService.invokeTool(
      dto.toolId,
      dto.input,
      req.identity.sub,
      req.identity.kind,
      role,
      dto.requestId,
    );
  }

  /**
   * GET /api/v1/mcp/servers
   * List registered MCP servers. (Admin)
   */
  @Get('servers')
  @ApiOperation({ summary: 'List registered MCP servers (admin)' })
  @RequirePermissions(Permission.MCP_SERVER_MANAGE)
  async listServers() {
    const servers = this.mcpService.listServers();
    return { data: servers };
  }

  /**
   * POST /api/v1/mcp/servers
   * Register an MCP server. (Admin)
   */
  @Post('servers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new MCP server (admin)' })
  @RequirePermissions(Permission.MCP_SERVER_REGISTER)
  async registerServer(@Body() dto: RegisterServerDto) {
    return this.mcpService.registerServer(dto.serverId, dto.serverName, dto.transport, dto.endpoint, dto.apiKey);
  }

  /**
   * DELETE /api/v1/mcp/servers/:id
   * Remove an MCP server. (Admin)
   */
  @Delete('servers/:id')
  @ApiOperation({ summary: 'Remove an MCP server (admin)' })
  @RequirePermissions(Permission.MCP_SERVER_MANAGE)
  async removeServer(@Param('id') id: string) {
    return this.mcpService.unregisterServer(id);
  }
}
