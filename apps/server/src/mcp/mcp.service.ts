/**
 * KALEN Server — MCP Service
 * MCP gateway integration — tool discovery, invocation, and RBAC enforcement.
 * Uses @kalen/mcp-gateway for the GatewayService.
 */

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpCallEntity } from '../database/entities/mcp-call.entity';
import { GatewayService, type GatewayConfig } from '@kalen/mcp-gateway';
import { Role, Permission, checkPermission } from '@kalen/identity';

@Injectable()
export class McpService {
  private gateway: GatewayService;

  constructor(
    private configService: ConfigService,
    @InjectRepository(McpCallEntity)
    private mcpCallRepo: Repository<McpCallEntity>,
  ) {
    const gatewayConfig: Partial<GatewayConfig> = {
      maxConcurrentCalls: configService.get<number>('mcp.maxConcurrentCalls', 10),
      defaultTimeout: configService.get<number>('mcp.defaultTimeout', 30000),
      rbacEnabled: true,
    };

    this.gateway = new GatewayService(gatewayConfig);
  }

  /**
   * List all available MCP tools.
   * Uses @kalen/mcp-gateway GatewayService.listAllTools().
   */
  listTools() {
    return this.gateway.listAllTools();
  }

  /**
   * List all registered MCP servers.
   * Uses @kalen/mcp-gateway GatewayService.listServers().
   */
  listServers() {
    return this.gateway.listServers();
  }

  /**
   * Invoke an MCP tool.
   * Routes through @kalen/mcp-gateway GatewayService.routeToolCall()
   * which handles RBAC, allowlist, and audit logging.
   * Results are persisted to the mcp_calls table for audit and billing.
   */
  async invokeTool(
    toolId: string,
    input: Record<string, unknown>,
    callerId: string,
    callerKind: 'human' | 'agent',
    callerRole: Role,
    requestId?: string,
  ) {
    // Determine required permission based on caller kind
    const requiredPermission =
      callerKind === 'agent' ? Permission.MCP_TOOL_CALL : Permission.MCP_TOOL_LIST;

    const startTime = Date.now();

    // Route through the gateway (handles RBAC, allowlist, routing)
    const invocation = await this.gateway.routeToolCall(
      toolId,
      input,
      callerId,
      callerKind,
      callerRole,
      requiredPermission,
    );

    // Record the call in our database for audit and billing
    const callEntity = this.mcpCallRepo.create({
      id: invocation.invocationId,
      toolName: toolId,
      serverId: invocation.serverId,
      callerId,
      callerKind,
      input,
      output: invocation.result ? { content: invocation.result.content, isError: invocation.result.isError } as any : null,
      isError: invocation.result?.isError ?? false,
      errorMessage: invocation.result?.isError
        ? invocation.result.content.map((c) => c.text ?? '').join('; ')
        : null,
      accessDecision: invocation.accessDecision,
      denialReason: invocation.denialReason ?? null,
      durationMs: invocation.durationMs ?? null,
      requestId: requestId ?? null,
    });

    await this.mcpCallRepo.save(callEntity);

    return {
      requestId: requestId ?? invocation.invocationId,
      toolId,
      output: invocation.result?.content ?? [],
      isError: invocation.result?.isError ?? invocation.accessDecision === 'denied',
      traceId: invocation.invocationId,
      durationMs: invocation.durationMs ?? Date.now() - startTime,
    };
  }

  /**
   * Get gateway health check.
   * Uses @kalen/mcp-gateway GatewayService.healthCheck().
   */
  async healthCheck() {
    return this.gateway.healthCheck();
  }

  /**
   * Register an MCP server.
   * TODO: Wire to real MCPClientConfig from environment/config.
   * The GatewayService.registerServer() requires an MCPClientConfig
   * with transport and endpoint details.
   */
  async registerServer(
    serverId: string,
    serverName: string,
    transport: 'stdio' | 'sse' | 'websocket',
    endpoint: string,
    apiKey?: string,
  ) {
    // TODO: Wire to real MCPClientConfig — need to instantiate MCPClient
    // with the proper transport configuration
    throw new Error('Server registration not yet implemented — configure via environment');
  }

  /**
   * Unregister an MCP server.
   * Uses @kalen/mcp-gateway GatewayService.unregisterServer().
   */
  async unregisterServer(serverId: string) {
    await this.gateway.unregisterServer(serverId);
    return { serverId, status: 'removed' };
  }
}
