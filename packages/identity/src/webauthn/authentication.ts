/**
 * KALEN WebAuthn Authentication
 * Real passkey authentication using @simplewebauthn/server v13.
 */

import {
  generateAuthenticationOptions as webauthnGenerateAuthenticationOptions,
  verifyAuthenticationResponse as webauthnVerifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
} from "@simplewebauthn/server";
import { WEBAUTHN_AUTHENTICATION_TIMEOUT, WEBAUTHN_CHALLENGE_TTL } from "@kalen/shared";
import { ChallengeStore } from "./challenge-store";
import type { StoredCredential } from "./registration";

/** Authentication configuration */
export interface AuthenticationConfig {
  /** RP ID (domain) */
  rpID: string;
  /** Expected origin */
  origin: string;
  /** Challenge store instance */
  challengeStore: ChallengeStore;
}

/**
 * Convert a base64url-encoded string to a Uint8Array.
 */
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate WebAuthn authentication options for passkey login.
 *
 * @param config - Authentication configuration
 * @param credentials - User's stored credentials to allow
 * @returns Authentication options JSON to send to the client
 */
export async function generateAuthenticationOptions(
  config: AuthenticationConfig,
  credentials: StoredCredential[] = [],
) {
  const allowCredentials = credentials.map((cred) => ({
    id: cred.id,
    type: "public-key" as const,
    transports: cred.transports,
  }));

  const options = await webauthnGenerateAuthenticationOptions({
    rpID: config.rpID,
    timeout: WEBAUTHN_AUTHENTICATION_TIMEOUT,
    allowCredentials,
    userVerification: "required",
  });

  // Use a composite key for the challenge since we don't have a userId yet
  const challengeKey = `auth:${options.challenge}`;
  await config.challengeStore.setChallenge(challengeKey, options.challenge, WEBAUTHN_CHALLENGE_TTL);

  return { options, challengeKey };
}

/**
 * Verify a WebAuthn authentication response from the client.
 *
 * @param config - Authentication configuration
 * @param challengeKey - The key used to store the challenge
 * @param response - Authentication response from the browser
 * @param credential - The stored credential being authenticated
 * @returns Verification result
 */
export async function verifyAuthenticationResponse(
  config: AuthenticationConfig,
  challengeKey: string,
  response: AuthenticationResponseJSON,
  credential: StoredCredential,
): Promise<{ verified: true; newCounter: number } | { verified: false; error: string }> {
  const expectedChallenge = await config.challengeStore.getChallenge(challengeKey);
  if (!expectedChallenge) {
    return { verified: false, error: "No pending authentication challenge found (expired or missing)" };
  }

  try {
    const verification = await webauthnVerifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      credential: {
        id: credential.id,
        publicKey: base64urlToUint8Array(credential.publicKey) as Uint8Array<ArrayBuffer>,
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransport[] | undefined,
      },
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return { verified: false, error: "Authentication verification failed" };
    }

    await config.challengeStore.deleteChallenge(challengeKey);

    return {
      verified: true,
      newCounter: verification.authenticationInfo.newCounter,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown verification error";
    return { verified: false, error: message };
  }
}
