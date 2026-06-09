/**
 * @kalen/a2a-router — Card Signer Tests
 */
import { signAgentCard, verifyAgentCardSignature } from "../security/card-signer";
import { Ed25519Signer } from "@kalen/identity";
import type { AgentCard } from "@kalen/shared";

// ─── Helper ───────────────────────────────────────────────────────

function createValidCard(): AgentCard {
  return {
    name: "TestAgent (ai)",
    url: "https://agent.example.com",
    description: "A test agent",
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    endpoints: [{ method: "POST", path: "/a2a" }],
    authentication: { scheme: "bearer" },
    version: "1.0.0",
  };
}

function privateKeyToBase64url(key: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < key.length; i++) {
    binary += String.fromCharCode(key[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

describe("signAgentCard", () => {
  it("signs a card and returns a base64url signature", () => {
    const signer = Ed25519Signer.generate();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);
    const card = createValidCard();

    const signature = signAgentCard(card, privateKeyB64url);

    expect(signature).toBeTruthy();
    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces the same signature for the same card and key", () => {
    const signer = Ed25519Signer.generate();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);
    const card = createValidCard();

    const sig1 = signAgentCard(card, privateKeyB64url);
    const sig2 = signAgentCard(card, privateKeyB64url);
    expect(sig1).toBe(sig2);
  });

  it("produces different signatures for different cards", () => {
    const signer = Ed25519Signer.generate();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);
    const card1 = createValidCard();
    const card2 = { ...createValidCard(), name: "Different (ai)" };

    const sig1 = signAgentCard(card1, privateKeyB64url);
    const sig2 = signAgentCard(card2, privateKeyB64url);
    expect(sig1).not.toBe(sig2);
  });
});

describe("verifyAgentCardSignature", () => {
  it("verifies a valid signature", () => {
    const signer = Ed25519Signer.generate();
    const publicKey = signer.getPublicKeyBase64url();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);

    const card = createValidCard();
    card.publicKey = publicKey;
    card.signature = signAgentCard(card, privateKeyB64url);

    const isValid = verifyAgentCardSignature(card);
    expect(isValid).toBe(true);
  });

  it("rejects a tampered card", () => {
    const signer = Ed25519Signer.generate();
    const publicKey = signer.getPublicKeyBase64url();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);

    const card = createValidCard();
    card.publicKey = publicKey;
    card.signature = signAgentCard(card, privateKeyB64url);

    // Tamper with the card
    card.description = "Tampered description";

    const isValid = verifyAgentCardSignature(card);
    expect(isValid).toBe(false);
  });

  it("returns false when signature is missing", () => {
    const card = createValidCard();
    card.publicKey = "some-key";
    // No signature

    expect(verifyAgentCardSignature(card)).toBe(false);
  });

  it("returns false when publicKey is missing", () => {
    const card = createValidCard();
    card.signature = "some-sig";
    // No publicKey

    expect(verifyAgentCardSignature(card)).toBe(false);
  });

  it("returns false when signed with different key", () => {
    const signer1 = Ed25519Signer.generate();
    const signer2 = Ed25519Signer.generate();

    const privateKeyB64url1 = privateKeyToBase64url(signer1.getPrivateKeyBytes()!);
    const publicKey2 = signer2.getPublicKeyBase64url();

    const card = createValidCard();
    card.signature = signAgentCard(card, privateKeyB64url1);
    card.publicKey = publicKey2; // Wrong public key

    expect(verifyAgentCardSignature(card)).toBe(false);
  });

  it("returns false for invalid signature format", () => {
    const card = createValidCard();
    card.publicKey = "some-key";
    card.signature = "not-a-valid-signature";

    expect(verifyAgentCardSignature(card)).toBe(false);
  });

  it("ignores the signature field during verification (canonical form)", () => {
    const signer = Ed25519Signer.generate();
    const publicKey = signer.getPublicKeyBase64url();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);

    const card = createValidCard();
    card.publicKey = publicKey;
    card.signature = signAgentCard(card, privateKeyB64url);

    // Changing the signature field should not affect verification
    // because the signature field is excluded from the canonical payload
    const originalSig = card.signature;
    card.signature = originalSig; // same sig, but this is a no-op
    expect(verifyAgentCardSignature(card)).toBe(true);
  });
});

describe("sign and verify round-trip", () => {
  it("sign then verify succeeds for an authentic card", () => {
    const signer = Ed25519Signer.generate();
    const publicKey = signer.getPublicKeyBase64url();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);

    const card: AgentCard = {
      name: "RoundTrip (ai)",
      url: "https://roundtrip.example.com",
      description: "Round trip test",
      capabilities: {
        streaming: false,
        pushNotifications: true,
        stateTransitionHistory: true,
      },
      endpoints: [
        { method: "POST", path: "/a2a/task" },
        { method: "GET", path: "/a2a/card" },
      ],
      authentication: { scheme: "oauth2", scopes: ["a2a:task"] },
      version: "2.0.0",
      publicKey,
    };

    card.signature = signAgentCard(card, privateKeyB64url);
    expect(verifyAgentCardSignature(card)).toBe(true);
  });

  it("sign then verify fails when card content is modified", () => {
    const signer = Ed25519Signer.generate();
    const publicKey = signer.getPublicKeyBase64url();
    const privateKeyB64url = privateKeyToBase64url(signer.getPrivateKeyBytes()!);

    const card = createValidCard();
    card.publicKey = publicKey;
    card.signature = signAgentCard(card, privateKeyB64url);

    // Modify the capabilities after signing
    card.capabilities.pushNotifications = true;

    expect(verifyAgentCardSignature(card)).toBe(false);
  });
});
