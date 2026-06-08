/**
 * KALEN A2A (Agent-to-Agent) Protocol Types
 * Based on Google's A2A specification for inter-agent communication.
 */

/** Agent Card — describes an agent's capabilities and endpoints */
export interface AgentCard {
  /** Agent name — must end with " (ai)" */
  name: string;
  /** Agent endpoint URL */
  url: string;
  /** Human-readable description of the agent */
  description?: string;
  /** Agent capabilities */
  capabilities: AgentCapabilities;
  /** A2A protocol endpoints */
  endpoints: A2AEndpoint[];
  /** Authentication requirements */
  authentication: A2AAuthentication;
  /** Agent version */
  version?: string;
  /** Ed25519 public key for card verification (base64url-encoded) */
  publicKey?: string;
  /** Card signature (base64url-encoded) */
  signature?: string;
}

/** Agent capability flags */
export interface AgentCapabilities {
  /** Whether the agent supports streaming via SSE */
  streaming: boolean;
  /** Whether the agent supports push notifications */
  pushNotifications: boolean;
  /** Whether the agent supports task state transition history */
  stateTransitionHistory: boolean;
}

/** A2A endpoint definition */
export interface A2AEndpoint {
  /** HTTP method */
  method: string;
  /** Endpoint URL path */
  path: string;
  /** Human-readable description */
  description?: string;
}

/** A2A authentication scheme */
export interface A2AAuthentication {
  /** Authentication scheme type */
  scheme: "none" | "bearer" | "oauth2" | "mtls";
  /** OAuth2 scopes if applicable */
  scopes?: string[];
}

/** Task status state machine values */
export enum TaskStatus {
  SUBMITTED = "submitted",
  WORKING = "working",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
  INPUT_REQUIRED = "input_required",
}

/** A2A Task — represents a unit of work delegated to an agent */
export interface A2ATask {
  /** Unique task ID (UUID v4) */
  id: string;
  /** Current task status */
  status: TaskStatus;
  /** Status message / reason */
  statusMessage?: string;
  /** Artifacts produced by the task */
  artifacts: A2AArtifact[];
  /** Conversation messages within the task context */
  messages: A2AMessage[];
  /** Full state transition history */
  history: TaskStateTransition[];
  /** ID of the agent assigned to this task */
  assignedAgentId?: string;
  /** ID of the agent or human that created the task */
  createdBy: string;
  /** ISO 8601 timestamp of task creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/** A2A Artifact — output produced by a task */
export interface A2AArtifact {
  /** Unique artifact ID */
  id: string;
  /** Artifact parts (supports multi-part content) */
  parts: A2AArtifactPart[];
  /** ISO 8601 timestamp of artifact creation */
  createdAt: string;
}

/** A2A Artifact Part — a single piece of artifact content */
export interface A2AArtifactPart {
  type: "text" | "file" | "data";
  text?: string;
  file?: {
    name?: string;
    mimeType?: string;
    bytes?: string;
    uri?: string;
  };
  data?: Record<string, unknown>;
}

/** A2A Message — a message within a task conversation */
export interface A2AMessage {
  /** Message role */
  role: "user" | "agent";
  /** Message content parts */
  parts: A2AMessagePart[];
  /** ISO 8601 timestamp */
  timestamp: string;
}

/** A2A Message Part — a single piece of message content */
export interface A2AMessagePart {
  type: "text" | "file" | "data";
  text?: string;
  file?: {
    name?: string;
    mimeType?: string;
    bytes?: string;
    uri?: string;
  };
  data?: Record<string, unknown>;
}

/** Task state transition record */
export interface TaskStateTransition {
  /** The status being transitioned to */
  status: TaskStatus;
  /** Optional reason for the transition */
  message?: string;
  /** ISO 8601 timestamp of the transition */
  timestamp: string;
}

/** Valid state transitions map */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.SUBMITTED]: [TaskStatus.WORKING, TaskStatus.CANCELED, TaskStatus.FAILED],
  [TaskStatus.WORKING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELED, TaskStatus.INPUT_REQUIRED],
  [TaskStatus.INPUT_REQUIRED]: [TaskStatus.WORKING, TaskStatus.CANCELED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.FAILED]: [],
  [TaskStatus.CANCELED]: [],
};
