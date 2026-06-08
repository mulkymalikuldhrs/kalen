/**
 * KALEN Agent Manifest
 * Type definition, creation, validation, and signing for agent manifests.
 */

import type { AgentManifest as IAgentManifest } from "@kalen/shared";
import { DEFAULT_AGENT_RATE_LIMIT } from "@kalen/shared";
import { validateAgentName } from "@kalen/shared";
import { Ed25519Signer } from "./creation";

/** Manifest creation input */
export interface CreateManifestInput {
  /** Agent name with (ai) suffix */
  name: string;
  /** Agent description */
  description: string;
  /** MCP tools the agent may invoke */
  tools: string[];
  /** A2A capabilities the agent exposes */
  capabilities: string[];
  /** Rate limit in calls per minute */
  rateLimit?: number;
}

/**
 * Create a new agent manifest.
 * The manifest is the signed declaration of an agent's capabilities.
 *
 * @param input - Manifest creation parameters
 * @param signer - Ed25519 signer for the agent
 * @returns Signed agent manifest
 */
export function createManifest(
  input: CreateManifestInput,
  signer: Ed25519Signer,
): IAgentManifest {
  const nameValidation = validateAgentName(input.name);
  if (!nameValidation.valid) {
    throw new Error(`Invalid agent name: ${nameValidation.error}`);
  }

  if (!input.description || input.description.trim().length === 0) {
    throw new Error("Agent description cannot be empty");
  }

  if (!Array.isArray(input.tools)) {
    throw new Error("Tools must be an array of tool name strings");
  }

  if (!Array.isArray(input.capabilities)) {
    throw new Error("Capabilities must be an array of capability strings");
  }

  const manifest: IAgentManifest = {
    name: input.name.trim(),
    description: input.description.trim(),
    tools: input.tools,
    capabilities: input.capabilities,
    rateLimit: input.rateLimit ?? DEFAULT_AGENT_RATE_LIMIT,
    version: 1,
    issuedAt: new Date().toISOString(),
    signature: "",
  };

  manifest.signature = signManifest(manifest, signer);

  return manifest;
}

/**
 * Validate an agent manifest's structure and signature.
 *
 * @param manifest - The manifest to validate
 * @param publicKey - The agent's Ed25519 public key (base64url-encoded)
 * @returns Validation result
 */
export function validateManifest(
  manifest: IAgentManifest,
  publicKey: string,
): { valid: boolean; error?: string } {
  const nameValidation = validateAgentName(manifest.name);
  if (!nameValidation.valid) {
    return { valid: false, error: `Invalid manifest name: ${nameValidation.error}` };
  }

  if (!manifest.description || manifest.description.trim().length === 0) {
    return { valid: false, error: "Manifest description cannot be empty" };
  }

  if (typeof manifest.rateLimit !== "number" || manifest.rateLimit < 1) {
    return { valid: false, error: "Manifest rateLimit must be a positive number" };
  }

  if (typeof manifest.version !== "number" || manifest.version < 1) {
    return { valid: false, error: "Manifest version must be a positive number" };
  }

  if (!manifest.issuedAt) {
    return { valid: false, error: "Manifest must have an issuedAt timestamp" };
  }

  const issuedAt = new Date(manifest.issuedAt);
  if (isNaN(issuedAt.getTime())) {
    return { valid: false, error: "Manifest issuedAt is not a valid ISO 8601 timestamp" };
  }

  if (!manifest.signature) {
    return { valid: false, error: "Manifest must be signed" };
  }

  const signatureValid = verifyManifestSignature(manifest, publicKey);
  if (!signatureValid) {
    return { valid: false, error: "Manifest signature verification failed" };
  }

  return { valid: true };
}

/**
 * Sign a manifest's payload with the agent's Ed25519 private key.
 * The signature covers all fields except the signature itself.
 *
 * @param manifest - The manifest to sign (signature field is ignored)
 * @param signer - Ed25519 signer instance
 * @returns Base64url-encoded signature
 */
export function signManifest(manifest: IAgentManifest, signer: Ed25519Signer): string {
  const payload = manifestPayload(manifest);
  return signer.sign(payload);
}

/**
 * Verify a manifest's signature against a public key.
 *
 * @param manifest - The manifest with signature to verify
 * @param publicKey - Base64url-encoded Ed25519 public key
 * @returns Whether the signature is valid
 */
export function verifyManifestSignature(manifest: IAgentManifest, publicKey: string): boolean {
  const payload = manifestPayload(manifest);
  return Ed25519Signer.verify(payload, manifest.signature, publicKey);
}

/**
 * Build the canonical payload string for signing/verification.
 * All fields except "signature" are included in deterministic order.
 */
function manifestPayload(manifest: IAgentManifest): string {
  const { signature: _, ...payload } = manifest;
  return JSON.stringify(payload, [
    "name",
    "description",
    "tools",
    "capabilities",
    "rateLimit",
    "version",
    "issuedAt",
  ]);
}
