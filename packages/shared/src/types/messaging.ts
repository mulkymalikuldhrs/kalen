/**
 * KALEN Messaging Types
 * Defines room types, message envelopes, presence, and typing indicators.
 */

/** Room type discriminator */
export type RoomType = "direct" | "group" | "agent-workspace" | "system";

/** Room / conversation entity */
export interface Room {
  /** Unique room ID (UUID v4) */
  roomId: string;
  /** Room type */
  type: RoomType;
  /** Room display name (required for group/agent-workspace, optional for direct) */
  name?: string;
  /** Member IDs (human userIds and/or agent agentIds) */
  members: string[];
  /** Entity kinds of members (parallel array to members) */
  memberKinds: Array<"human" | "agent">;
  /** Creator of the room */
  createdBy: string;
  /** ISO 8601 timestamp of room creation */
  createdAt: string;
  /** ISO 8601 timestamp of last activity */
  lastActivityAt: string;
}

/** Message with envelope metadata */
export interface Message {
  /** Unique message ID (UUID v4) */
  messageId: string;
  /** Room this message belongs to */
  roomId: string;
  /** Sender ID (userId or agentId) */
  senderId: string;
  /** Sender kind */
  senderKind: "human" | "agent";
  /** Message content */
  content: string;
  /** Content type hint */
  contentType: "text" | "markdown" | "code" | "json";
  /** Optional reply-to message ID */
  replyTo?: string;
  /** Reactions (emoji → user IDs) */
  reactions: Record<string, string[]>;
  /** Read receipt user IDs */
  readBy: string[];
  /** ISO 8601 timestamp of message creation */
  createdAt: string;
  /** ISO 8601 timestamp of last edit (if edited) */
  editedAt?: string;
  /** Whether the message has been deleted (soft delete) */
  deleted: boolean;
}

/** Message envelope for transport */
export interface MessageEnvelope {
  /** Envelope ID for deduplication */
  envelopeId: string;
  /** The message payload */
  message: Message;
  /** ISO 8601 timestamp when envelope was created */
  envelopeCreatedAt: string;
  /** Envelope version for schema evolution */
  version: number;
}

/** User presence status */
export type PresenceStatus = "online" | "away" | "offline" | "dnd";

/** Presence update */
export interface PresenceUpdate {
  /** User or agent ID */
  entityId: string;
  /** Entity kind */
  entityKind: "human" | "agent";
  /** Current presence status */
  status: PresenceStatus;
  /** ISO 8601 timestamp of last status change */
  lastSeenAt: string;
  /** Optional status message (e.g., "In a meeting") */
  statusMessage?: string;
}

/** Typing indicator */
export interface TypingIndicator {
  /** User or agent ID that is typing */
  entityId: string;
  /** Entity kind */
  entityKind: "human" | "agent";
  /** Room where typing is occurring */
  roomId: string;
  /** ISO 8601 timestamp when typing started */
  startedAt: string;
}
