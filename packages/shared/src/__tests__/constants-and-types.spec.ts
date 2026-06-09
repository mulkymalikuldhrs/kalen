/**
 * @kalen/shared — Constants and Type Guards Tests
 */
import {
  AGENT_SUFFIX,
  AGENT_DISPLAY_SUFFIX,
  MCP_PROTOCOL_VERSION,
  A2A_PROTOCOL_VERSION,
  KALEN_EVENT_SCHEMA_VERSION,
  ED25519_PUBLIC_KEY_LENGTH,
  ED25519_PRIVATE_KEY_LENGTH,
  ED25519_SIGNATURE_LENGTH,
  MIN_AGENT_NAME_LENGTH,
  MAX_AGENT_NAME_LENGTH,
  JWT_ISSUER,
  JWT_AUDIENCE,
  A2A_WELL_KNOWN_PATH,
} from "../utils/constants";
import { TaskStatus, VALID_TRANSITIONS } from "../types/a2a";
import { isHumanIdentity, isAgentIdentity } from "../types/identity";
import type { DualIdentity, HumanIdentity, AgentIdentity } from "../types/identity";

// ─── Constants ────────────────────────────────────────────────────

describe("Constants", () => {
  it("AGENT_SUFFIX is '(ai)'", () => {
    expect(AGENT_SUFFIX).toBe("(ai)");
  });

  it("AGENT_DISPLAY_SUFFIX is ' (ai)' with leading space", () => {
    expect(AGENT_DISPLAY_SUFFIX).toBe(" (ai)");
  });

  it("MCP_PROTOCOL_VERSION is a non-empty string", () => {
    expect(typeof MCP_PROTOCOL_VERSION).toBe("string");
    expect(MCP_PROTOCOL_VERSION.length).toBeGreaterThan(0);
  });

  it("A2A_PROTOCOL_VERSION is a non-empty string", () => {
    expect(typeof A2A_PROTOCOL_VERSION).toBe("string");
    expect(A2A_PROTOCOL_VERSION.length).toBeGreaterThan(0);
  });

  it("KALEN_EVENT_SCHEMA_VERSION is a positive integer", () => {
    expect(KALEN_EVENT_SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(KALEN_EVENT_SCHEMA_VERSION)).toBe(true);
  });

  it("Ed25519 key lengths are correct", () => {
    expect(ED25519_PUBLIC_KEY_LENGTH).toBe(32);
    expect(ED25519_PRIVATE_KEY_LENGTH).toBe(64);
    expect(ED25519_SIGNATURE_LENGTH).toBe(64);
  });

  it("Agent name length limits are consistent", () => {
    expect(MIN_AGENT_NAME_LENGTH).toBeLessThanOrEqual(MAX_AGENT_NAME_LENGTH);
    // Minimum length should accommodate at least "X (ai)" = 6 chars
    expect(MIN_AGENT_NAME_LENGTH).toBe(6);
    expect(MAX_AGENT_NAME_LENGTH).toBe(64);
  });

  it("JWT constants are set", () => {
    expect(JWT_ISSUER).toBe("kalen");
    expect(JWT_AUDIENCE).toBe("kalen-api");
  });

  it("A2A_WELL_KNOWN_PATH is set", () => {
    expect(A2A_WELL_KNOWN_PATH).toBe("/.well-known/agent.json");
  });
});

// ─── TaskStatus Enum ──────────────────────────────────────────────

describe("TaskStatus", () => {
  it("has all required states", () => {
    expect(TaskStatus.SUBMITTED).toBe("submitted");
    expect(TaskStatus.WORKING).toBe("working");
    expect(TaskStatus.COMPLETED).toBe("completed");
    expect(TaskStatus.FAILED).toBe("failed");
    expect(TaskStatus.CANCELED).toBe("canceled");
    expect(TaskStatus.INPUT_REQUIRED).toBe("input_required");
  });

  it("has exactly 6 states", () => {
    expect(Object.keys(TaskStatus).length).toBe(6);
  });
});

// ─── VALID_TRANSITIONS ────────────────────────────────────────────

