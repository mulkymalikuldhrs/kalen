/**
 * @kalen/identity — RBAC Role and Permission Tests
 */
import { Role, Permission, rolePermissions } from "../rbac/roles";
import {
  checkPermission,
  checkPermissions,
  hasAnyPermission,
  getRolePermissions,
  checkScope,
  evaluateAccess,
  type AgentScope,
  type ScopeResource,
} from "../rbac/permission-check";

// ─── Role Definitions ─────────────────────────────────────────────

describe("Role enum", () => {
  it("has all expected roles", () => {
    expect(Role.HUMAN_USER).toBe("human_user");
    expect(Role.AGENT_BASIC).toBe("agent_basic");
    expect(Role.AGENT_PRIVILEGED).toBe("agent_privileged");
    expect(Role.ADMIN).toBe("admin");
    expect(Role.SUPER_ADMIN).toBe("super_admin");
  });
});

describe("Permission enum", () => {
  it("has messaging permissions", () => {
    expect(Permission.MESSAGE_SEND).toBe("message:send");
    expect(Permission.MESSAGE_READ).toBe("message:read");
  });

  it("has agent permissions", () => {
    expect(Permission.AGENT_CREATE).toBe("agent:create");
    expect(Permission.AGENT_DEACTIVATE_ANY).toBe("agent:deactivate_any");
  });

  it("has MCP permissions", () => {
    expect(Permission.MCP_TOOL_CALL).toBe("mcp:tool_call");
    expect(Permission.MCP_SERVER_MANAGE).toBe("mcp:server_manage");
  });

  it("has admin permissions", () => {
    expect(Permission.ADMIN_DASHBOARD).toBe("admin:dashboard");
    expect(Permission.ADMIN_SYSTEM_CONFIG).toBe("admin:system_config");
  });
});

describe("rolePermissions", () => {
  it("has permissions for every role", () => {
    for (const role of Object.values(Role)) {
      expect(rolePermissions.has(role as Role)).toBe(true);
    }
  });

  it("SUPER_ADMIN has all permissions", () => {
    const superAdminPerms = rolePermissions.get(Role.SUPER_ADMIN)!;
    expect(superAdminPerms.size).toBe(Object.values(Permission).length);
  });

  it("HUMAN_USER does not have MCP_TOOL_CALL", () => {
    const humanPerms = rolePermissions.get(Role.HUMAN_USER)!;
    expect(humanPerms.has(Permission.MCP_TOOL_CALL)).toBe(false);
  });

  it("AGENT_BASIC has MCP_TOOL_CALL", () => {
    const agentPerms = rolePermissions.get(Role.AGENT_BASIC)!;
    expect(agentPerms.has(Permission.MCP_TOOL_CALL)).toBe(true);
  });

  it("ADMIN has MESSAGE_DELETE_ANY", () => {
    const adminPerms = rolePermissions.get(Role.ADMIN)!;
    expect(adminPerms.has(Permission.MESSAGE_DELETE_ANY)).toBe(true);
  });

  it("HUMAN_USER does not have MESSAGE_DELETE_ANY", () => {
    const humanPerms = rolePermissions.get(Role.HUMAN_USER)!;
    expect(humanPerms.has(Permission.MESSAGE_DELETE_ANY)).toBe(false);
  });
});

// ─── checkPermission ──────────────────────────────────────────────

describe("checkPermission", () => {
  it("returns true when role has the permission", () => {
    expect(checkPermission(Role.HUMAN_USER, Permission.MESSAGE_SEND)).toBe(true);
  });

  it("returns false when role lacks the permission", () => {
    expect(checkPermission(Role.HUMAN_USER, Permission.ADMIN_DASHBOARD)).toBe(false);
  });

  it("returns false for unknown role (Map miss)", () => {
    // The function handles missing role gracefully
    expect(checkPermission("unknown_role" as Role, Permission.MESSAGE_SEND)).toBe(false);
  });
});

// ─── checkPermissions ─────────────────────────────────────────────

describe("checkPermissions", () => {
  it("returns true when role has all permissions", () => {
    expect(
      checkPermissions(Role.HUMAN_USER, [
        Permission.MESSAGE_SEND,
        Permission.MESSAGE_READ,
        Permission.ROOM_CREATE,
      ]),
    ).toBe(true);
  });

  it("returns false when role is missing any permission", () => {
    expect(
      checkPermissions(Role.HUMAN_USER, [
        Permission.MESSAGE_SEND,
        Permission.ADMIN_DASHBOARD,
      ]),
    ).toBe(false);
  });

  it("returns true for empty array", () => {
    expect(checkPermissions(Role.HUMAN_USER, [])).toBe(true);
  });
});

// ─── hasAnyPermission ─────────────────────────────────────────────

describe("hasAnyPermission", () => {
  it("returns true when role has at least one permission", () => {
    expect(
      hasAnyPermission(Role.HUMAN_USER, [
        Permission.ADMIN_DASHBOARD,
        Permission.MESSAGE_SEND,
      ]),
    ).toBe(true);
  });

  it("returns false when role has none of the permissions", () => {
    expect(
      hasAnyPermission(Role.AGENT_BASIC, [
        Permission.ADMIN_DASHBOARD,
        Permission.ROOM_CREATE,
      ]),
    ).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasAnyPermission(Role.HUMAN_USER, [])).toBe(false);
  });
});

