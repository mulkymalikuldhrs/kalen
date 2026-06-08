/**
 * KALEN MCP (Model Context Protocol) Types
 * Defines tool, resource, and invocation structures for MCP gateway.
 */

/** JSON Schema object representation */
export interface JSONSchemaObject {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

/** MCP Tool definition */
export interface MCPTool {
  /** Unique tool name within the MCP server namespace */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON Schema describing the tool's input parameters */
  inputSchema: JSONSchemaObject;
}

/** MCP Resource definition */
export interface MCPResource {
  /** Unique resource URI (e.g., "kalen://messages/recent") */
  uri: string;
  /** Human-readable resource name */
  name: string;
  /** Resource description */
  description?: string;
  /** MIME type of the resource content */
  mimeType?: string;
}

/** MCP Tool call result */
export interface MCPCallResult {
  /** Whether the tool call succeeded */
  isError: boolean;
  /** Array of content items returned by the tool */
  content: MCPContentBlock[];
}

/** Content block within an MCP result */
export interface MCPContentBlock {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
  resource?: MCPResource;
}

/** MCP Tool invocation with full audit trail */
export interface MCPToolInvocation {
  /** Unique invocation ID (UUID v4) */
  invocationId: string;
  /** Name of the tool being invoked */
  toolName: string;
  /** Input arguments passed to the tool */
  arguments: Record<string, unknown>;
  /** Identity of the caller (human userId or agent agentId) */
  callerId: string;
  /** Identity kind of the caller */
  callerKind: "human" | "agent";
  /** MCP server that owns this tool */
  serverId: string;
  /** ISO 8601 timestamp when invocation started */
  startedAt: string;
  /** ISO 8601 timestamp when invocation completed (if done) */
  completedAt?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Result of the invocation */
  result?: MCPCallResult;
  /** RBAC decision: allowed or denied */
  accessDecision: "allowed" | "denied";
  /** Reason for denial if accessDecision is "denied" */
  denialReason?: string;
}

/** MCP Server metadata for registry */
export interface MCPServerInfo {
  /** Server identifier */
  serverId: string;
  /** Human-readable server name */
  name: string;
  /** Server version */
  version: string;
  /** Transport type */
  transport: "stdio" | "sse" | "websocket";
  /** Connection endpoint */
  endpoint: string;
  /** Tools provided by this server */
  tools: MCPTool[];
  /** Resources provided by this server */
  resources: MCPResource[];
  /** Server status */
  status: "connected" | "disconnected" | "error";
  /** ISO 8601 timestamp of last health check */
  lastHealthCheck?: string;
}
