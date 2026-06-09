/**
 * @kalen/identity — WebAuthn Registration and Authentication Tests
 * Uses manual mock from __mocks__/@simplewebauthn/server.ts
 */

jest.mock("@simplewebauthn/server");

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  generateRegistrationOptions as kalenGenerateRegistration,
  verifyRegistrationResponse as kalenVerifyRegistration,
  type WebAuthnConfig,
  type StoredCredential,
} from "../webauthn/registration";
import {
  generateAuthenticationOptions as kalenGenerateAuth,
  verifyAuthenticationResponse as kalenVerifyAuth,
  type AuthenticationConfig,
} from "../webauthn/authentication";
import { ChallengeStore, type RedisClient } from "../webauthn/challenge-store";

// Typed mock references
const mockGenerateRegistration = generateRegistrationOptions as jest.Mock;
const mockVerifyRegistration = verifyRegistrationResponse as jest.Mock;
const mockGenerateAuth = generateAuthenticationOptions as jest.Mock;
const mockVerifyAuth = verifyAuthenticationResponse as jest.Mock;

// ─── Constants ────────────────────────────────────────────────────

/** Valid 32-byte Ed25519 public key encoded as base64url (43 chars) */
const VALID_PUBKEY = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8";

// ─── Mock Redis Client ────────────────────────────────────────────

function createMockRedis(): RedisClient {
  const store = new Map<string, string>();
  return {
    set: jest.fn(async (key: string, value: string, ...args: unknown[]) => {
      store.set(key, value);
      return "OK";
    }),
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
  };
}

const webAuthnConfig: WebAuthnConfig = {
  rpName: "KALEN Test",
  rpID: "localhost",
  origin: "https://localhost:3000",
  challengeStore: new ChallengeStore(createMockRedis()),
};

const authConfig: AuthenticationConfig = {
  rpID: "localhost",
  origin: "https://localhost:3000",
  challengeStore: new ChallengeStore(createMockRedis()),
};

// ─── Registration Tests ───────────────────────────────────────────

describe("WebAuthn Registration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateRegistrationOptions", () => {
    it("calls webauthn library and stores challenge", async () => {
      const mockOptions = {
        challenge: "test-challenge-base64",
        rp: { name: "KALEN Test", id: "localhost" },
      };
      mockGenerateRegistration.mockResolvedValue(mockOptions);

      const result = await kalenGenerateRegistration(
        webAuthnConfig,
        "user-1",
        "user@example.com",
        "Test User",
      );

      expect(mockGenerateRegistration).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: "KALEN Test",
          rpID: "localhost",
          userName: "user@example.com",
          userDisplayName: "Test User",
        }),
      );
      expect(result).toEqual(mockOptions);
    });

    it("excludes existing credentials", async () => {
      const mockOptions = { challenge: "ch", rp: {} };
      mockGenerateRegistration.mockResolvedValue(mockOptions);

      const existingCredentials: StoredCredential[] = [
        { id: "cred-1", publicKey: "key-1", counter: 0 },
        { id: "cred-2", publicKey: "key-2", counter: 5, transports: ["internal"] },
      ];

      await kalenGenerateRegistration(
        webAuthnConfig,
        "user-1",
        "user@example.com",
        "Test User",
        existingCredentials,
      );

      expect(mockGenerateRegistration).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [
            { id: "cred-1", type: "public-key", transports: undefined },
            { id: "cred-2", type: "public-key", transports: ["internal"] },
          ],
        }),
      );
    });
  });

  describe("verifyRegistrationResponse", () => {
    it("returns verified credential on success", async () => {
      await webAuthnConfig.challengeStore.setChallenge("user-reg-1", "expected-challenge", 120);

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credential: {
            id: "cred-id-1",
            publicKey: new Uint8Array(32),
            counter: 0,
            transports: ["internal"],
          },
          credentialDeviceType: "singleDevice",
          credentialBackedUp: false,
        },
      };
      mockVerifyRegistration.mockResolvedValue(mockVerification);

      const result = await kalenVerifyRegistration(
        webAuthnConfig,
        "user-reg-1",
        { id: "cred-id-1", rawId: "cred-id-1", response: {} as any, type: "public-key" },
      );

      expect(result.verified).toBe(true);
      if (result.verified) {
        expect(result.credential.id).toBe("cred-id-1");
        expect(result.credential.counter).toBe(0);
        expect(result.credential.deviceType).toBe("singleDevice");
        expect(result.credential.backedUp).toBe(false);
      }
    });

    it("returns error when no challenge found", async () => {
      const result = await kalenVerifyRegistration(
        webAuthnConfig,
        "no-challenge-user",
        { id: "x", rawId: "x", response: {} as any, type: "public-key" },
      );

      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("challenge");
      }
    });

    it("returns error when verification returns false", async () => {
      await webAuthnConfig.challengeStore.setChallenge("user-reg-2", "challenge-2", 120);

      mockVerifyRegistration.mockResolvedValue({
        verified: false,
        registrationInfo: undefined,
      });

      const result = await kalenVerifyRegistration(
        webAuthnConfig,
        "user-reg-2",
        { id: "x", rawId: "x", response: {} as any, type: "public-key" },
      );

      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("verification failed");
      }
    });

    it("returns error on exception", async () => {
      await webAuthnConfig.challengeStore.setChallenge("user-reg-3", "challenge-3", 120);

      mockVerifyRegistration.mockRejectedValue(
        new Error("Verification error occurred"),
      );

      const result = await kalenVerifyRegistration(
        webAuthnConfig,
        "user-reg-3",
        { id: "x", rawId: "x", response: {} as any, type: "public-key" },
      );

      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("Verification error occurred");
      }
    });
  });
});

