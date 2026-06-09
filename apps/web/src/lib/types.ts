/**
 * KALEN Web App — Shared types
 * Extends @kalen/shared types with UI-specific types.
 */

// Import core types from shared package for local use and re-export
import type {
  HumanIdentity,
  AgentIdentity,
  AgentManifest,
  IdentityKind,
  DualIdentity,
  RoomType,
  Room,
  Message,
  MessageEnvelope,
  PresenceStatus,
  PresenceUpdate,
  TypingIndicator,
  MCPTool,
  MCPResource,
  MCPCallResult,
  MCPToolInvocation,
  MCPServerInfo,
  JSONSchemaObject,
  AgentCard,
  AgentCapabilities,
  A2ATask,
  TaskStatus,
} from "@kalen/shared";

// Re-export all shared types
export type {
  HumanIdentity,
  AgentIdentity,
  AgentManifest,
  IdentityKind,
  DualIdentity,
  RoomType,
  Room,
  Message,
  MessageEnvelope,
  PresenceStatus,
  PresenceUpdate,
  TypingIndicator,
  MCPTool,
  MCPResource,
  MCPCallResult,
  MCPToolInvocation,
  MCPServerInfo,
  JSONSchemaObject,
  AgentCard,
  AgentCapabilities,
  A2ATask,
  TaskStatus,
};

// ─── Auth Types ──────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  identity: DualIdentity | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  identity: DualIdentity;
}

export interface RegistrationResponse {
  identityId: string;
  suffix: string;
}

// ─── WebAuthn Types ──────────────────────────────────────────────

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout: number;
  attestation: "none" | "direct" | "indirect";
  authenticatorSelection: {
    authenticatorAttachment: "platform" | "cross-platform";
    requireResidentKey: boolean;
    residentKey: "required" | "preferred" | "discouraged";
    userVerification: "required" | "preferred" | "discouraged";
  };
}

export interface AuthenticationOptions {
  challenge: string;
  rpId: string;
  allowCredentials: Array<{
    id: string;
    type: "public-key";
    transports?: string[];
  }>;
  timeout: number;
  userVerification: "required" | "preferred" | "discouraged";
}

// ─── API Response Types ──────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── UI State Types ──────────────────────────────────────────────

export interface SidebarState {
  isOpen: boolean;
  activeSection: "rooms" | "agents" | "settings" | "mcp";
}

export interface ChatState {
  activeRoomId: string | null;
  isComposing: boolean;
  replyingTo: string | null;
}

export interface Notification {
  id: string;
  type: "message" | "agent" | "task" | "system";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

// ─── Agent UI Types ──────────────────────────────────────────────

export interface AgentProfile {
  agentId: string;
  name: string;
  description: string;
  capabilities: string[];
  tools: string[];
  status: "online" | "offline" | "busy";
  owner: string;
  createdAt: string;
  taskCount: number;
  successRate: number;
}

// ─── MCP UI Types ────────────────────────────────────────────────

export interface MCPToolWithStatus extends MCPTool {
  serverId: string;
  serverName: string;
  status: "available" | "restricted" | "offline";
}

export interface ToolInvocationState {
  isInvoking: boolean;
  toolName: string | null;
  result: MCPCallResult | null;
  error: string | null;
}
