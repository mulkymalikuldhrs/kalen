/**
 * KALEN JWT Token Management
 * Issue, verify, and refresh JWT tokens for humans and agents.
 */

import { SignJWT, jwtVerify, JWTPayload } from "jose";
import {
  JWT_ISSUER,
  JWT_AUDIENCE,
  HUMAN_ACCESS_TOKEN_TTL,
  HUMAN_REFRESH_TOKEN_TTL,
  AGENT_ACCESS_TOKEN_TTL,
  AGENT_REFRESH_TOKEN_TTL,
  AGENT_SUFFIX,
} from "@kalen/shared";

/** JWT payload structure for KALEN tokens */
export interface TokenPayload {
  /** Identity kind: human or agent */
  kind: "human" | "agent";
  /** Subject: userId for humans, agentId for agents */
  sub: string;
  /** Agent suffix (only for agent tokens) */
  suffix?: typeof AGENT_SUFFIX;
  /** Permission scopes (only for agent tokens) */
  scopes?: string[];
  /** Token type: access or refresh */
  tokenType: "access" | "refresh";
}

/** Decoded token with full payload and metadata */
export interface DecodedToken {
  payload: TokenPayload;
  expired: boolean;
  expiresAt: Date;
}

/**
 * Encode a secret string to a Uint8Array for jose.
 */
function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Create a JWT token.
 *
 * @param payload - Token payload
 * @param secret - Signing secret
 * @param ttlSeconds - Time-to-live in seconds
 * @returns Signed JWT string
 */
export async function createToken(
  payload: TokenPayload,
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  const key = encodeSecret(secret);

  const claims: Record<string, unknown> = {
    kind: payload.kind,
    tokenType: payload.tokenType,
  };

  if (payload.suffix) {
    claims.suffix = payload.suffix;
  }

  if (payload.scopes && payload.scopes.length > 0) {
    claims.scopes = payload.scopes;
  }

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key);
}

/**
 * Issue an access token for a human user.
 *
 * @param userId - The human user ID
 * @param secret - JWT signing secret
 * @returns Signed access token
 */
export async function issueHumanAccessToken(userId: string, secret: string): Promise<string> {
  return createToken(
    {
      kind: "human",
      sub: userId,
      tokenType: "access",
    },
    secret,
    HUMAN_ACCESS_TOKEN_TTL,
  );
}

/**
 * Issue a refresh token for a human user.
 *
 * @param userId - The human user ID
 * @param secret - JWT signing secret
 * @returns Signed refresh token
 */
export async function issueHumanRefreshToken(userId: string, secret: string): Promise<string> {
  return createToken(
    {
      kind: "human",
      sub: userId,
      tokenType: "refresh",
    },
    secret,
    HUMAN_REFRESH_TOKEN_TTL,
  );
}

/**
 * Issue an access token for an agent.
 *
 * @param agentId - The agent ID
 * @param scopes - Permission scopes
 * @param secret - JWT signing secret
 * @returns Signed access token
 */
export async function issueAgentAccessToken(
  agentId: string,
  scopes: string[],
  secret: string,
): Promise<string> {
  return createToken(
    {
      kind: "agent",
      sub: agentId,
      suffix: AGENT_SUFFIX,
      scopes,
      tokenType: "access",
    },
    secret,
    AGENT_ACCESS_TOKEN_TTL,
  );
}

/**
 * Issue a refresh token for an agent.
 *
 * @param agentId - The agent ID
 * @param scopes - Permission scopes
 * @param secret - JWT signing secret
 * @returns Signed refresh token
 */
export async function issueAgentRefreshToken(
  agentId: string,
  scopes: string[],
  secret: string,
): Promise<string> {
  return createToken(
    {
      kind: "agent",
      sub: agentId,
      suffix: AGENT_SUFFIX,
      scopes,
      tokenType: "refresh",
    },
    secret,
    AGENT_REFRESH_TOKEN_TTL,
  );
}

/**
 * Verify and decode a JWT token.
 *
 * @param token - The JWT token string
 * @param secret - JWT verification secret
 * @returns Decoded token payload, or null if invalid/expired
 */
export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const key = encodeSecret(secret);
    const { payload } = await jwtVerify(token, key, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (!payload.sub || !payload.kind) {
      return null;
    }

    const result: TokenPayload = {
      kind: payload.kind as "human" | "agent",
      sub: payload.sub,
      tokenType: (payload.tokenType as "access" | "refresh") ?? "access",
    };

    if (payload.suffix) {
      result.suffix = payload.suffix as typeof AGENT_SUFFIX;
    }

    if (payload.scopes && Array.isArray(payload.scopes)) {
      result.scopes = payload.scopes as string[];
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT token without verification (for inspection only).
 *
 * @param token - The JWT token string
 * @returns Decoded token with expiration info, or null if malformed
 */
export function decodeTokenWithoutVerify(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payloadJson = atob(payloadB64 + padding);
    const raw = JSON.parse(payloadJson) as JWTPayload;

    if (!raw.sub) return null;

    const expiresAt = raw.exp ? new Date(raw.exp * 1000) : new Date(0);
    const expired = raw.exp ? Date.now() > raw.exp * 1000 : true;

    const payload: TokenPayload = {
      kind: (raw.kind as "human" | "agent") ?? "human",
      sub: raw.sub,
      tokenType: ((raw.tokenType as "access" | "refresh") ?? "access"),
    };

    if (raw.suffix) payload.suffix = raw.suffix as typeof AGENT_SUFFIX;
    if (raw.scopes && Array.isArray(raw.scopes)) payload.scopes = raw.scopes as string[];

    return { payload, expired, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Refresh a token by verifying the refresh token and issuing new tokens.
 *
 * @param refreshToken - The refresh token
 * @param secret - JWT signing/verification secret
 * @returns New access and refresh tokens, or null if refresh token is invalid
 */
export async function refreshTokens(
  refreshToken: string,
  secret: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const payload = await verifyToken(refreshToken, secret);
  if (!payload || payload.tokenType !== "refresh") {
    return null;
  }

  let accessToken: string;
  let newRefreshToken: string;

  if (payload.kind === "human") {
    accessToken = await issueHumanAccessToken(payload.sub, secret);
    newRefreshToken = await issueHumanRefreshToken(payload.sub, secret);
  } else {
    accessToken = await issueAgentAccessToken(payload.sub, payload.scopes ?? [], secret);
    newRefreshToken = await issueAgentRefreshToken(payload.sub, payload.scopes ?? [], secret);
  }

  return { accessToken, refreshToken: newRefreshToken };
}