// ─── Authentication Tests ─────────────────────────────────────────

describe("WebAuthn Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAuthenticationOptions", () => {
    it("calls webauthn library and stores challenge", async () => {
      const mockOptions = {
        challenge: "auth-challenge",
        rpID: "localhost",
      };
      mockGenerateAuth.mockResolvedValue(mockOptions);

      const result = await kalenGenerateAuth(authConfig);

      expect(result.options).toEqual(mockOptions);
      expect(result.challengeKey).toContain("auth:");
    });

    it("passes credentials to allow list", async () => {
      mockGenerateAuth.mockResolvedValue({ challenge: "ch", rpID: "localhost" });

      const credentials: StoredCredential[] = [
        { id: "cred-1", publicKey: "key-1", counter: 0, transports: ["internal"] },
      ];

      await kalenGenerateAuth(authConfig, credentials);

      expect(mockGenerateAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [
            { id: "cred-1", type: "public-key", transports: ["internal"] },
          ],
        }),
      );
    });
  });

  describe("verifyAuthenticationResponse", () => {
    it("returns verified on success", async () => {
      const challengeKey = "auth:test-challenge-1";
      await authConfig.challengeStore.setChallenge(challengeKey, "test-challenge", 120);

      mockVerifyAuth.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      });

      const credential: StoredCredential = {
        id: "cred-1",
        publicKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        counter: 0,
      };

      const result = await kalenVerifyAuth(
        authConfig,
        challengeKey,
        { id: "cred-1", rawId: "cred-1", response: {} as any, type: "public-key" },
        credential,
      );

      expect(result.verified).toBe(true);
      if (result.verified) {
        expect(result.newCounter).toBe(1);
      }
    });

    it("returns error when no challenge found", async () => {
      const credential: StoredCredential = { id: "c", publicKey: VALID_PUBKEY, counter: 0 };
      const result = await kalenVerifyAuth(
        authConfig,
        "auth:nonexistent",
        { id: "c", rawId: "c", response: {} as any, type: "public-key" },
        credential,
      );

      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("challenge");
      }
    });

    it("returns error when verification returns false", async () => {
      const challengeKey = "auth:fail-challenge-1";
      await authConfig.challengeStore.setChallenge(challengeKey, "fail-challenge", 120);

      mockVerifyAuth.mockResolvedValue({
        verified: false,
        authenticationInfo: undefined,
      });

      const credential: StoredCredential = { id: "c", publicKey: VALID_PUBKEY, counter: 0 };
      const result = await kalenVerifyAuth(
        authConfig,
        challengeKey,
        { id: "c", rawId: "c", response: {} as any, type: "public-key" },
        credential,
      );

      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("verification failed");
      }
    });

    it("returns error when verification throws exception", async () => {
      const challengeKey = "auth:exception-challenge-1";
      await authConfig.challengeStore.setChallenge(challengeKey, "exception-challenge", 120);

      mockVerifyAuth.mockRejectedValue(new Error("Auth error"));

      const credential: StoredCredential = { id: "c", publicKey: VALID_PUBKEY, counter: 0 };
      const result = await kalenVerifyAuth(
        authConfig,
        challengeKey,
        { id: "c", rawId: "c", response: {} as any, type: "public-key" },
        credential,
      );

      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("Auth error");
      }
    });
  });
});

// ─── ChallengeStore Tests ─────────────────────────────────────────

describe("ChallengeStore", () => {
  let mockRedis: RedisClient;
  let store: ChallengeStore;

  beforeEach(() => {
    mockRedis = createMockRedis();
    store = new ChallengeStore(mockRedis, "test:challenge:");
  });

  it("stores and retrieves a challenge", async () => {
    await store.setChallenge("user-1", "challenge-abc", 120);
    const challenge = await store.getChallenge("user-1");
    expect(challenge).toBe("challenge-abc");
  });

  it("uses the prefix in the key", async () => {
    await store.setChallenge("user-1", "challenge", 120);
    expect(mockRedis.set).toHaveBeenCalledWith(
      "test:challenge:user-1",
      "challenge",
      "EX",
      120,
    );
  });

  it("deletes a challenge", async () => {
    await store.setChallenge("user-1", "challenge", 120);
    await store.deleteChallenge("user-1");
    const challenge = await store.getChallenge("user-1");
    expect(challenge).toBeNull();
  });

  it("returns null for non-existent challenge", async () => {
    const challenge = await store.getChallenge("nonexistent");
    expect(challenge).toBeNull();
  });
});
