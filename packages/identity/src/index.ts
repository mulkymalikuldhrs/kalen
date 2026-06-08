/**
 * @kalen/identity — KALEN Identity Service
 * WebAuthn, agent identity, RBAC, and JWT token management.
 */

// WebAuthn
export { generateRegistrationOptions, verifyRegistrationResponse } from "./webauthn/registration";
export type { WebAuthnConfig, StoredCredential } from "./webauthn/registration";
export { generateAuthenticationOptions, verifyAuthenticationResponse } from "./webauthn/authentication";
export type { AuthenticationConfig } from "./webauthn/authentication";
export { ChallengeStore } from "./webauthn/challenge-store";
export type { RedisClient } from "./webauthn/challenge-store";

// Agent Identity
export { createAgentIdentity, Ed25519Signer } from "./agent-identity/creation";
export type { CreateAgentIdentityResult } from "./agent-identity/creation";
export { verifyAgentToken, verifyAgentManifest, checkSuffixEnforcement, verifyAgentIdentity } from "./agent-identity/verification";
export { createManifest, validateManifest, signManifest, verifyManifestSignature } from "./agent-identity/manifest";
export type { CreateManifestInput } from "./agent-identity/manifest";

// RBAC
export { Role, Permission, rolePermissions } from "./rbac/roles";
export {
  checkPermission,
  checkPermissions,
  hasAnyPermission,
  getRolePermissions,
  checkScope,
  evaluateAccess,
} from "./rbac/permission-check";
export type { AgentScope, ScopeResource } from "./rbac/permission-check";

// Token
export {
  createToken,
  issueHumanAccessToken,
  issueHumanRefreshToken,
  issueAgentAccessToken,
  issueAgentRefreshToken,
  verifyToken,
  decodeTokenWithoutVerify,
  refreshTokens,
} from "./token/jwt";
export type { TokenPayload, DecodedToken } from "./token/jwt";
