/**
 * KALEN Event Types
 * Defines the event system for cross-service communication.
 */

/** Base event structure */
export interface BaseEvent {
  /** Unique event ID (UUID v4) */
  eventId: string;
  /** Event type discriminator */
  eventType: string;
  /** ISO 8601 timestamp of event creation */
  timestamp: string;
  /** ID of the entity that triggered the event */
  sourceId: string;
  /** Correlation ID for tracing across services */
  correlationId: string;
}

/** Identity-related events (registration, authentication, rotation) */
export interface IdentityEvent extends BaseEvent {
  eventType: "identity.registered" | "identity.authenticated" | "identity.key_rotated" | "identity.revoked";
  payload: {
    entityType: "human" | "agent";
    entityId: string;
    action: "register" | "authenticate" | "rotate_key" | "revoke";
    metadata?: Record<string, unknown>;
  };
}

/** Message-related events (sent, edited, deleted, reacted) */
export interface MessageEvent extends BaseEvent {
  eventType: "message.sent" | "message.edited" | "message.deleted" | "message.reacted";
  payload: {
    roomId: string;
    messageId: string;
    senderId: string;
    senderKind: "human" | "agent";
    action: "send" | "edit" | "delete" | "react";
    metadata?: Record<string, unknown>;
  };
}

/** Agent-related events (created, scoped, invoked, deactivated) */
export interface AgentEvent extends BaseEvent {
  eventType: "agent.created" | "agent.scoped" | "agent.invoked" | "agent.deactivated";
  payload: {
    agentId: string;
    action: "create" | "scope" | "invoke" | "deactivate";
    ownerId?: string;
    metadata?: Record<string, unknown>;
  };
}

/** MCP-related events (tool_called, tool_completed, tool_denied) */
export interface MCPEvent extends BaseEvent {
  eventType: "mcp.tool_called" | "mcp.tool_completed" | "mcp.tool_denied" | "mcp.server_connected" | "mcp.server_disconnected";
  payload: {
    toolName: string;
    serverId: string;
    callerId: string;
    callerKind: "human" | "agent";
    invocationId: string;
    accessDecision: "allowed" | "denied";
    metadata?: Record<string, unknown>;
  };
}

/** A2A-related events (task_created, task_updated, task_completed, task_failed) */
export interface A2AEvent extends BaseEvent {
  eventType: "a2a.task_created" | "a2a.task_updated" | "a2a.task_completed" | "a2a.task_failed" | "a2a.task_canceled";
  payload: {
    taskId: string;
    agentId: string;
    previousStatus?: string;
    newStatus?: string;
    metadata?: Record<string, unknown>;
  };
}

/** Union of all KALEN event types */
export type KALENEvent = IdentityEvent | MessageEvent | AgentEvent | MCPEvent | A2AEvent;

/** Event envelope for transport over NATS/WebSocket */
export interface EventEnvelope {
  /** Envelope ID */
  envelopeId: string;
  /** The event payload */
  event: KALENEvent;
  /** Subject/channel for routing */
  subject: string;
  /** ISO 8601 timestamp of envelope creation */
  envelopeCreatedAt: string;
  /** Schema version for backward compatibility */
  schemaVersion: number;
}
