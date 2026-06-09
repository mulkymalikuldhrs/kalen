/**
 * KALEN Agent Identity Creation
 * Generate Ed25519 keypairs, create manifests, and build agent identities.
 */

import * as ed from "@noble/ed25519";
import { createHash } from "node:crypto";
import type { AgentIdentity } from "@kalen/shared";
import { AGENT_SUFFIX, AGENT_ACCESS_TOKEN_TTL } from "@kalen/shared";
import { validateAgentName, validatePublicKey } from "@kalen/shared";
import { createManifest } from "./manifest";
import { createToken, type TokenPayload } from "../token/jwt";

// Configure synchronous SHA-512 for @noble/ed25519 sync operations.
// Node.js crypto.createHash provides a fast, native SHA-512 without
// requiring an additional npm dependency like @noble/hashes.
// Type assertion needed: TS 5.9 uses Uint8Array<ArrayBuffer> generics,
// but Node.js Buffer extends Uint8Array<ArrayBufferLike>.
ed.hashes.sha512 = ((message: Uint8Array): Uint8Array =>
  new Uint8Array(createHash("sha512").update(message).digest())) as typeof ed.hashes.sha512;

/**
 * Ed25519 signer/verifier for agent identity operations.
 * Uses @noble/ed25519 for real cryptographic Ed25519 signing and verification.
 */
export class Ed25519Signer {
  private readonly privateKeyBytes: Uint8Array | null;
  private readonly publicKeyBytes: Uint8Array;

  private constructor(privateKeyBytes: Uint8Array | null, publicKeyBytes: Uint8Array) {
    this.privateKeyBytes = privateKeyBytes;
    this.publicKeyBytes = publicKeyBytes;
  }

  /**
   * Generate a new Ed25519 keypair.
   * The public key is cryptographically derived from the private key.
   *
   * @returns Ed25519Signer with both private and public keys
   */
  static generate(): Ed25519Signer {
    const secretKey = ed.utils.randomSecretKey();
    const publicKey = ed.getPublicKey(secretKey);
    return new Ed25519Signer(secretKey, publicKey);
  }

  /**
   * Create an Ed25519Signer from existing key bytes.
   *
   * @param privateKey - Raw private key bytes (or null for verify-only)
   * @param publicKey - Raw public key bytes
   * @returns Ed25519Signer instance
   */
  static fromBytes(privateKey: Uint8Array | null, publicKey: Uint8Array): Ed25519Signer {
    return new Ed25519Signer(privateKey, publicKey);
  }

  /**
   * Create an Ed25519Signer from a private key, deriving the public key automatically.
   *
   * @param privateKey - Raw private key bytes (32-byte Ed25519 secret key seed)
   * @returns Ed25519Signer instance with derived public key
   */
  static fromPrivateKey(privateKey: Uint8Array): Ed25519Signer {
    const publicKey = ed.getPublicKey(privateKey);
    return new Ed25519Signer(privateKey, publicKey);
  }

  /**
   * Sign a message with the Ed25519 private key.
   *
   * @param message - The message string to sign
   * @returns Base64url-encoded 64-byte Ed25519 signature
   */
  sign(message: string): string {
    if (!this.privateKeyBytes) {
      throw new Error("Cannot sign: no private key available (verify-only instance)");
    }

    const data = new TextEncoder().encode(message);
    const signature = ed.sign(data, this.privateKeyBytes);
    return bytesToBase64url(signature);
  }

  /**
   * Verify a signature against a public key using real Ed25519 verification.
   *
   * @param message - The original message
   * @param signature - Base64url-encoded signature
   * @param publicKey - Base64url-encoded public key
   * @returns Whether the signature is valid
   */
  static verify(message: string, signature: string, publicKey: string): boolean {
    try {
      const sigBytes = base64urlToBytes(signature);
      const pubBytes = base64urlToBytes(publicKey);

      if (sigBytes.length !== 64) return false;
      if (pubBytes.length !== 32) return false;

      const data = new TextEncoder().encode(message);
      return ed.verify(sigBytes, data, pubBytes);
    } catch {
      return false;
    }
  }

  /** Get the base64url-encoded public key */
  getPublicKeyBase64url(): string {
    return bytesToBase64url(this.publicKeyBytes);
  }

  /** Get the raw public key bytes */
  getPublicKeyBytes(): Uint8Array {
    return this.publicKeyBytes;
  }

  /** Get the raw private key bytes (if available) */
  getPrivateKeyBytes(): Uint8Array | null {
    return this.privateKeyBytes;
  }
}

/** Convert bytes to base64url encoding (no padding) */
function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Convert base64url string to bytes */
function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Result of agent identity creation */
export interface CreateAgentIdentityResult {
  /** The created agent identity */
  identity: AgentIdentity;
  /** The Ed25519 signer (holds private key — store securely) */
  signer: Ed25519Signer;
  /** JWT access token for the agent */
  accessToken: string;
}

/**
 * Create a new agent identity with Ed25519 keypair and signed manifest.
 *
 * @param name - Agent display name (must end with " (ai)")
 * @param description - Agent purpose description
 * @param ownerId - The human user ID creating this agent
 * @param tools - MCP tools the agent may invoke
 * @param capabilities - A2A capabilities the agent exposes
 * @param scopes - Permission scopes to grant
 * @param jwtSecret - Secret for signing the agent's JWT
 * @returns Created agent identity with signer and access token
 */
export async function createAgentIdentity(
  name: string,
  description: string,
  ownerId: string,
  tools: string[],
  capabilities: string[],
  scopes: string[],
  jwtSecret: string,
): Promise<CreateAgentIdentityResult> {
  const nameValidation = validateAgentName(name);
  if (!nameValidation.valid) {
    throw new Error(`Invalid agent name: ${nameValidation.error}`);
  }

  if (!ownerId || ownerId.trim().length === 0) {
    throw new Error("Owner ID is required");
  }

  const signer = Ed25519Signer.generate();
  const publicKey = signer.getPublicKeyBase64url();

  const keyValidation = validatePublicKey(publicKey);
  if (!keyValidation.valid) {
    throw new Error(`Invalid generated public key: ${keyValidation.error}`);
  }

  const manifest = createManifest(
    {
      name,
      description,
      tools,
      capabilities,
    },
    signer,
  );

  const agentId = crypto.randomUUID();

  const identity: AgentIdentity = {
    agentId,
    name,
    suffix: AGENT_SUFFIX,
    keypairPublicKey: publicKey,
    manifest,
    owner: ownerId,
    scopes,
    createdAt: new Date().toISOString(),
  };

  const tokenPayload: TokenPayload = {
    kind: "agent",
    sub: agentId,
    suffix: AGENT_SUFFIX,
    scopes,
    tokenType: "access",
  };

  const accessToken = await createToken(tokenPayload, jwtSecret, AGENT_ACCESS_TOKEN_TTL);

  return {
    identity,
    signer,
    accessToken,
  };
}
