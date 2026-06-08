/**
 * KALEN Agent Identity Verification
 * Verify agent tokens, manifests, and suffix enforcement.
 */

import type { AgentIdentity, AgentManifest } from "@kalen/shared";
import { AGENT_SUFFIX, AGENT_DISPLAY_SUFFIX } from "@kalen/shared";
import { verifyToken, type TokenPayload } from "../token/jwt";
import { validateManifest } from "./manifest";

/**
 * Verify a JWT token issued to an agent.
 *
 * @param token - The JWT token string
 * @param secret - JWT verification secret
 * @returns Decoded token payload if valid, null otherwise
 */
export async function verifyAgentToken(
  token: string,
  secret: string,
): Promise<(TokenPayload & { kind: "agent" }) | null> {
  const payload = await verifyToken(token, secret);
  if (!payload) {
    return null;
  }

  if (payload.kind !== "agent") {
    return null;
  }

  if (payload.suffix !== AGENT_SUFFIX) {
    return null;
  }

  return payload as TokenPayload & { kind: "agent" };
}

/**
 * Verify an agent manifest's signature and structure.
 *
 * @param manifest - The manifest to verify
 * @param publicKey - The agent's Ed25519 public key (base64url-encoded)
 * @returns Verification result
 */
export function verifyAgentManifest(
  manifest: AgentManifest,
  publicKey: string,
): { valid: boolean; error?: string } {
  return validateManifest(manifest, publicKey);
}

/**
 * Check that an agent identity enforces the (ai) suffix rule.
 * This prevents agent spoofing by ensuring every agent name is clearly marked.
 *
 * @param identity - The agent identity to check
 * @returns Whether the suffix enforcement is valid
 */
export function checkSuffixEnforcement(identity: AgentIdentity): { valid: boolean; error?: string } {
  if (identity.suffix !== AGENT_SUFFIX) {
    return { valid: false, error: `Agent suffix must be "${AGENT_SUFFIX}", got "${identity.suffix}"` };
  }

  if (!identity.name.endsWith(AGENT_DISPLAY_SUFFIX)) {
    return { valid: false, error: `Agent name "${identity.name}" does not end with "${AGENT_DISPLAY_SUFFIX}" suffix` };
  }

  if (identity.manifest && !identity.manifest.name.endsWith(AGENT_DISPLAY_SUFFIX)) {
    return { valid: false, error: `Agent manifest name "${identity.manifest.name}" does not end with "${AGENT_DISPLAY_SUFFIX}" suffix` };
  }

  return { valid: true };
}

/**
 * Comprehensive agent identity verification.
 * Checks token, manifest signature, and suffix enforcement.
 *
 * @param identity - The agent identity
 * @param token - The agent's JWT token
 * @param jwtSecret - JWT verification secret
 * @returns Comprehensive verification result
 */
export async function verifyAgentIdentity(
  identity: AgentIdentity,
  token: string,
  jwtSecret: string,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check suffix enforcement
  const suffixCheck = checkSuffixEnforcement(identity);
  if (!suffixCheck.valid) {
    errors.push(suffixCheck.error!);
  }

  // Check manifest signature
  const manifestCheck = verifyAgentManifest(identity.manifest, identity.keypairPublicKey);
  if (!manifestCheck.valid) {
    errors.push(manifestCheck.error!);
  }

  // Check token validity
  const tokenPayload = await verifyAgentToken(token, jwtSecret);
  if (!tokenPayload) {
    errors.push("Agent token is invalid or expired");
  } else {
    if (tokenPayload.sub !== identity.agentId) {
      errors.push("Token subject does not match agent ID");
    }
    if (tokenPayload.suffix !== AGENT_SUFFIX) {
      errors.push("Token suffix does not match agent suffix");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
