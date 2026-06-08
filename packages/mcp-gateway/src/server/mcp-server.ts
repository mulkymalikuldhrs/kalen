/**
 * KALEN MCP Server
 * KALEN's own MCP server exposing internal tools for agents.
 */

import type { MCPTool, MCPResource, MCPCallResult, JSONSchemaObject } from "@kalen/shared";

/** Tool handler function type */
export type ToolHandler = (args: Record<string, unknown>, context: ToolCallContext) => Promise<MCPCallResult>;

/** Context provided to tool handlers */
export interface ToolCallContext {
  /** Caller identity ID */
  callerId: string;
  /** Caller identity kind */
  callerKind: "human" | "agent";
  /** Request ID for tracing */
  requestId: string;
}

/** Tool registration entry */
interface RegisteredTool {
  definition: MCPTool;
  handler: ToolHandler;
}

/** Resource handler function type */
export type ResourceHandler = (uri: string, context: ResourceReadContext) => Promise<unknown>;

/** Context for resource reads */
export interface ResourceReadContext {
  callerId: string;
  callerKind: "human" | "agent";
}

/** Resource registration entry */
interface RegisteredResource {
  definition: MCPResource;
  handler: ResourceHandler;
}

/**
 * KALEN MCP Server — exposes internal KALEN tools and resources to MCP clients.
 *
 * Built-in tools:
 * - send_message: Send a message in a room
 * - create_room: Create a new room
 * - list_rooms: List accessible rooms
 * - invite_user: Invite a user to a room
 * - search_messages: Search messages
 * - manage_agent: Manage agent identity/scopes
 */
export class MCPServer {
  private tools: Map<string, RegisteredTool> = new Map();
  private resources: Map<string, RegisteredResource> = new Map();
  private serverInfo = { name: "kalen-mcp-server", version: "0.1.0" };

  constructor() {
    this.registerBuiltinTools();
    this.registerBuiltinResources();
  }

  /**
   * Register a tool with the MCP server.
   */
  registerTool(definition: MCPTool, handler: ToolHandler): void {
    if (this.tools.has(definition.name)) {
      throw new Error(`Tool "${definition.name}" is already registered`);
    }
    this.tools.set(definition.name, { definition, handler });
  }

  /**
   * Register a resource with the MCP server.
   */
  registerResource(definition: MCPResource, handler: ResourceHandler): void {
    if (this.resources.has(definition.uri)) {
      throw new Error(`Resource "${definition.uri}" is already registered`);
    }
    this.resources.set(definition.uri, { definition, handler });
  }

  /**
   * List all registered tools.
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * List all registered resources.
   */
  listResources(): MCPResource[] {
    return Array.from(this.resources.values()).map((r) => r.definition);
  }