describe("VALID_TRANSITIONS", () => {
  it("SUBMITTED can transition to WORKING, CANCELED, or FAILED", () => {
    expect(VALID_TRANSITIONS[TaskStatus.SUBMITTED]).toEqual(
      expect.arrayContaining([TaskStatus.WORKING, TaskStatus.CANCELED, TaskStatus.FAILED]),
    );
  });

  it("WORKING can transition to COMPLETED, FAILED, CANCELED, or INPUT_REQUIRED", () => {
    expect(VALID_TRANSITIONS[TaskStatus.WORKING]).toEqual(
      expect.arrayContaining([
        TaskStatus.COMPLETED,
        TaskStatus.FAILED,
        TaskStatus.CANCELED,
        TaskStatus.INPUT_REQUIRED,
      ]),
    );
  });

  it("INPUT_REQUIRED can transition to WORKING or CANCELED", () => {
    expect(VALID_TRANSITIONS[TaskStatus.INPUT_REQUIRED]).toEqual(
      expect.arrayContaining([TaskStatus.WORKING, TaskStatus.CANCELED]),
    );
  });

  it("COMPLETED is a terminal state with no transitions", () => {
    expect(VALID_TRANSITIONS[TaskStatus.COMPLETED]).toEqual([]);
  });

  it("FAILED is a terminal state with no transitions", () => {
    expect(VALID_TRANSITIONS[TaskStatus.FAILED]).toEqual([]);
  });

  it("CANCELED is a terminal state with no transitions", () => {
    expect(VALID_TRANSITIONS[TaskStatus.CANCELED]).toEqual([]);
  });

  it("does not allow transition from SUBMITTED to COMPLETED directly", () => {
    expect(VALID_TRANSITIONS[TaskStatus.SUBMITTED]).not.toContain(TaskStatus.COMPLETED);
  });

  it("does not allow transition from COMPLETED to any state", () => {
    const transitions = VALID_TRANSITIONS[TaskStatus.COMPLETED];
    expect(transitions).toHaveLength(0);
  });
});

// ─── Type Guards ──────────────────────────────────────────────────

describe("Type Guards", () => {
  const humanIdentity: HumanIdentity = {
    userId: "user-123",
    email: "user@example.com",
    displayName: "Test User",
    passkeyCredentialId: "cred-123",
    publicKey: "pubkey-123",
    createdAt: new Date().toISOString(),
  };

  const agentIdentity: AgentIdentity = {
    agentId: "agent-456",
    name: "TestBot (ai)",
    suffix: "(ai)",
    keypairPublicKey: "key-456",
    manifest: {
      name: "TestBot (ai)",
      description: "A test agent",
      tools: [],
      capabilities: [],
      rateLimit: 60,
      version: 1,
      issuedAt: new Date().toISOString(),
      signature: "sig-123",
    },
    owner: "user-123",
    scopes: ["mcp:tool_call"],
    createdAt: new Date().toISOString(),
  };

  describe("isHumanIdentity", () => {
    it("returns true for human identity", () => {
      const dual: DualIdentity = { kind: "human", identity: humanIdentity };
      expect(isHumanIdentity(dual)).toBe(true);
    });

    it("returns false for agent identity", () => {
      const dual: DualIdentity = { kind: "agent", identity: agentIdentity };
      expect(isHumanIdentity(dual)).toBe(false);
    });

    it("narrows the type correctly", () => {
      const dual: DualIdentity = { kind: "human", identity: humanIdentity };
      if (isHumanIdentity(dual)) {
        // TypeScript should know dual.identity is HumanIdentity
        expect(dual.identity.userId).toBe("user-123");
      }
    });
  });

  describe("isAgentIdentity", () => {
    it("returns true for agent identity", () => {
      const dual: DualIdentity = { kind: "agent", identity: agentIdentity };
      expect(isAgentIdentity(dual)).toBe(true);
    });

    it("returns false for human identity", () => {
      const dual: DualIdentity = { kind: "human", identity: humanIdentity };
      expect(isAgentIdentity(dual)).toBe(false);
    });

    it("narrows the type correctly", () => {
      const dual: DualIdentity = { kind: "agent", identity: agentIdentity };
      if (isAgentIdentity(dual)) {
        expect(dual.identity.agentId).toBe("agent-456");
      }
    });
  });
});
