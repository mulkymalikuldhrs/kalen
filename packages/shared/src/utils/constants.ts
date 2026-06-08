/**
 * KALEN Constants
 * Protocol versions, default ports, timeouts, limits, and token TTLs.
 */

// ─── Agent Suffix ───────────────────────────────────────────────
/** Mandatory suffix tag for all agents */
export const AGENT_SUFFIX = "(ai)" as const;

/** Full display suffix for agent names (includes leading space) */
export const AGENT_DISPLAY_SUFFIX = " (ai)" as const;

// ─── Protocol Versions ──────────────────────────────────────────
export const MCP_PROTOCOL_VERSION = "2024-11-05";
export const A2A_PROTOCOL_VERSION = "0.2.0";
export const KALEN_EVENT_SCHEMA_VERSION = 1;

// ─── Default Ports ──────────────────────────────────────────────
export const DEFAULT_API_PORT = 3001;
export const DEFAULT_WS_PORT = 3002;
export const DEFAULT_REDIS_PORT = 6379;
export const DEFAULT_POSTGRES_PORT = 5432;
export const DEFAULT_NATS_PORT = 4222;

// ─── Timeouts (milliseconds) ────────────────────────────────────
export const WEBAUTHN_REGISTRATION_TIMEOUT = 60_000;
export const WEBAUTHN_AUTHENTICATION_TIMEOUT = 45_000;
export const MCP_TOOL_CALL_TIMEOUT = 30_000;
export const MCP_CONNECTION_TIMEOUT = 10_000;
export const A2A_TASK_TIMEOUT = 300_000;
export const A2A_DISCOVERY_TIMEOUT = 5_000;
export const WS_RECONNECT_INTERVAL = 3_000;
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

// ─── Limits ─────────────────────────────────────────────────────
export const ED25519_PUBLIC_KEY_LENGTH = 32;
export const ED25519_PRIVATE_KEY_LENGTH = 64;
export const ED25519_SIGNATURE_LENGTH = 64;

export const MIN_AGENT_NAME_LENGTH = 6; // "X (ai)" minimum
export const MAX_AGENT_NAME_LENGTH = 64;
export const MAX_MESSAGE_LENGTH = 40_000;
export const MAX_ROOM_MEMBERS = 256;
export const MAX_MCP_TOOLS_PER_AGENT = 128;
export const MAX_A2A_TASKS_PER_AGENT = 1_000;
export const MAX_ARTIFACTS_PER_TASK = 64;
export const MAX_MESSAGES_PER_TASK = 512;

// ─── Challenge TTL (seconds) ────────────────────────────────────
export const WEBAUTHN_CHALLENGE_TTL = 120;
export const TYPING_INDICATOR_TTL = 5;
export const PRESENCE_HEARTBEAT_INTERVAL = 30;

// ─── Token TTL (seconds) ────────────────────────────────────────
export const HUMAN_ACCESS_TOKEN_TTL = 900; // 15 minutes
export const HUMAN_REFRESH_TOKEN_TTL = 604_800; // 7 days
export const AGENT_ACCESS_TOKEN_TTL = 86_400; // 24 hours
export const AGENT_REFRESH_TOKEN_TTL = 2_592_000; // 30 days

// ─── Rate Limits ────────────────────────────────────────────────
export const DEFAULT_AGENT_RATE_LIMIT = 60; // calls per minute
export const DEFAULT_HUMAN_RATE_LIMIT = 120; // calls per minute
export const MCP_TOOL_RATE_LIMIT_WINDOW = 60_000; // 1 minute in ms

// ─── JWT Claims ─────────────────────────────────────────────────
export const JWT_ISSUER = "kalen";
export const JWT_AUDIENCE = "kalen-api";

// ─── Redis Key Prefixes ─────────────────────────────────────────
export const REDIS_CHALLENGE_PREFIX = "kalen:challenge:";
export const REDIS_PRESENCE_PREFIX = "kalen:presence:";
export const REDIS_RATE_LIMIT_PREFIX = "kalen:ratelimit:";
export const REDIS_AGENT_CACHE_PREFIX = "kalen:agent-card:";
export const REDIS_MCP_REGISTRY_PREFIX = "kalen:mcp:";

// ─── Well-Known Paths ───────────────────────────────────────────
export const A2A_WELL_KNOWN_PATH = "/.well-known/agent.json";
