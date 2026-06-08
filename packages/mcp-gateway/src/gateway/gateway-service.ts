/**
 * KALEN MCP Gateway Service
 * Central gateway orchestrating multiple MCP clients/servers.
 * Routes tool calls, enforces RBAC, and audits every invocation.
 */

import type { MCPTool, MCPResource, MCPCallResult, MCPToolInvocation, MCPServerInfo } from "@kalen/shared";
import type { Role, Permission } from "@kalen/identity";
import { checkPermission } from "@kalen/identity";
import { MCPClient, type MCPClientConfig } from "../client/mcp-client";
import { MCPServer, type ToolHandler, type ToolCallContext } from "../server/mcp-server";
import { AllowList } from "../governance/allowlist";

/** Audit log entry */
export interface AuditLogEntry {
  invocationId: string;
  timestamp: string;
  toolName: string;
  callerId: string;
  callerKind: "human" | "agent";
  serverId: string;
  accessDecision: "allowed" | "denied";
  denialReason?: string;
  durationMs?: number;
  error?: string;
}

/** Gateway configuration */
export interface GatewayConfig {
  /** Maximum concurrent tool calls per caller */
  maxConcurrentCalls: number;
  /** Default timeout for tool calls (ms) */
  defaultTimeout: number;
  /** Whether RBAC enforcement is active */
  rbacEnabled: boolean;
}

/** Registered MCP server in the gateway */
interface RegisteredServer {
  serverId: string;
  client: MCPClient;
  config: MCPClientConfig;
  tools: MCPTool[];
}

const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  maxConcurrentCalls: 10,
  defaultTimeout: 30_000,
  rbacEnabled: true,
};

/**
 * MCP Gateway Service — the central hub for tool routing, RBAC, and audit.
 *
 * Responsibilities:
 * 1. Maintain a registry of connected MCP servers and their tools
 * 2. Route tool calls to the correct MCP server
 * 3. Enforce RBAC before tool invocation
 * 4. Audit log every call
 */
export class GatewayService {
  private config: GatewayConfig;
  private servers: Map<string, RegisteredServer> = new Map();
  private toolRegistry: Map<string, { serverId: string; tool: MCPTool }> = new Map();
  private localServer: MCPServer;
  private allowList: AllowList;
  private auditLog: AuditLogEntry[] = [];
  private activeCalls: Map<string, number> = new Map(); // callerId → count

