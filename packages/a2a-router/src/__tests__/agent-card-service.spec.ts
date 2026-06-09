/**
 * @kalen/a2a-router — Agent Card Service Tests
 */
import { AgentCardService } from "../agent-card/agent-card-service";
import type { AgentCard } from "@kalen/shared";
import { Ed25519Signer } from "@kalen/identity";

// ─── Helper ───────────────────────────────────────────────────────

function createValidCard(overrides: Partial<AgentCard> = {}): AgentCard {
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
    ...overrides,
  };
}

describe("AgentCardService", () => {
  let service: AgentCardService;

  beforeEach(() => {
    service = new AgentCardService();
  });

  describe("registerCard", () => {
    it("registers a valid agent card", async () => {
      const card = createValidCard();
      const result = await service.registerCard(card);
      expect(result).toEqual(card);
    });

    it("rejects a card without name", async () => {
      const card = createValidCard({ name: "" });
      await expect(service.registerCard(card)).rejects.toThrow("must have a name");
    });

    it("rejects a card without (ai) suffix in name", async () => {
      const card = createValidCard({ name: "NoSuffix" });
      await expect(service.registerCard(card)).rejects.toThrow("(ai)");
    });

    it("rejects a card without URL", async () => {
      const card = createValidCard({ url: "" });
      await expect(service.registerCard(card)).rejects.toThrow("must have a URL");
    });

    it("rejects a card with invalid URL", async () => {
      const card = createValidCard({ url: "not-a-valid-url" });
      await expect(service.registerCard(card)).rejects.toThrow("valid URL");
    });

    it("rejects a card without capabilities", async () => {
      const card = createValidCard({ capabilities: undefined as any });
      await expect(service.registerCard(card)).rejects.toThrow("capabilities");
    });

    it("rejects a card without endpoints", async () => {
      const card = createValidCard({ endpoints: undefined as any });
      await expect(service.registerCard(card)).rejects.toThrow("endpoints");
    });

    it("rejects a card without authentication", async () => {
      const card = createValidCard({ authentication: undefined as any });
      await expect(service.registerCard(card)).rejects.toThrow("authentication");
    });

    it("rejects a card with invalid authentication scheme", async () => {
      const card = createValidCard({ authentication: { scheme: "invalid" as any } });
      await expect(service.registerCard(card)).rejects.toThrow("authentication scheme");
    });

    it("rejects duplicate URL registration", async () => {
      const card = createValidCard();
      await service.registerCard(card);
      await expect(service.registerCard(card)).rejects.toThrow("already registered");
    });

    it("rejects duplicate name registration", async () => {
      const card1 = createValidCard();
      const card2 = createValidCard({ url: "https://different.example.com" });
      await service.registerCard(card1);
      await expect(service.registerCard(card2)).rejects.toThrow("already registered");
    });
  });

  describe("getCardByUrl", () => {
    it("returns null for unknown URL", () => {
      expect(service.getCardByUrl("https://unknown.com")).toBeNull();
    });

    it("returns the registered card", async () => {
      const card = createValidCard();
      await service.registerCard(card);
      expect(service.getCardByUrl(card.url)).toEqual(card);
    });
  });

  describe("getCardByName", () => {
    it("returns null for unknown name", () => {
      expect(service.getCardByName("Unknown (ai)")).toBeNull();
    });

    it("returns the registered card by name", async () => {
      const card = createValidCard();
      await service.registerCard(card);
      expect(service.getCardByName(card.name)).toEqual(card);
    });
  });

  describe("listCards", () => {
    it("returns empty list initially", () => {
      expect(service.listCards()).toEqual([]);
    });

    it("returns all registered cards", async () => {
      await service.registerCard(createValidCard());
      await service.registerCard(createValidCard({
        name: "Another (ai)",
        url: "https://another.example.com",
      }));
      expect(service.listCards()).toHaveLength(2);
    });
  });

  describe("updateCard", () => {
    it("updates card fields", async () => {
      const card = createValidCard();
      await service.registerCard(card);

      const updated = await service.updateCard(card.url, {
        description: "Updated description",
      });

      expect(updated.description).toBe("Updated description");
    });

    it("preserves URL even if update tries to change it", async () => {
      const card = createValidCard();
      await service.registerCard(card);

      const updated = await service.updateCard(card.url, {
        url: "https://new-url.com",
      } as any);

      // URL cannot be changed
      expect(updated.url).toBe(card.url);
    });

    it("re-validates the updated card", async () => {
      const card = createValidCard();
      await service.registerCard(card);

      await expect(
        service.updateCard(card.url, { name: "NoSuffix" }),
      ).rejects.toThrow("invalid");
    });

    it("throws for unknown card URL", async () => {
      await expect(
        service.updateCard("https://unknown.com", { description: "x" }),
      ).rejects.toThrow("not found");
    });

    it("re-signs card when private key is provided", async () => {
      const signer = Ed25519Signer.generate();
      const privateKeyBase64 = signer.getPrivateKeyBytes()!;
      const publicKeyBase64 = signer.getPublicKeyBase64url();

      // Convert private key to base64url
      let binary = "";
      for (let i = 0; i < privateKeyBase64.length; i++) {
        binary += String.fromCharCode(privateKeyBase64[i]);
      }
      const privateKeyB64url = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      // Register card without signature first (signature is only checked when both signature and publicKey are present)
      const card = createValidCard({
        publicKey: publicKeyBase64,
      });
      await service.registerCard(card);

      const updated = await service.updateCard(card.url, {
        description: "Updated",
      }, privateKeyB64url);

      // Signature should now be present and valid
      expect(updated.signature).toBeTruthy();
      expect(updated.signature).not.toBe("");
    });
  });

  describe("unregisterCard", () => {
    it("removes a registered card", async () => {
      const card = createValidCard();
      await service.registerCard(card);
      expect(service.unregisterCard(card.url)).toBe(true);
      expect(service.getCardByUrl(card.url)).toBeNull();
    });

    it("returns false for unknown URL", () => {
      expect(service.unregisterCard("https://unknown.com")).toBe(false);
    });
  });

  describe("validateAgentCard", () => {
    it("validates a properly structured card", () => {
      const card = createValidCard();
      const result = service.validateAgentCard(card);
      expect(result.valid).toBe(true);
    });

    it("validates all authentication schemes", () => {
      for (const scheme of ["none", "bearer", "oauth2", "mtls"]) {
        const card = createValidCard({ authentication: { scheme: scheme as any } });
        const result = service.validateAgentCard(card);
        expect(result.valid).toBe(true);
      }
    });

    it("rejects an invalid signature", () => {
      const card = createValidCard({
        publicKey: "fake-key",
        signature: "fake-signature",
      });
      const result = service.validateAgentCard(card);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("signature verification failed");
    });
  });

  describe("serveWellKnown", () => {
    it("returns card data for .well-known endpoint", async () => {
      const card = createValidCard();
      await service.registerCard(card);

      const served = service.serveWellKnown(card.url);
      expect(served).toEqual(card);
    });

    it("returns null for unknown base URL", () => {
      expect(service.serveWellKnown("https://unknown.com")).toBeNull();
    });
  });
});