// ─── getRolePermissions ───────────────────────────────────────────

describe("getRolePermissions", () => {
  it("returns permissions for a valid role", () => {
    const perms = getRolePermissions(Role.HUMAN_USER);
    expect(perms).toBeInstanceOf(Set);
    expect(perms.size).toBeGreaterThan(0);
  });

  it("returns empty set for unknown role", () => {
    const perms = getRolePermissions("unknown" as Role);
    expect(perms).toBeInstanceOf(Set);
    expect(perms.size).toBe(0);
  });
});

// ─── checkScope ───────────────────────────────────────────────────

describe("checkScope", () => {
  const permissiveScope: AgentScope = {
    agentId: "agent-1",
    rooms: [],
    tools: [],
    humans: [],
    restricted: false,
  };

  const restrictiveScope: AgentScope = {
    agentId: "agent-1",
    rooms: ["room-1", "room-2"],
    tools: ["send_message"],
    humans: ["user-1"],
    restricted: true,
  };

  describe("permissive mode", () => {
    it("allows access to any resource", () => {
      const resource: ScopeResource = { type: "room", id: "room-999" };
      expect(checkScope(permissiveScope, resource)).toBe(true);
    });
  });

  describe("restrictive mode", () => {
    it("allows access to explicitly listed room", () => {
      const resource: ScopeResource = { type: "room", id: "room-1" };
      expect(checkScope(restrictiveScope, resource)).toBe(true);
    });

    it("denies access to unlisted room", () => {
      const resource: ScopeResource = { type: "room", id: "room-999" };
      expect(checkScope(restrictiveScope, resource)).toBe(false);
    });

    it("allows access to explicitly listed tool", () => {
      const resource: ScopeResource = { type: "tool", id: "send_message" };
      expect(checkScope(restrictiveScope, resource)).toBe(true);
    });

    it("denies access to unlisted tool", () => {
      const resource: ScopeResource = { type: "tool", id: "manage_agent" };
      expect(checkScope(restrictiveScope, resource)).toBe(false);
    });

    it("allows access to explicitly listed human", () => {
      const resource: ScopeResource = { type: "human", id: "user-1" };
      expect(checkScope(restrictiveScope, resource)).toBe(true);
    });

    it("denies access to unlisted human", () => {
      const resource: ScopeResource = { type: "human", id: "user-999" };
      expect(checkScope(restrictiveScope, resource)).toBe(false);
    });
  });

  describe("restrictive with empty lists", () => {
    const emptyRestrictive: AgentScope = {
      agentId: "agent-1",
      rooms: [],
      tools: [],
      humans: [],
      restricted: true,
    };

    it("allows all access when lists are empty in restrictive mode (empty = no restriction)", () => {
      // When the allowlist is empty, it means "no explicit restrictions"
      // This is by design: empty list = allow all for that resource type
      expect(checkScope(emptyRestrictive, { type: "room", id: "any" })).toBe(true);
      expect(checkScope(emptyRestrictive, { type: "tool", id: "any" })).toBe(true);
      expect(checkScope(emptyRestrictive, { type: "human", id: "any" })).toBe(true);
    });
  });
});

// ─── evaluateAccess ───────────────────────────────────────────────

describe("evaluateAccess", () => {
  const scope: AgentScope = {
    agentId: "agent-1",
    rooms: ["room-1"],
    tools: ["send_message"],
    humans: [],
    restricted: true,
  };

  it("allows when both RBAC and scope pass", () => {
    const result = evaluateAccess(
      Role.AGENT_BASIC,
      Permission.MESSAGE_SEND,
      scope,
      { type: "room", id: "room-1" },
    );
    expect(result.allowed).toBe(true);
  });

  it("denies when RBAC fails", () => {
    const result = evaluateAccess(
      Role.AGENT_BASIC,
      Permission.ADMIN_DASHBOARD,
      scope,
      { type: "room", id: "room-1" },
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("permission");
  });

  it("denies when scope fails", () => {
    const result = evaluateAccess(
      Role.AGENT_BASIC,
      Permission.MESSAGE_SEND,
      scope,
      { type: "room", id: "room-999" },
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("scope");
  });

  it("denies when both RBAC and scope fail", () => {
    const result = evaluateAccess(
      Role.AGENT_BASIC,
      Permission.ADMIN_DASHBOARD,
      scope,
      { type: "room", id: "room-999" },
    );
    expect(result.allowed).toBe(false);
    // RBAC check happens first
    expect(result.reason).toContain("permission");
  });

  it("allows permissive scope with valid RBAC", () => {
    const permissiveScope: AgentScope = {
      agentId: "agent-1",
      rooms: [],
      tools: [],
      humans: [],
      restricted: false,
    };
    const result = evaluateAccess(
      Role.AGENT_BASIC,
      Permission.MESSAGE_SEND,
      permissiveScope,
      { type: "room", id: "any-room" },
    );
    expect(result.allowed).toBe(true);
  });
});
