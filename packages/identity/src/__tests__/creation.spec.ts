/**
 * @kalen/identity — Ed25519 Signer Tests
 */
import { Ed25519Signer } from "../agent-identity/creation";

describe("Ed25519Signer", () => {
  describe("generate()", () => {
    it("creates a signer with both private and public keys", () => {
      const signer = Ed25519Signer.generate();
      expect(signer.getPrivateKeyBytes()).not.toBeNull();
      expect(signer.getPublicKeyBytes()).not.toBeNull();
      expect(signer.getPublicKeyBytes().length).toBe(32);
    });

    it("produces different keypairs on each call", () => {
      const signer1 = Ed25519Signer.generate();
      const signer2 = Ed25519Signer.generate();

      const pub1 = signer1.getPublicKeyBase64url();
      const pub2 = signer2.getPublicKeyBase64url();
      expect(pub1).not.toBe(pub2);
    });

    it("generates a valid base64url-encoded public key", () => {
      const signer = Ed25519Signer.generate();
      const pubKey = signer.getPublicKeyBase64url();
      // Base64url characters only
      expect(pubKey).toMatch(/^[A-Za-z0-9_-]+$/);
      // Decoded length should be 32 bytes => 43 base64url chars
      expect(pubKey.length).toBe(43);
    });
  });

  describe("fromPrivateKey()", () => {
    it("derives the correct public key from a private key", () => {
      const original = Ed25519Signer.generate();
      const privateKey = original.getPrivateKeyBytes()!;
      const derived = Ed25519Signer.fromPrivateKey(privateKey);

      expect(derived.getPublicKeyBase64url()).toBe(original.getPublicKeyBase64url());
    });

    it("can sign with the derived signer", () => {
      const original = Ed25519Signer.generate();
      const derived = Ed25519Signer.fromPrivateKey(original.getPrivateKeyBytes()!);

      const message = "test message";
      const sig1 = original.sign(message);
      const sig2 = derived.sign(message);

      // Both should produce valid signatures
      expect(Ed25519Signer.verify(message, sig1, original.getPublicKeyBase64url())).toBe(true);
      expect(Ed25519Signer.verify(message, sig2, derived.getPublicKeyBase64url())).toBe(true);
    });
  });

  describe("fromBytes()", () => {
    it("creates a verify-only signer when privateKey is null", () => {
      const original = Ed25519Signer.generate();
      const verifyOnly = Ed25519Signer.fromBytes(null, original.getPublicKeyBytes());

      expect(verifyOnly.getPrivateKeyBytes()).toBeNull();
      expect(() => verifyOnly.sign("test")).toThrow("no private key");
    });

    it("creates a full signer when both keys are provided", () => {
      const original = Ed25519Signer.generate();
      const fromBytes = Ed25519Signer.fromBytes(
        original.getPrivateKeyBytes()!,
        original.getPublicKeyBytes(),
      );

      expect(fromBytes.getPrivateKeyBytes()).not.toBeNull();
      expect(fromBytes.getPublicKeyBase64url()).toBe(original.getPublicKeyBase64url());
    });
  });

  describe("sign()", () => {
    it("produces a base64url-encoded signature", () => {
      const signer = Ed25519Signer.generate();
      const sig = signer.sign("hello world");
      expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("produces different signatures for different messages", () => {
      const signer = Ed25519Signer.generate();
      const sig1 = signer.sign("message 1");
      const sig2 = signer.sign("message 2");
      expect(sig1).not.toBe(sig2);
    });

    it("produces the same signature for the same message", () => {
      const signer = Ed25519Signer.generate();
      const sig1 = signer.sign("same message");
      const sig2 = signer.sign("same message");
      expect(sig1).toBe(sig2);
    });

    it("throws when called on a verify-only instance", () => {
      const signer = Ed25519Signer.fromBytes(null, Ed25519Signer.generate().getPublicKeyBytes());
      expect(() => signer.sign("test")).toThrow("no private key");
    });
  });

  describe("verify()", () => {
    it("verifies a valid signature", () => {
      const signer = Ed25519Signer.generate();
      const message = "verify this message";
      const signature = signer.sign(message);

      const isValid = Ed25519Signer.verify(message, signature, signer.getPublicKeyBase64url());
      expect(isValid).toBe(true);
    });

    it("rejects a tampered message", () => {
      const signer = Ed25519Signer.generate();
      const message = "original message";
      const signature = signer.sign(message);

      const isValid = Ed25519Signer.verify("tampered message", signature, signer.getPublicKeyBase64url());
      expect(isValid).toBe(false);
    });

    it("rejects a signature with wrong public key", () => {
      const signer1 = Ed25519Signer.generate();
      const signer2 = Ed25519Signer.generate();
      const message = "test message";
      const signature = signer1.sign(message);

      const isValid = Ed25519Signer.verify(message, signature, signer2.getPublicKeyBase64url());
      expect(isValid).toBe(false);
    });

    it("returns false for malformed signature", () => {
      const signer = Ed25519Signer.generate();
      const isValid = Ed25519Signer.verify("message", "not-a-valid-sig", signer.getPublicKeyBase64url());
      expect(isValid).toBe(false);
    });

    it("returns false for malformed public key", () => {
      const signer = Ed25519Signer.generate();
      const signature = signer.sign("message");
      const isValid = Ed25519Signer.verify("message", signature, "not-a-valid-key");
      expect(isValid).toBe(false);
    });

    it("returns false for empty signature", () => {
      const signer = Ed25519Signer.generate();
      const isValid = Ed25519Signer.verify("message", "", signer.getPublicKeyBase64url());
      expect(isValid).toBe(false);
    });
  });
});
