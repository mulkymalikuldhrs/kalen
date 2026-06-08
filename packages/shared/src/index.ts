/**
 * @kalen/shared — Shared types, protocols, and utilities for KALEN
 */

// Types
export type {
  HumanIdentity,
  AgentIdentity,
  AgentManifest,
  IdentityKind,
  DualIdentity,
} from "./types/identity";

export {
  isHumanIdentity,
  isAgentIdentity,
} from "./types/identity";

export type {
  MCPTool,
  MCPResource,
  MCPCallResult,
  MCPContentBlock,
  MCPToolInvocation,
  MCPServerInfo,
  JSONSchemaObject,
} from "./types/mcp";

export type {
  AgentCard,
  AgentCapabilities,
  A2AEndpoint,
  A2AAuthentication,
  A2ATask,
  A2AArtifact,
  A2AArtifactPart,
  A2AMessage,
  A2AMessagePart,
  TaskStateTransition,
} from "./types/a2a";

export { TaskStatus, VALID_TRANSITIONS } from "./types/a2a";

export type {
  RoomType,
  Room,
  Message,
  MessageEnvelope,
  PresenceStatus,
  PresenceUpdate,
  TypingIndicator,
} from "./types/messaging";

export type {
  BaseEvent,
  IdentityEvent,
  MessageEvent,
  AgentEvent,
  MCPEvent,
  A2AEvent,
  KALENEvent,
  EventEnvelope,
} from "./types/events";

// Utilities
export {
  validateAgentName,
  validateEmail,
  validatePublicKey,
  validateMCPToolSchema,
} from "./utils/validation";

export {
  AGENT_SUFFIX,
  AGENT_DISPLAY_SUFFIX,
  MCP_PROTOCOL_VERSION,
  A2A_PROTOCOL_VERSION,
  KALEN_EVENT_SCHEMA_VERSION,
  DEFAULT_API_PORT,
  DEFAULT_WS_PORT,
  DEFAULT_REDIS_PORT,
  DEFAULT_POSTGRES_PORT,
  DEFAULT_NATS_PORT,
  WEBAUTHN_REGISTRATION_TIMEOUT,
  WEBAUTHN_AUTHENTICATION_TIMEOUT,
  MCP_TOOL_CALL_TIMEOUT,
  MCP_CONNECTION_TIMEOUT,
  A2A_TASK_TIMEOUT,
  A2A_DISCOVERY_TIMEOUT,
  WS_RECONNECT_INTERVAL,
  WS_MAX_RECONNECT_ATTEMPTS,
  ED25519_PUBLIC_KEY_LENGTH,
  ED25519_PRIVATE_KEY_LENGTH,
  ED25519_SIGNATURE_LENGTH,
  MIN_AGENT_NAME_LENGTH,
  MAX_AGENT_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_ROOM_MEMBERS,
  MAX_MCP_TOOLS_PER_AGENT,
  MAX_A2A_TASKS_PER_AGENT,
  MAX_ARTIFACTS_PER_TASK,
  MAX_MESSAGES_PER_TASK,
  WEBAUTHN_CHALLENGE_TTL,
  TYPING_INDICATOR_TTL,
  PRESENCE_HEARTBEAT_INTERVAL,
  HUMAN_ACCESS_TOKEN_TTL,
  HUMAN_REFRESH_TOKEN_TTL,
  AGENT_ACCESS_TOKEN_TTL,
  AGENT_REFRESH_TOKEN_TTL,
  DEFAULT_AGENT_RATE_LIMIT,
  DEFAULT_HUMAN_RATE_LIMIT,
  MCP_TOOL_RATE_LIMIT_WINDOW,
  JWT_ISSUER,
  JWT_AUDIENCE,
  REDIS_CHALLENGE_PREFIX,
  REDIS_PRESENCE_PREFIX,
  REDIS_RATE_LIMIT_PREFIX,
  REDIS_AGENT_CACHE_PREFIX,
  REDIS_MCP_REGISTRY_PREFIX,
  A2A_WELL_KNOWN_PATH,
} from "./utils/constants";
