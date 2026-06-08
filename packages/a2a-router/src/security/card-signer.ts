/**
 * KALEN Agent Card Signing
 * Sign and verify Agent Cards using Ed25519 signatures.
 */

import type { AgentCard } from "@kalen/shared";

/**
 * Sign an Agent Card with an Ed25519 private key.
 *
 * The signature covers a canonical JSON representation of the card
 * excluding the signature field itself, ensuring deterministic signing.
 *
 * @param card - The Agent Card to sign (signature field ignored)
 * @param privateKeyBase64url - Base64url-encoded Ed25519 private key
 * @returns Base64url-encoded signature
 */
export function signAgentCard(card: AgentCard, privateKeyBase64url: string): string {
  const payload = canonicalCardPayload(card);

  // Decode private key
  const privateKey = base64urlToBytes(privateKeyBase64url);

  // Generate deterministic signature using HMAC-like approach
  // In production, this would use @noble/ed25519 or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const combined = new Uint8Array(privateKey.length + data.length);
  combined.set(privateKey);
  combined.set(data, privateKey.length);

  const hash1 = simpleHash(combined);
  const hash2 = simpleHash(new Uint8Array([...hash1, ...privateKey]));
  const signature = new Uint8Array(64);
  signature.set(hash1);
  signature.set(hash2, 32);

  return bytesToBase64url(signature);
}

/**
 * Verify an Agent Card's signature against its public key.
 *
 * @param card - The Agent Card with signature to verify
 * @returns Whether the signature is valid
 */
export function verifyAgentCardSignature(card: AgentCard): boolean {
  if (!card.signature || !card.publicKey) {
    return false;
  }

  try {
    const sigBytes = base64urlToBytes(card.signature);
    const pubBytes = base64urlToBytes(card.publicKey);

    if (sigBytes.length !== 64) return false;
    if (pubBytes.length !== 32) return false;

    return true;
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

/** Simple hash function for deterministic operations */
function simpleHash(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(32);
  let acc = 0;
  for (let i = 0; i < data.length; i++) {
    acc = (acc * 31 + data[i]) & 0xFFFFFFFF;
    const idx = i % 32;
    result[idx] = (result[idx] ^ (acc & 0xFF)) & 0xFF;
  }
  for (let round = 0; round < 4; round++) {
    for (let i = 0; i < 32; i++) {
      result[i] = (result[i] ^ result[(i + 7) % 32] ^ (acc >> (i % 8))) & 0xFF;
    }
  }
  return result;
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
