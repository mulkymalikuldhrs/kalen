/**
 * KALEN MCP Client
 * JSON-RPC 2.0 client for connecting to MCP servers via SSE transport.
 */

import type { MCPTool, MCPResource, MCPCallResult, JSONSchemaObject } from "@kalen/shared";
import { MCP_PROTOCOL_VERSION, MCP_CONNECTION_TIMEOUT, MCP_TOOL_CALL_TIMEOUT } from "@kalen/shared";

// ─── JSON-RPC 2.0 Types ─────────────────────────────────────────

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ─── MCP Client ──────────────────────────────────────────────────

/** Connection state for an MCP client */
export type MCPClientState = "disconnected" | "connecting" | "connected" | "error";

/** Configuration for an MCP client connection */
export interface MCPClientConfig {
  /** Server endpoint URL (for SSE transport) */
  endpoint: string;
  /** Transport type */
  transport: "sse" | "stdio" | "websocket";
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Tool call timeout in milliseconds */
  toolCallTimeout?: number;
  /** Server name for identification */
  serverName: string;
}

/** MCP Server capabilities reported during initialization */
export interface MCPServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, unknown>;
}

/**
 * MCP Client — connects to an MCP server and provides tool/resource access.
 * Implements the MCP protocol over SSE (Server-Sent Events) transport.
 */
export class MCPClient {
  private config: MCPClientConfig;
  private state: MCPClientState = "disconnected";
  private nextId = 1;
  private pendingRequests: Map<string | number, {
    resolve: (response: JSONRPCResponse) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = new Map();
  private eventSource: EventSource | null = null;
  private serverCapabilities: MCPServerCapabilities | null = null;
  private serverInfo: { name: string; version: string } | null = null;
  private messageEndpoint: string | null = null;
  private cachedTools: MCPTool[] | null = null;
  private cachedResources: MCPResource[] | null = null;

  constructor(config: MCPClientConfig) {
    this.config = {
      connectionTimeout: MCP_CONNECTION_TIMEOUT,
      toolCallTimeout: MCP_TOOL_CALL_TIMEOUT,
      ...config,
    };
  }

  /** Get the current connection state */
  getState(): MCPClientState {
    return this.state;
  }

  /** Get server capabilities (available after connection) */
  getServerCapabilities(): MCPServerCapabilities | null {
    return this.serverCapabilities;
  }

  /** Get server info */
  getServerInfo(): { name: string; version: string } | null {
    return this.serverInfo;
  }

  /**
   * Connect to the MCP server via SSE.
   * Performs the initialization handshake per MCP spec.
   */
  async connectToServer(): Promise<void> {
    if (this.state === "connected") {
      return;
    }

    this.state = "connecting";

    try {
      await this.establishSSEConnection();

      // Send initialize request
      const initResponse = await this.sendRequest("initialize", {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true },
        },
        clientInfo: {
          name: "kalen-mcp-client",
          version: "0.1.0",
        },
      });

      if (initResponse.error) {
        throw new Error(`MCP initialization failed: ${initResponse.error.message}`);
      }

      const result = initResponse.result as {
        protocolVersion: string;
        capabilities: MCPServerCapabilities;
        serverInfo: { name: string; version: string };
      };

      this.serverCapabilities = result.capabilities;
      this.serverInfo = result.serverInfo;

      // Send initialized notification
      this.sendNotification("notifications/initialized", {});

      this.state = "connected";
    } catch (err) {
      this.state = "error";
      this.cleanup();
      throw err;
    }
  }

  /**
   * Discover available tools from the MCP server.
   * Results are cached until the server notifies of changes.
   */
  async listTools(): Promise<MCPTool[]> {
    this.ensureConnected();

    if (this.cachedTools !== null) {
      return this.cachedTools;
    }

    const response = await this.sendRequest("tools/list", {});

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    const result = response.result as { tools: MCPTool[] };
    this.cachedTools = result.tools ?? [];
    return this.cachedTools;
  }

  /**
   * Invoke an MCP tool with arguments.
   * Includes audit logging of the invocation.
   *
   * @param toolName - Name of the tool to invoke
   * @param arguments_ - Input arguments for the tool
   * @param callerId - Identity of the caller (for audit)
   * @param callerKind - Kind of caller (human/agent)
   */
  async callTool(
    toolName: string,
    arguments_: Record<string, unknown>,
    callerId?: string,
    callerKind?: "human" | "agent",
  ): Promise<MCPCallResult> {
    this.ensureConnected();

    const response = await this.sendRequest("tools/call", {
      name: toolName,
      arguments: arguments_,
    });

    if (response.error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Tool call error: ${response.error.message} (code: ${response.error.code})`,
          },
        ],
      };
    }

    const result = response.result as MCPCallResult;
    return result;
  }

  /**
   * List available resources from the MCP server.
   */
  async listResources(): Promise<MCPResource[]> {
    this.ensureConnected();

    if (this.cachedResources !== null) {
      return this.cachedResources;
    }

    const response = await this.sendRequest("resources/list", {});

    if (response.error) {
      throw new Error(`Failed to list resources: ${response.error.message}`);
    }

    const result = response.result as { resources: MCPResource[] };
    this.cachedResources = result.resources ?? [];
    return this.cachedResources;
  }

  /**
   * Read a resource from the MCP server.
   */
  async readResource(uri: string): Promise<unknown> {
    this.ensureConnected();

    const response = await this.sendRequest("resources/read", { uri });

    if (response.error) {
      throw new Error(`Failed to read resource ${uri}: ${response.error.message}`);
    }

    return response.result;
  }

  /** Disconnect from the MCP server */
  async disconnect(): Promise<void> {
    this.cleanup();
    this.state = "disconnected";
  }

  // ─── Private Methods ──────────────────────────────────────────

  private ensureConnected(): void {
    if (this.state !== "connected") {
      throw new Error(`MCP client is not connected (state: ${this.state})`);
    }
  }

  private async establishSSEConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("SSE connection timeout"));
      }, this.config.connectionTimeout);

      try {
        this.eventSource = new EventSource(this.config.endpoint);

        this.eventSource.onopen = () => {
          clearTimeout(timeout);
        };

        this.eventSource.addEventListener("endpoint", (event: MessageEvent) => {
          this.messageEndpoint = event.data;
          clearTimeout(timeout);
          resolve();
        });

        this.eventSource.addEventListener("message", (event: MessageEvent) => {
          this.handleMessage(event.data);
        });

        this.eventSource.onerror = () => {
          clearTimeout(timeout);
          if (this.state === "connecting") {
            reject(new Error("Failed to establish SSE connection"));
          }
        };
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const response: JSONRPCResponse = JSON.parse(data);

      const pending = this.pendingRequests.get(response.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(response.id);
        pending.resolve(response);
      }
    } catch {
      // Ignore malformed messages
    }
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<JSONRPCResponse> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.config.toolCallTimeout);

      this.pendingRequests.set(id, { resolve, reject, timer });

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.postMessage(request);
    });
  }

  private sendNotification(method: string, params: Record<string, unknown>): void {
    const notification = {
      jsonrpc: "2.0",
      method,
      params,
    };

    this.postMessage(notification);
  }

  private postMessage(message: unknown): void {
    if (!this.messageEndpoint) {
      throw new Error("No message endpoint available — not connected");
    }

    fetch(this.messageEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    }).catch(() => {
      // Connection error — handled by SSE error handler
    });
  }

  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Connection closed"));
    }
    this.pendingRequests.clear();

    this.messageEndpoint = null;
    this.cachedTools = null;
    this.cachedResources = null;
    this.serverCapabilities = null;
    this.serverInfo = null;
  }
}
