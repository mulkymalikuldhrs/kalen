/**
 * KALEN Agent Card Signing
 * Sign and verify Agent Cards using Ed25519 signatures.
 */

import type { AgentCard } from "@kalen/shared";
import { Ed25519Signer } from "@kalen/identity";

/**
 * Sign an Agent Card with an Ed25519 private key.
 *
 * The signature covers a canonical JSON representation of the card
 * excluding the signature field itself, ensuring deterministic signing.
 *
 * @param card - The Agent Card to sign (signature field ignored)
 * @param privateKeyBase64url - Base64url-encoded Ed25519 private key
 * @returns Base64url-encoded 64-byte Ed25519 signature
 */
export function signAgentCard(card: AgentCard, privateKeyBase64url: string): string {
  const payload = canonicalCardPayload(card);

  // Decode private key and create a signer (public key derived automatically)
  const privateKey = base64urlToBytes(privateKeyBase64url);
  const signer = Ed25519Signer.fromPrivateKey(privateKey);

  return signer.sign(payload);
}

/**
 * Verify an Agent Card's signature against its public key using real Ed25519 verification.
 *
 * @param card - The Agent Card with signature to verify
 * @returns Whether the signature is valid
 */
export function verifyAgentCardSignature(card: AgentCard): boolean {
  if (!card.signature || !card.publicKey) {
    return false;
  }

  try {
    const payload = canonicalCardPayload(card);
    return Ed25519Signer.verify(payload, card.signature, card.publicKey);
  } catch {
    return false;
  }
}

/**
 * Build the canonical payload for signing/verification.
 * All fields except "signature" in deterministic key order.
 */
function canonicalCardPayload(card: AgentCard): string {
  const { signature: _, ...payload } = card;
  return JSON.stringify(payload, [
    "name",
    "url",
    "description",
    "capabilities",
    "streaming",
    "pushNotifications",
    "stateTransitionHistory",
    "endpoints",
    "method",
    "path",
    "authentication",
    "scheme",
    "scopes",
    "version",
    "publicKey",
  ]);
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
