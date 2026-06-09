/**
 * @kalen/shared — Validation Utilities Tests
 */
import { validateAgentName, validateEmail, validatePublicKey, validateMCPToolSchema } from "../utils/validation";
import { AGENT_DISPLAY_SUFFIX, MIN_AGENT_NAME_LENGTH, MAX_AGENT_NAME_LENGTH, ED25519_PUBLIC_KEY_LENGTH } from "../utils/constants";

// ─── validateAgentName ────────────────────────────────────────────

describe("validateAgentName", () => {
  describe("valid names", () => {
    it("accepts a valid agent name with (ai) suffix", () => {
      const result = validateAgentName("Assistant (ai)");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts a name with minimum valid length", () => {
      // MIN_AGENT_NAME_LENGTH = 6, "X (ai)" = 6 chars
      const result = validateAgentName("X (ai)");
      expect(result.valid).toBe(true);
    });

    it("accepts a name with underscores and hyphens", () => {
      const result = validateAgentName("My_Agent-01 (ai)");
      expect(result.valid).toBe(true);
    });

    it("accepts a name with dots", () => {
      const result = validateAgentName("agent.v2 (ai)");
      expect(result.valid).toBe(true);
    });

    it("accepts a name at maximum length boundary", () => {
      const baseName = "A".repeat(MAX_AGENT_NAME_LENGTH - AGENT_DISPLAY_SUFFIX.length);
      const name = baseName + AGENT_DISPLAY_SUFFIX;
      expect(name.length).toBe(MAX_AGENT_NAME_LENGTH);
      const result = validateAgentName(name);
      expect(result.valid).toBe(true);
    });

    it("trims whitespace before validating", () => {
      const result = validateAgentName("  Agent (ai)  ");
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid suffix", () => {
    it("rejects a name without (ai) suffix", () => {
      const result = validateAgentName("Assistant");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("(ai)");
    });

    it("rejects a name with wrong suffix case", () => {
      const result = validateAgentName("Agent (AI)");
      expect(result.valid).toBe(false);
    });

    it("rejects a name with (ai) but no space before it", () => {
      const result = validateAgentName("Agent(ai)");
      expect(result.valid).toBe(false);
    });

    it("rejects a name with only the suffix (too short + empty base)", () => {
      const result = validateAgentName(" (ai)");
      expect(result.valid).toBe(false);
      // Either length check or non-empty base name check catches this
      expect(result.error).toBeTruthy();
    });
  });

  describe("length validation", () => {
    it("rejects a name that is too short", () => {
      // "(ai)" without space is only 4 chars
      const result = validateAgentName("(ai)");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least");
    });

    it("rejects a name that exceeds maximum length", () => {
      const baseName = "A".repeat(MAX_AGENT_NAME_LENGTH - AGENT_DISPLAY_SUFFIX.length + 1);
      const name = baseName + AGENT_DISPLAY_SUFFIX;
      const result = validateAgentName(name);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at most");
    });
  });

  describe("character validation", () => {
    it("rejects a name with special characters", () => {
      const result = validateAgentName("Agent@123 (ai)");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("alphanumeric");
    });

    it("rejects a name with emoji in base name", () => {
      const result = validateAgentName("🤖Bot (ai)");
      expect(result.valid).toBe(false);
    });

    it("accepts name with newline (newline trimmed by trimEnd in baseName)", () => {
      // "Agent\n (ai)" - the \n is between base and suffix
      // trimEnd on the base name removes the \n, so baseName = "Agent" which is valid
      const result = validateAgentName("Agent\n (ai)");
      expect(result.valid).toBe(true);
    });

    it("rejects a name with special characters in the base", () => {
      const result = validateAgentName("A*gent (ai)");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("alphanumeric");
    });
  });

  describe("non-string inputs", () => {
    it("rejects a number input", () => {
      const result = validateAgentName(123 as unknown as string);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("string");
    });

    it("rejects null input", () => {
      const result = validateAgentName(null as unknown as string);
      expect(result.valid).toBe(false);
    });

    it("rejects undefined input", () => {
      const result = validateAgentName(undefined as unknown as string);
      expect(result.valid).toBe(false);
    });
  });
});

// ─── validateEmail ────────────────────────────────────────────────

describe("validateEmail", () => {
  describe("valid emails", () => {
    it("accepts a standard email", () => {
      const result = validateEmail("user@example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts an email with subdomain", () => {
      const result = validateEmail("user@mail.example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts an email with plus sign", () => {
      const result = validateEmail("user+tag@example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts an email with dots in local part", () => {
      const result = validateEmail("first.last@example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts an email with hyphens in domain", () => {
      const result = validateEmail("user@my-domain.com");
      expect(result.valid).toBe(true);
    });

    it("trims and lowercases email before validating", () => {
      const result = validateEmail("  User@Example.COM  ");
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it("rejects empty string", () => {
      const result = validateEmail("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("rejects whitespace-only string", () => {
      const result = validateEmail("   ");
      expect(result.valid).toBe(false);
    });

    it("rejects email without @ sign", () => {
      const result = validateEmail("userexample.com");
      expect(result.valid).toBe(false);
    });

    it("rejects email without domain dot", () => {
      const result = validateEmail("user@localhost");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("dot");
    });

    it("rejects email with multiple @ signs", () => {
      const result = validateEmail("user@@example.com");
      expect(result.valid).toBe(false);
    });

    it("rejects email exceeding 254 characters", () => {
      const longLocal = "a".repeat(250);
      const result = validateEmail(`${longLocal}@example.com`);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("254");
    });

    it("rejects email with local part exceeding 64 characters", () => {
      const longLocal = "a".repeat(65);
      const result = validateEmail(`${longLocal}@example.com`);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("64");
    });

    it("rejects non-string input", () => {
      const result = validateEmail(42 as unknown as string);
      expect(result.valid).toBe(false);
    });
  });
});

// ─── validatePublicKey ────────────────────────────────────────────

describe("validatePublicKey", () => {
  // A valid Ed25519 public key: 32 bytes = 43 base64url characters
  function makeBase64url(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[i % chars.length];
    }
    return result;
  }

  describe("valid keys", () => {
    it("accepts a valid 32-byte Ed25519 public key (43 base64url chars)", () => {
      const key = makeBase64url(43); // ceil(32*4/3) = 43
      const result = validatePublicKey(key);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid keys", () => {
    it("rejects empty string", () => {
      const result = validatePublicKey("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("rejects non-base64url characters", () => {
      const result = validatePublicKey("invalid+key/with=padding!!!");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("base64url");
    });

    it("rejects a key with wrong decoded length", () => {
      // 44 base64url chars decodes to 33 bytes, not 32
      const key = makeBase64url(44);
      const result = validatePublicKey(key);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(ED25519_PUBLIC_KEY_LENGTH.toString());
    });

    it("rejects non-string input", () => {
      const result = validatePublicKey(123 as unknown as string);
      expect(result.valid).toBe(false);
    });
  });
});

// ─── validateMCPToolSchema ────────────────────────────────────────

describe("validateMCPToolSchema", () => {
  describe("valid schemas", () => {
    it("accepts a minimal valid schema with type object", () => {
      const result = validateMCPToolSchema({ type: "object" });
      expect(result.valid).toBe(true);
    });

    it("accepts a schema with properties and required", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts a schema with additionalProperties boolean", () => {
      const result = validateMCPToolSchema({
        type: "object",
        additionalProperties: false,
      });
      expect(result.valid).toBe(true);
    });

    it("accepts a schema with additionalProperties as object", () => {
      const result = validateMCPToolSchema({
        type: "object",
        additionalProperties: { type: "string" },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts a property with anyOf", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          value: { anyOf: [{ type: "string" }, { type: "number" }] },
        },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts a property with oneOf", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          value: { oneOf: [{ type: "string" }] },
        },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts a property with allOf", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          value: { allOf: [{ type: "string" }] },
        },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts a property with $ref", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          value: { $ref: "#/definitions/MyType" },
        },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid schemas", () => {
    it("rejects null", () => {
      const result = validateMCPToolSchema(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("null or undefined");
    });

    it("rejects undefined", () => {
      const result = validateMCPToolSchema(undefined);
      expect(result.valid).toBe(false);
    });

    it("rejects an array", () => {
      const result = validateMCPToolSchema([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("plain object");
    });

    it("rejects a string", () => {
      const result = validateMCPToolSchema("not an object");
      expect(result.valid).toBe(false);
    });

    it("rejects a schema without type object", () => {
      const result = validateMCPToolSchema({ type: "string" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('"object"');
    });

    it("rejects properties that are not objects", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          bad: "not an object",
        },
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("valid schema object");
    });

    it("rejects property without type or composition keyword", () => {
      const result = validateMCPToolSchema({
        type: "object",
        properties: {
          bad: { description: "no type" },
        },
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('"type"');
    });

    it("rejects required that is not an array", () => {
      const result = validateMCPToolSchema({
        type: "object",
        required: "name",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('"required"');
    });

    it("rejects required array with non-string items", () => {
      const result = validateMCPToolSchema({
        type: "object",
        required: ["name", 123],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("only strings");
    });

    it("rejects additionalProperties of invalid type", () => {
      const result = validateMCPToolSchema({
        type: "object",
        additionalProperties: "invalid",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("additionalProperties");
    });
  });
});
