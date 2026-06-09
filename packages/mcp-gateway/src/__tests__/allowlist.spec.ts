/**
 * @kalen/mcp-gateway — AllowList Governance Tests
 */
import { AllowList } from "../governance/allowlist";

describe("AllowList", () => {
  let allowList: AllowList;

  beforeEach(() => {
    allowList = new AllowList();
  });

  describe("permissive mode (default)", () => {
    it("allows all tools by default for unknown entity", () => {
      expect(allowList.isAllowed("unknown-entity", "any_tool")).toBe(true);
    });

    it("allows a tool when not explicitly denied", () => {
      expect(allowList.isAllowed("agent-1", "send_message")).toBe(true);
    });

    it("denies a tool when explicitly denied", () => {
      allowList.denyTool("agent-1", "manage_agent");
      expect(allowList.isAllowed("agent-1", "manage_agent")).toBe(false);
    });

    it("allows other tools after one is denied", () => {
      allowList.denyTool("agent-1", "manage_agent");
      expect(allowList.isAllowed("agent-1", "send_message")).toBe(true);
    });

    it("allowing a tool removes it from deny list", () => {
      allowList.denyTool("agent-1", "manage_agent");
      expect(allowList.isAllowed("agent-1", "manage_agent")).toBe(false);

      allowList.allowTool("agent-1", "manage_agent");
      expect(allowList.isAllowed("agent-1", "manage_agent")).toBe(true);
    });

    it("denying a tool removes it from allow list", () => {
      allowList.allowTool("agent-1", "send_message");
      allowList.denyTool("agent-1", "send_message");
      expect(allowList.isAllowed("agent-1", "send_message")).toBe(false);
    });
  });

  describe("restrictive mode", () => {
    it("denies all tools when restrictive with no allowed tools", () => {
      allowList.setRestrictive("agent-1", true);
      expect(allowList.isAllowed("agent-1", "send_message")).toBe(false);
      expect(allowList.isAllowed("agent-1", "any_tool")).toBe(false);
    });

    it("allows only explicitly allowed tools in restrictive mode", () => {
      allowList.setRestrictive("agent-1", true);
      allowList.allowTool("agent-1", "send_message");
      allowList.allowTool("agent-1", "list_rooms");

      expect(allowList.isAllowed("agent-1", "send_message")).toBe(true);
      expect(allowList.isAllowed("agent-1", "list_rooms")).toBe(true);
      expect(allowList.isAllowed("agent-1", "manage_agent")).toBe(false);
    });

    it("can switch from permissive to restrictive", () => {
      allowList.allowTool("agent-1", "send_message");
      // In permissive mode, all tools are allowed
      expect(allowList.isAllowed("agent-1", "other_tool")).toBe(true);

      allowList.setRestrictive("agent-1", true);
      // Now only explicitly allowed tools are permitted
      expect(allowList.isAllowed("agent-1", "send_message")).toBe(true);
      expect(allowList.isAllowed("agent-1", "other_tool")).toBe(false);
    });

    it("can switch back to permissive mode", () => {
      allowList.setRestrictive("agent-1", true);
      allowList.allowTool("agent-1", "send_message");
      expect(allowList.isAllowed("agent-1", "other_tool")).toBe(false);

      allowList.setRestrictive("agent-1", false);
      expect(allowList.isAllowed("agent-1", "other_tool")).toBe(true);
    });
  });

  describe("global deny list", () => {
    it("globally denied tools are denied for all entities", () => {
      allowList.denyGlobal("dangerous_tool");
      expect(allowList.isAllowed("agent-1", "dangerous_tool")).toBe(false);
      expect(allowList.isAllowed("agent-2", "dangerous_tool")).toBe(false);
      expect(allowList.isAllowed("unknown", "dangerous_tool")).toBe(false);
    });

    it("global deny overrides entity-specific allow", () => {
      allowList.denyGlobal("dangerous_tool");
      allowList.allowTool("agent-1", "dangerous_tool");
      // Global deny takes precedence
      expect(allowList.isAllowed("agent-1", "dangerous_tool")).toBe(false);
    });

    it("removing global deny restores access", () => {
      allowList.denyGlobal("dangerous_tool");
      expect(allowList.isAllowed("agent-1", "dangerous_tool")).toBe(false);

      allowList.removeGlobalDeny("dangerous_tool");
      expect(allowList.isAllowed("agent-1", "dangerous_tool")).toBe(true);
    });
  });

  describe("getAllowedTools", () => {
    it("returns all non-denied tools in permissive mode", () => {
      allowList.denyTool("agent-1", "bad_tool");
      const allowed = allowList.getAllowedTools("agent-1", ["tool_a", "bad_tool", "tool_c"]);
      expect(allowed.has("tool_a")).toBe(true);
      expect(allowed.has("bad_tool")).toBe(false);
      expect(allowed.has("tool_c")).toBe(true);
    });

    it("returns only allowed tools in restrictive mode", () => {
      allowList.setRestrictive("agent-1", true);
      allowList.allowTool("agent-1", "tool_a");
      const allowed = allowList.getAllowedTools("agent-1", ["tool_a", "tool_b"]);
      expect(allowed.has("tool_a")).toBe(true);
      expect(allowed.has("tool_b")).toBe(false);
    });

    it("excludes globally denied tools", () => {
      allowList.denyGlobal("banned");
      const allowed = allowList.getAllowedTools("agent-1", ["tool_a", "banned"]);
      expect(allowed.has("tool_a")).toBe(true);
      expect(allowed.has("banned")).toBe(false);
    });

    it("returns empty set for unknown entity without allTools", () => {
      const allowed = allowList.getAllowedTools("unknown");
      expect(allowed.size).toBe(0);
    });

    it("returns all tools minus globally denied for unknown entity with allTools", () => {
      allowList.denyGlobal("banned");
      const allowed = allowList.getAllowedTools("unknown", ["tool_a", "banned", "tool_c"]);
      expect(allowed.has("tool_a")).toBe(true);
      expect(allowed.has("banned")).toBe(false);
      expect(allowed.has("tool_c")).toBe(true);
    });
  });

  describe("removeEntity", () => {
    it("removes an entity's entry", () => {
      allowList.denyTool("agent-1", "bad_tool");
      expect(allowList.hasEntry("agent-1")).toBe(true);

      allowList.removeEntity("agent-1");
      expect(allowList.hasEntry("agent-1")).toBe(false);
    });

    it("entity becomes permissive again after removal", () => {
      allowList.setRestrictive("agent-1", true);
      allowList.removeEntity("agent-1");
      // Without entry, default is permissive
      expect(allowList.isAllowed("agent-1", "any_tool")).toBe(true);
    });
  });

  describe("hasEntry", () => {
    it("returns false for unknown entity", () => {
      expect(allowList.hasEntry("unknown")).toBe(false);
    });

    it("returns true after entity has an entry", () => {
      allowList.allowTool("agent-1", "tool_a");
      expect(allowList.hasEntry("agent-1")).toBe(true);
    });
  });

  describe("evaluation order", () => {
    it("global deny is checked first, then entity deny, then restrictive", () => {
      // Setup: global deny, entity deny, and restrictive mode
      allowList.denyGlobal("global_banned");
      allowList.denyTool("agent-1", "entity_banned");
      allowList.setRestrictive("agent-1", true);
      allowList.allowTool("agent-1", "allowed_in_restrictive");

      expect(allowList.isAllowed("agent-1", "global_banned")).toBe(false);
      expect(allowList.isAllowed("agent-1", "entity_banned")).toBe(false);
      expect(allowList.isAllowed("agent-1", "allowed_in_restrictive")).toBe(true);
      expect(allowList.isAllowed("agent-1", "not_allowed")).toBe(false);
    });
  });
});
