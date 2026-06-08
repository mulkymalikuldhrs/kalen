/**
 * @kalen/mcp-gateway — KALEN MCP Protocol Gateway
 * Tool discovery, routing, RBAC enforcement, and audit logging.
 */

// Client
export { MCPClient } from "./client/mcp-client";
export type { MCPClientConfig, MCPClientState, MCPServerCapabilities } from "./client/mcp-client";

// Server
export { MCPServer } from "./server/mcp-server";
export type { ToolHandler, ToolCallContext, ResourceHandler, ResourceReadContext } from "./server/mcp-server";

// Gateway
export { GatewayService } from "./gateway/gateway-service";
export type { GatewayConfig, AuditLogEntry } from "./gateway/gateway-service";

// Governance
export { AllowList } from "./governance/allowlist";
