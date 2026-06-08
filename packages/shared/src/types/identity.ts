/**
 * KALEN Identity Types
 * Defines human and agent identity structures with discriminated unions.
 */

/** Human identity backed by WebAuthn passkey credentials. */
export interface HumanIdentity {
  /** Unique user identifier (UUID v4) */
  userId: string;
  /** User email address */
  email: string;
  /** Human-readable display name */
  displayName: string;
  /** WebAuthn credential ID (base64url-encoded) */
  passkeyCredentialId: string;
  /** COSE public key from WebAuthn attestation (base64url-encoded) */
  publicKey: string;
  /** ISO 8601 timestamp of identity creation */
  createdAt: string;
}

/** Agent identity with Ed25519 keypair and enforceable (ai) suffix. */
export interface AgentIdentity {
  /** Unique agent identifier (UUID v4) */
  agentId: string;
  /** Agent display name — must end with " (ai)" suffix */
  name: string;
  /** Mandatory suffix for agent identification */
  suffix: "(ai)";
  /** Ed25519 public key (base64url-encoded) */
  keypairPublicKey: string;
  /** Signed agent manifest declaring capabilities */
  manifest: AgentManifest;
  /** Owner user ID (the human who created this agent) */
  owner: string;
  /** Granted permission scopes */
  scopes: string[];
  /** ISO 8601 timestamp of identity creation */
  createdAt: string;
}

/** Agent capability manifest */
export interface AgentManifest {
  /** Agent name with (ai) suffix */
  name: string;
  /** Human-readable description of the agent's purpose */
  description: string;
  /** MCP tools this agent is authorized to invoke */
  tools: string[];
  /** A2A capabilities this agent exposes */
  capabilities: string[];
  /** Maximum invocation rate (calls per minute) */
  rateLimit: number;
  /** Manifest version for rotation tracking */
  version: number;
  /** ISO 8601 timestamp of manifest creation */
  issuedAt: string;
  /** Ed25519 signature of the manifest payload (base64url-encoded) */
  signature: string;
}

/** Discriminator for identity kinds */
export type IdentityKind = "human" | "agent";

/** Discriminated union: either a human or an agent identity */
export type DualIdentity =
  | { kind: "human"; identity: HumanIdentity }
  | { kind: "agent"; identity: AgentIdentity };

/** Type guard: checks if a DualIdentity is human */
export function isHumanIdentity(dual: DualIdentity): dual is { kind: "human"; identity: HumanIdentity } {
  return dual.kind === "human";
}

/** Type guard: checks if a DualIdentity is agent */
export function isAgentIdentity(dual: DualIdentity): dual is { kind: "agent"; identity: AgentIdentity } {
  return dual.kind === "agent";
}