  constructor(config?: Partial<GatewayConfig>) {
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config };
    this.localServer = new MCPServer();
    this.allowList = new AllowList();
  }

  /**
   * Get the local MCP server instance for registering custom tools.
   */
  getLocalServer(): MCPServer {
    return this.localServer;
  }

  /**
   * Get the allow list for tool governance.
   */
  getAllowList(): AllowList {
    return this.allowList;
  }

  /**
   * Register an MCP server by connecting to it and discovering its tools.
   *
   * @param serverId - Unique identifier for this server
   * @param clientConfig - MCP client connection config
   * @returns The connected server info
   */
  async registerServer(
    serverId: string,
    clientConfig: MCPClientConfig,
  ): Promise<MCPServerInfo> {
    if (this.servers.has(serverId)) {
      throw new Error(`Server "${serverId}" is already registered`);
    }

    const client = new MCPClient(clientConfig);
    await client.connectToServer();

    const tools = await client.listTools();
    const resources = await client.listResources();
    const serverCapabilities = client.getServerCapabilities();
    const serverInfo = client.getServerInfo();

    // Register all tools in the routing table
    for (const tool of tools) {
      const qualifiedName = `${serverId}:${tool.name}`;
      this.toolRegistry.set(qualifiedName, { serverId, tool });
      // Also register by simple name if no collision
      if (!this.toolRegistry.has(tool.name)) {
        this.toolRegistry.set(tool.name, { serverId, tool });
      }
    }

    const registered: RegisteredServer = {
      serverId,
      client,
      config: clientConfig,
      tools,
    };

    this.servers.set(serverId, registered);

    return {
      serverId,
      name: serverInfo?.name ?? clientConfig.serverName,
      version: serverInfo?.version ?? "unknown",
      transport: clientConfig.transport,
      endpoint: clientConfig.endpoint,
      tools,
      resources,
      status: "connected",
      lastHealthCheck: new Date().toISOString(),
    };
  }

  /**
   * Unregister an MCP server and remove its tools from the routing table.
   *
   * @param serverId - Server to unregister
   */
  async unregisterServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      return;
    }

    await server.client.disconnect();

    // Remove tools from registry
    for (const [toolName, entry] of this.toolRegistry.entries()) {
      if (entry.serverId === serverId) {
        this.toolRegistry.delete(toolName);
      }
    }

    this.servers.delete(serverId);
  }

  /**
   * List all available tools across all registered servers.
   */
  listAllTools(): MCPTool[] {
    const seen = new Set<string>();
    const tools: MCPTool[] = [];

    for (const [, entry] of this.toolRegistry.entries()) {
      if (!seen.has(entry.tool.name)) {
        seen.add(entry.tool.name);
        tools.push(entry.tool);
      }
    }

    // Include local server tools
    for (const tool of this.localServer.listTools()) {
      if (!seen.has(tool.name)) {
        seen.add(tool.name);
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * List all registered servers.
   */
  listServers(): MCPServerInfo[] {
    const result: MCPServerInfo[] = [];

    for (const [serverId, server] of this.servers.entries()) {
      const serverInfo = server.client.getServerInfo();
      result.push({
        serverId,
        name: serverInfo?.name ?? server.config.serverName,
        version: serverInfo?.version ?? "unknown",
        transport: server.config.transport,
        endpoint: server.config.endpoint,
        tools: server.tools,
        resources: [],
        status: server.client.getState() === "connected" ? "connected" : "error",
      });
    }

    // Include local server
    result.push({
      serverId: "local",
      name: "kalen-mcp-server",
      version: "0.1.0",
      transport: "sse",
      endpoint: "local",
      tools: this.localServer.listTools(),
      resources: this.localServer.listResources(),
      status: "connected",
    });

    return result;
  }

  /**
   * Route a tool call to the correct MCP server.
   * Enforces RBAC and allowlist before invocation.
   * Audit logs every call regardless of outcome.
   *
   * @param toolName - Name of the tool to invoke
   * @param args - Tool arguments
   * @param callerId - Caller identity ID
   * @param callerKind - Caller identity kind
   * @param role - Caller's RBAC role (for RBAC check)
   * @param requiredPermission - Required permission for this tool
   */
  async routeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    callerId: string,
    callerKind: "human" | "agent",
    role: Role,
    requiredPermission: Permission,
  ): Promise<MCPToolInvocation> {
    const invocationId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    const invocation: MCPToolInvocation = {
      invocationId,
      toolName,
      arguments: args,
      callerId,
      callerKind,
      serverId: "unknown",
      startedAt,
      accessDecision: "allowed",
    };

    // Check concurrent call limit
    const activeCount = this.activeCalls.get(callerId) ?? 0;
    if (activeCount >= this.config.maxConcurrentCalls) {
      invocation.accessDecision = "denied";
      invocation.denialReason = "Concurrent call limit exceeded";
      this.recordAudit(invocation, 0);
      return invocation;
    }

    // RBAC check
    if (this.config.rbacEnabled && !checkPermission(role, requiredPermission)) {
      invocation.accessDecision = "denied";
      invocation.denialReason = `Role "${role}" lacks permission "${requiredPermission}"`;
      this.recordAudit(invocation, 0);
      return invocation;
    }

    // Allowlist check
    if (!this.allowList.isAllowed(callerId, toolName)) {
      invocation.accessDecision = "denied";
      invocation.denialReason = `Tool "${toolName}" is not in allowlist for caller "${callerId}"`;
      this.recordAudit(invocation, 0);
      return invocation;
    }

    // Route to server
    this.activeCalls.set(callerId, activeCount + 1);

    try {
      let result: MCPCallResult;

      // Check local server first
      const localTools = this.localServer.listTools();
      if (localTools.some((t) => t.name === toolName)) {
        invocation.serverId = "local";
        result = await this.localServer.callTool(toolName, args, {
          callerId,
          callerKind,
          requestId: invocationId,
        });
      } else {
        // Route to remote server
        const routingEntry = this.toolRegistry.get(toolName);
        if (!routingEntry) {
          invocation.accessDecision = "denied";
          invocation.denialReason = `No server found for tool "${toolName}"`;
          this.recordAudit(invocation, 0);
          return invocation;
        }

        invocation.serverId = routingEntry.serverId;
        const server = this.servers.get(routingEntry.serverId);
        if (!server) {
          invocation.accessDecision = "denied";
          invocation.denialReason = `Server "${routingEntry.serverId}" is not connected`;
          this.recordAudit(invocation, 0);
          return invocation;
        }

        result = await server.client.callTool(toolName, args, callerId, callerKind);
      }

      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      invocation.result = result;
      invocation.completedAt = completedAt;
      invocation.durationMs = durationMs;

      this.recordAudit(invocation, durationMs);

      return invocation;
    } catch (err) {
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      invocation.result = {
        isError: true,
        content: [
          {
            type: "text",
            text: err instanceof Error ? err.message : "Unknown error during tool call",
          },
        ],
      };
      invocation.completedAt = completedAt;
      invocation.durationMs = durationMs;

      this.recordAudit(invocation, durationMs);

      return invocation;
    } finally {
      const count = this.activeCalls.get(callerId) ?? 0;
      this.activeCalls.set(callerId, Math.max(0, count - 1));
    }
  }

  /**
   * Get the audit log.
   *
   * @param limit - Maximum entries to return
   * @param offset - Pagination offset
   */
  getAuditLog(limit: number = 100, offset: number = 0): AuditLogEntry[] {
    return this.auditLog.slice(offset, offset + limit);
  }

  /**
   * Get audit log entries for a specific caller.
   */
  getAuditLogForCaller(callerId: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLog
      .filter((entry) => entry.callerId === callerId)
      .slice(0, limit);
  }

  /**
   * Health check — verify all server connections.
   */
  async healthCheck(): Promise<{ serverId: string; healthy: boolean }[]> {
    const results: { serverId: string; healthy: boolean }[] = [];

    for (const [serverId, server] of this.servers.entries()) {
      const state = server.client.getState();
      results.push({ serverId, healthy: state === "connected" });
    }

    results.push({ serverId: "local", healthy: true });

    return results;
  }

  /**
   * Shutdown all connections.
   */
  async shutdown(): Promise<void> {
    for (const [serverId, server] of this.servers.entries()) {
      await server.client.disconnect();
    }
    this.servers.clear();
    this.toolRegistry.clear();
    this.activeCalls.clear();
  }

  private recordAudit(invocation: MCPToolInvocation, durationMs: number): void {
    this.auditLog.push({
      invocationId: invocation.invocationId,
      timestamp: invocation.startedAt,
      toolName: invocation.toolName,
      callerId: invocation.callerId,
      callerKind: invocation.callerKind,
      serverId: invocation.serverId,
      accessDecision: invocation.accessDecision,
      denialReason: invocation.denialReason,
      durationMs,
      error: invocation.result?.isError
        ? invocation.result.content.map((c) => c.text ?? "").join("; ")
        : undefined,
    });
  }
}
