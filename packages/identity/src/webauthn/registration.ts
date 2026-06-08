/**
 * KALEN WebAuthn Registration
 * Real passkey registration using @simplewebauthn/server v13.
 */

import {
  generateRegistrationOptions as webauthnGenerateRegistrationOptions,
  verifyRegistrationResponse as webauthnVerifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticatorTransport,
} from "@simplewebauthn/server";
import { WEBAUTHN_REGISTRATION_TIMEOUT, WEBAUTHN_CHALLENGE_TTL } from "@kalen/shared";
import { ChallengeStore } from "./challenge-store";

/** Configuration for the WebAuthn Relying Party */
export interface WebAuthnConfig {
  /** Human-readable RP name */
  rpName: string;
  /** RP ID (domain) */
  rpID: string;
  /** Expected origin (e.g., "https://kalen.chat") */
  origin: string;
  /** Challenge store instance */
  challengeStore: ChallengeStore;
}

/** Stored credential after successful registration */
export interface StoredCredential {
  /** Base64url-encoded credential ID */
  id: string;
  /** Base64url-encoded COSE public key */
  publicKey: string;
  /** Signature counter */
  counter: number;
  /** Transports the authenticator supports */
  transports?: AuthenticatorTransport[];
  /** Device type hint */
  deviceType?: string;
  /** Whether backed by platform authenticator */
  backedUp?: boolean;
}

/**
 * Generate WebAuthn registration options for a new passkey.
 *
 * @param config - WebAuthn Relying Party configuration
 * @param userId - Unique user identifier
 * @param userName - User email or display name
 * @param displayName - Human-readable display name
 * @param existingCredentials - User's existing credential IDs to exclude
 * @returns Registration options JSON to send to the client
 */
export async function generateRegistrationOptions(
  config: WebAuthnConfig,
  userId: string,
  userName: string,
  displayName: string,
  existingCredentials: StoredCredential[] = [],
) {
  const excludeCredentials = existingCredentials.map((cred) => ({
    id: cred.id,
    type: "public-key" as const,
    transports: cred.transports,
  }));

  const options = await webauthnGenerateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: new TextEncoder().encode(userId),
    userName,
    userDisplayName: displayName,
    timeout: WEBAUTHN_REGISTRATION_TIMEOUT,
    excludeCredentials,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    attestationType: "none",
  });

  await config.challengeStore.setChallenge(userId, options.challenge, WEBAUTHN_CHALLENGE_TTL);

  return options;
}

/**
 * Convert a Uint8Array to a base64url-encoded string.
 */
function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Verify a WebAuthn registration response from the client.
 *
 * @param config - WebAuthn Relying Party configuration
 * @param userId - User identifier
 * @param response - Registration response from the browser
 * @returns Verified credential data or null on failure
 */
export async function verifyRegistrationResponse(
  config: WebAuthnConfig,
  userId: string,
  response: RegistrationResponseJSON,
): Promise<{ credential: StoredCredential; verified: true } | { verified: false; error: string }> {
  const expectedChallenge = await config.challengeStore.getChallenge(userId);
  if (!expectedChallenge) {
    return { verified: false, error: "No pending registration challenge found (expired or missing)" };
  }

  try {
    const verification = await webauthnVerifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { verified: false, error: "Registration verification failed" };
    }

    const { registrationInfo } = verification;
    const cred = registrationInfo.credential;

    const credential: StoredCredential = {
      id: cred.id,
      publicKey: uint8ArrayToBase64url(cred.publicKey),
      counter: cred.counter,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
      deviceType: registrationInfo.credentialDeviceType,
      backedUp: registrationInfo.credentialBackedUp,
    };

    await config.challengeStore.deleteChallenge(userId);

    return { verified: true, credential };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown verification error";
    return { verified: false, error: message };
  }
}