  /**
   * Invoke a tool by name.
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
      };
    }

    try {
      return await tool.handler(args, context);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown tool execution error";
      return {
        isError: true,
        content: [{ type: "text", text: `Tool execution error: ${message}` }],
      };
    }
  }

  /**
   * Read a resource by URI.
   */
  async readResource(uri: string, context: ResourceReadContext): Promise<unknown> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Unknown resource: ${uri}`);
    }
    return resource.handler(uri, context);
  }

  /**
   * Get server info for MCP handshake.
   */
  getServerInfo(): { name: string; version: string } {
    return { ...this.serverInfo };
  }

  // ─── Built-in Tool Definitions ────────────────────────────────

  private registerBuiltinTools(): void {
    this.registerTool(
      {
        name: "send_message",
        description: "Send a message to a room in KALEN",
        inputSchema: {
          type: "object",
          properties: {
            roomId: { type: "string", description: "Target room ID" },
            content: { type: "string", description: "Message content" },
            contentType: { type: "string", enum: ["text", "markdown"], description: "Content format" },
          },
          required: ["roomId", "content"],
        },
      },
      this.handleSendMessage.bind(this),
    );

    this.registerTool(
      {
        name: "create_room",
        description: "Create a new room in KALEN",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["direct", "group", "agent-workspace"], description: "Room type" },
            name: { type: "string", description: "Room name (required for group/agent-workspace)" },
            memberIds: {
              type: "array",
              items: { type: "string" },
              description: "Initial member IDs to invite",
            },
          },
          required: ["type"],
        },
      },
      this.handleCreateRoom.bind(this),
    );

    this.registerTool(
      {
        name: "list_rooms",
        description: "List rooms accessible to the caller",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["direct", "group", "agent-workspace", "system"], description: "Filter by room type" },
            limit: { type: "number", description: "Maximum rooms to return (default 50)" },
            offset: { type: "number", description: "Pagination offset" },
          },
        },
      },
      this.handleListRooms.bind(this),
    );

    this.registerTool(
      {
        name: "invite_user",
        description: "Invite a user or agent to a room",
        inputSchema: {
          type: "object",
          properties: {
            roomId: { type: "string", description: "Room ID" },
            userId: { type: "string", description: "User or agent ID to invite" },
            userKind: { type: "string", enum: ["human", "agent"], description: "Kind of entity being invited" },
          },
          required: ["roomId", "userId", "userKind"],
        },
      },
      this.handleInviteUser.bind(this),
    );

    this.registerTool(
      {
        name: "search_messages",
        description: "Search messages across accessible rooms",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query string" },
            roomId: { type: "string", description: "Limit search to a specific room" },
            limit: { type: "number", description: "Maximum results (default 20)" },
          },
          required: ["query"],
        },
      },
      this.handleSearchMessages.bind(this),
    );

    this.registerTool(
      {
        name: "manage_agent",
        description: "Manage agent identity and scopes (admin only)",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["update_scope", "deactivate", "reactivate"], description: "Management action" },
            agentId: { type: "string", description: "Target agent ID" },
            scopes: { type: "array", items: { type: "string" }, description: "New scopes (for update_scope)" },
          },
          required: ["action", "agentId"],
        },
      },
      this.handleManageAgent.bind(this),
    );
  }

  private registerBuiltinResources(): void {
    this.registerResource(
      {
        uri: "kalen://rooms/recent",
        name: "Recent Rooms",
        description: "List of recently active rooms for the caller",
        mimeType: "application/json",
      },
      this.handleReadRecentRooms.bind(this),
    );

    this.registerResource(
      {
        uri: "kalen://identity/me",
        name: "My Identity",
        description: "The caller's identity information",
        mimeType: "application/json",
      },
      this.handleReadMyIdentity.bind(this),
    );
  }

  // ─── Built-in Tool Handlers ───────────────────────────────────
  // These are default implementations that can be overridden
  // by the gateway service with real data access.

  private async handleSendMessage(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    const roomId = args.roomId as string;
    const content = args.content as string;
    const contentType = (args.contentType as string) ?? "text";

    if (!roomId || !content) {
      return { isError: true, content: [{ type: "text", text: "roomId and content are required" }] };
    }

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: "message_sent",
            roomId,
            content,
            contentType,
            senderId: context.callerId,
            senderKind: context.callerKind,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  private async handleCreateRoom(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    const type = args.type as string;
    const name = args.name as string | undefined;
    const memberIds = args.memberIds as string[] | undefined;

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: "room_created",
            type,
            name: name ?? null,
            memberIds: memberIds ?? [],
            createdBy: context.callerId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  private async handleListRooms(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    return {
      isError: false,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: "rooms_listed",
            filter: args.type ?? null,
            rooms: [],
            callerId: context.callerId,
          }),
        },
      ],
    };
  }

  private async handleInviteUser(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    const roomId = args.roomId as string;
    const userId = args.userId as string;
    const userKind = args.userKind as string;

    if (!roomId || !userId || !userKind) {
      return { isError: true, content: [{ type: "text", text: "roomId, userId, and userKind are required" }] };
    }

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: "user_invited",
            roomId,
            userId,
            userKind,
            invitedBy: context.callerId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  private async handleSearchMessages(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    const query = args.query as string;

    if (!query) {
      return { isError: true, content: [{ type: "text", text: "query is required" }] };
    }

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: "messages_searched",
            query,
            roomId: args.roomId ?? null,
            results: [],
            callerId: context.callerId,
          }),
        },
      ],
    };
  }

  private async handleManageAgent(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<MCPCallResult> {
    const action = args.action as string;
    const agentId = args.agentId as string;

    if (!action || !agentId) {
      return { isError: true, content: [{ type: "text", text: "action and agentId are required" }] };
    }

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: `agent_${action}`,
            agentId,
            scopes: args.scopes ?? null,
            performedBy: context.callerId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  private async handleReadRecentRooms(uri: string, context: ResourceReadContext): Promise<unknown> {
    return {
      uri,
      rooms: [],
      callerId: context.callerId,
    };
  }

  private async handleReadMyIdentity(uri: string, context: ResourceReadContext): Promise<unknown> {
    return {
      uri,
      id: context.callerId,
      kind: context.callerKind,
    };
  }
}
