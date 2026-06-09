/**
 * @kalen/identity — Verification Tests
 */
import { verifyAgentToken, checkSuffixEnforcement, verifyAgentIdentity } from "../agent-identity/verification";
import { createManifest } from "../agent-identity/manifest";
import { Ed25519Signer, createAgentIdentity } from "../agent-identity/creation";
import { createToken, issueAgentAccessToken, issueHumanAccessToken } from "../token/jwt";
import type { AgentIdentity } from "@kalen/shared";
import { AGENT_SUFFIX, AGENT_DISPLAY_SUFFIX, AGENT_ACCESS_TOKEN_TTL } from "@kalen/shared";

describe("verifyAgentToken", () => {
  const secret = "test-jwt-secret-for-verification";

  it("verifies a valid agent token", async () => {
    const agentId = "agent-123";
    const scopes = ["mcp:tool_call"];
    const token = await issueAgentAccessToken(agentId, scopes, secret);

    const result = await verifyAgentToken(token, secret);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("agent");
    expect(result!.sub).toBe(agentId);
    expect(result!.suffix).toBe(AGENT_SUFFIX);
    expect(result!.scopes).toEqual(scopes);
  });

  it("returns null for a human token", async () => {
    const token = await issueHumanAccessToken("user-123", secret);
    const result = await verifyAgentToken(token, secret);
    expect(result).toBeNull();
  });

  it("returns null for an expired token", async () => {
    // Create token with 0 TTL — immediately expired
    const token = await createToken(
      { kind: "agent", sub: "agent-1", suffix: AGENT_SUFFIX, scopes: [], tokenType: "access" },
      secret,
      -1, // already expired
    );
    const result = await verifyAgentToken(token, secret);
    expect(result).toBeNull();
  });

  it("returns null for a token with wrong secret", async () => {
    const token = await issueAgentAccessToken("agent-1", [], secret);
    const result = await verifyAgentToken(token, "wrong-secret");
    expect(result).toBeNull();
  });

  it("returns null for malformed token", async () => {
    const result = await verifyAgentToken("not-a-jwt", secret);
    expect(result).toBeNull();
  });
});

describe("checkSuffixEnforcement", () => {
  let signer: Ed25519Signer;

  beforeEach(() => {
    signer = Ed25519Signer.generate();
  });

  function makeAgentIdentity(overrides: Partial<AgentIdentity> = {}): AgentIdentity {
    const manifest = createManifest(
      { name: "TestBot (ai)", description: "desc", tools: [], capabilities: [] },
      signer,
    );
    return {
      agentId: "agent-1",
      name: "TestBot (ai)",
      suffix: "(ai)",
      keypairPublicKey: signer.getPublicKeyBase64url(),
      manifest,
      owner: "user-1",
      scopes: [],
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it("passes for a properly suffixed agent identity", () => {
    const identity = makeAgentIdentity();
    const result = checkSuffixEnforcement(identity);
    expect(result.valid).toBe(true);
  });

  it("fails if suffix is wrong", () => {
    const identity = makeAgentIdentity({ suffix: "(human)" as "(ai)" });
    const result = checkSuffixEnforcement(identity);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("(ai)");
  });

  it("fails if name does not end with display suffix", () => {
    const identity = makeAgentIdentity({ name: "TestBot" });
    const result = checkSuffixEnforcement(identity);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("does not end with");
  });

  it("fails if manifest name does not end with display suffix", () => {
    const identity = makeAgentIdentity();
    // Tamper the manifest name
    identity.manifest = { ...identity.manifest, name: "NoSuffix" };
    const result = checkSuffixEnforcement(identity);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("manifest name");
  });
});

describe("verifyAgentIdentity", () => {
  const secret = "test-jwt-secret-for-identity";

  it("passes comprehensive verification for a valid identity", async () => {
    const result = await createAgentIdentity(
      "ValidBot (ai)",
      "A valid test agent",
      "owner-1",
      [],
      [],
      ["mcp:tool_call"],
      secret,
    );

    const verification = await verifyAgentIdentity(
      result.identity,
      result.accessToken,
      secret,
    );
    expect(verification.valid).toBe(true);
    expect(verification.errors).toHaveLength(0);
  });

  it("fails when token is invalid", async () => {
    const result = await createAgentIdentity(
      "Bot (ai)",
      "desc",
      "owner-1",
      [],
      [],
      [],
      secret,
    );

    const verification = await verifyAgentIdentity(
      result.identity,
      "invalid-token",
      secret,
    );
    expect(verification.valid).toBe(false);
    expect(verification.errors).toContainEqual(expect.stringContaining("token"));
  });

  it("fails when token subject does not match agent ID", async () => {
    const result = await createAgentIdentity(
      "Bot (ai)",
      "desc",
      "owner-1",
      [],
      [],
      [],
      secret,
    );

    // Issue token for a different agent
    const wrongToken = await issueAgentAccessToken("different-agent-id", [], secret);

    const verification = await verifyAgentIdentity(
      result.identity,
      wrongToken,
      secret,
    );
    expect(verification.valid).toBe(false);
    expect(verification.errors.some((e) => e.includes("subject"))).toBe(true);
  });

  it("accumulates multiple errors", async () => {
    const signer = Ed25519Signer.generate();
    const manifest = createManifest(
      { name: "BadBot (ai)", description: "desc", tools: [], capabilities: [] },
      signer,
    );

    const identity: AgentIdentity = {
      agentId: "agent-bad",
      name: "BadBot", // no suffix
      suffix: "(wrong)" as "(ai)", // wrong suffix
      keypairPublicKey: signer.getPublicKeyBase64url(),
      manifest,
      owner: "user-1",
      scopes: [],
      createdAt: new Date().toISOString(),
    };

    const verification = await verifyAgentIdentity(identity, "bad-token", secret);
    expect(verification.valid).toBe(false);
    // Should have errors for: suffix, manifest signature (might fail due to tampered name), token
    expect(verification.errors.length).toBeGreaterThanOrEqual(2);
  });
});
