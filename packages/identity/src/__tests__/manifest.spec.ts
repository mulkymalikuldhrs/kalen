/**
 * @kalen/identity — Manifest Tests
 */
import { createManifest, validateManifest, signManifest, verifyManifestSignature } from "../agent-identity/manifest";
import { Ed25519Signer } from "../agent-identity/creation";
import type { AgentManifest } from "@kalen/shared";

describe("createManifest", () => {
  let signer: Ed25519Signer;

  beforeEach(() => {
    signer = Ed25519Signer.generate();
  });

  it("creates a valid manifest with required fields", () => {
    const manifest = createManifest(
      {
        name: "TestBot (ai)",
        description: "A test agent",
        tools: ["send_message"],
        capabilities: ["streaming"],
      },
      signer,
    );

    expect(manifest.name).toBe("TestBot (ai)");
    expect(manifest.description).toBe("A test agent");
    expect(manifest.tools).toEqual(["send_message"]);
    expect(manifest.capabilities).toEqual(["streaming"]);
    expect(manifest.rateLimit).toBe(60); // DEFAULT_AGENT_RATE_LIMIT
    expect(manifest.version).toBe(1);
    expect(manifest.issuedAt).toBeTruthy();
    expect(manifest.signature).toBeTruthy();
  });

  it("uses custom rate limit when provided", () => {
    const manifest = createManifest(
      {
        name: "FastBot (ai)",
        description: "Fast agent",
        tools: [],
        capabilities: [],
        rateLimit: 120,
      },
      signer,
    );
    expect(manifest.rateLimit).toBe(120);
  });

  it("trims name and description", () => {
    const manifest = createManifest(
      {
        name: "  Bot (ai)  ",
        description: "  Some description  ",
        tools: [],
        capabilities: [],
      },
      signer,
    );
    expect(manifest.name).toBe("Bot (ai)");
    expect(manifest.description).toBe("Some description");
  });

  it("throws for invalid agent name", () => {
    expect(() =>
      createManifest(
        { name: "NoSuffix", description: "desc", tools: [], capabilities: [] },
        signer,
      ),
    ).toThrow("Invalid agent name");
  });

  it("throws for empty description", () => {
    expect(() =>
      createManifest(
        { name: "Bot (ai)", description: "", tools: [], capabilities: [] },
        signer,
      ),
    ).toThrow("description cannot be empty");
  });

  it("throws for whitespace-only description", () => {
    expect(() =>
      createManifest(
        { name: "Bot (ai)", description: "   ", tools: [], capabilities: [] },
        signer,
      ),
    ).toThrow("description cannot be empty");
  });

  it("throws if tools is not an array", () => {
    expect(() =>
      createManifest(
        { name: "Bot (ai)", description: "desc", tools: "not-array" as unknown as string[], capabilities: [] },
        signer,
      ),
    ).toThrow("Tools must be an array");
  });

  it("throws if capabilities is not an array", () => {
    expect(() =>
      createManifest(
        { name: "Bot (ai)", description: "desc", tools: [], capabilities: 42 as unknown as string[] },
        signer,
      ),
    ).toThrow("Capabilities must be an array");
  });

  it("signs the manifest with the signer", () => {
    const manifest = createManifest(
      { name: "Bot (ai)", description: "desc", tools: [], capabilities: [] },
      signer,
    );
    expect(manifest.signature).not.toBe("");
    // Verify the signature is valid
    expect(verifyManifestSignature(manifest, signer.getPublicKeyBase64url())).toBe(true);
  });
});

describe("validateManifest", () => {
  let signer: Ed25519Signer;
  let validManifest: AgentManifest;

  beforeEach(() => {
    signer = Ed25519Signer.generate();
    validManifest = createManifest(
      { name: "ValidBot (ai)", description: "desc", tools: [], capabilities: [] },
      signer,
    );
  });

  it("validates a properly created manifest", () => {
    const result = validateManifest(validManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(true);
  });

  it("rejects manifest with invalid name", () => {
    const badManifest = { ...validManifest, name: "NoSuffix" };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid manifest name");
  });

  it("rejects manifest with empty description", () => {
    const badManifest = { ...validManifest, description: "" };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("description");
  });

  it("rejects manifest with zero rateLimit", () => {
    const badManifest = { ...validManifest, rateLimit: 0 };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("rateLimit");
  });

  it("rejects manifest with negative rateLimit", () => {
    const badManifest = { ...validManifest, rateLimit: -1 };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("rateLimit");
  });

  it("rejects manifest with zero version", () => {
    const badManifest = { ...validManifest, version: 0 };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("version");
  });

  it("rejects manifest without issuedAt", () => {
    const badManifest = { ...validManifest, issuedAt: "" };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("issuedAt");
  });

  it("rejects manifest with invalid issuedAt", () => {
    const badManifest = { ...validManifest, issuedAt: "not-a-date" };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ISO 8601");
  });

  it("rejects manifest without signature", () => {
    const badManifest = { ...validManifest, signature: "" };
    const result = validateManifest(badManifest, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("signed");
  });

  it("rejects manifest with tampered content", () => {
    const tampered = { ...validManifest, description: "tampered description" };
    const result = validateManifest(tampered, signer.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("signature verification failed");
  });

  it("rejects manifest verified with wrong public key", () => {
    const wrongSigner = Ed25519Signer.generate();
    const result = validateManifest(validManifest, wrongSigner.getPublicKeyBase64url());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("signature verification failed");
  });
});

describe("signManifest / verifyManifestSignature", () => {
  it("signs and verifies a manifest correctly", () => {
    const signer = Ed25519Signer.generate();
    const manifest = createManifest(
      { name: "Bot (ai)", description: "desc", tools: [], capabilities: [] },
      signer,
    );

    const isValid = verifyManifestSignature(manifest, signer.getPublicKeyBase64url());
    expect(isValid).toBe(true);
  });

  it("fails verification for tampered manifest", () => {
    const signer = Ed25519Signer.generate();
    const manifest = createManifest(
      { name: "Bot (ai)", description: "original", tools: [], capabilities: [] },
      signer,
    );

    const tampered = { ...manifest, tools: ["new_tool"] };
    const isValid = verifyManifestSignature(tampered, signer.getPublicKeyBase64url());
    expect(isValid).toBe(false);
  });
});
