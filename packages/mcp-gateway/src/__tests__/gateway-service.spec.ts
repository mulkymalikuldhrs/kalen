/**
 * @kalen/mcp-gateway — GatewayService Tests
 * Tests gateway orchestration: RBAC enforcement, audit logging, and routing.
 */
import { GatewayService, type GatewayConfig } from "../gateway/gateway-service";
import { Role, Permission } from "@kalen/identity";
import { AllowList } from "../governance/allowlist";

describe("GatewayService", () => {
  let gateway: GatewayService;

  beforeEach(() => {
    gateway = new GatewayService();
  });

  afterEach(async () => {
    await gateway.shutdown();
  });

  describe("constructor", () => {
    it("creates gateway with default config", () => {
      const localServer = gateway.getLocalServer();
      expect(localServer).toBeDefined();
      expect(localServer.listTools().length).toBeGreaterThan(0);
    });

    it("accepts partial config overrides", () => {
      const customGateway = new GatewayService({
        maxConcurrentCalls: 5,
        rbacEnabled: false,
      });
      // Should not throw — config is applied internally
      expect(customGateway.getLocalServer()).toBeDefined();
    });
  });

  describe("getAllowList", () => {
    it("returns the allow list instance", () => {
      const allowList = gateway.getAllowList();
      expect(allowList).toBeInstanceOf(AllowList);
    });
  });

  describe("routeToolCall — RBAC enforcement", () => {
    it("denies call when role lacks permission", async () => {
      const result = await gateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "user-1",
        "human",
        Role.AGENT_BASIC, // AGENT_BASIC doesn't have ROOM_CREATE
        Permission.ROOM_CREATE,
      );

      expect(result.accessDecision).toBe("denied");
      expect(result.denialReason).toContain("permission");
    });

    it("allows call when role has permission", async () => {
      const result = await gateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "user-1",
        "human",
        Role.HUMAN_USER, // HUMAN_USER has MESSAGE_SEND
        Permission.MESSAGE_SEND,
      );

      expect(result.accessDecision).toBe("allowed");
      expect(result.result).toBeDefined();
      expect(result.result!.isError).toBe(false);
    });

    it("skips RBAC when rbacEnabled is false", async () => {
      const noRbacGateway = new GatewayService({ rbacEnabled: false });
      const result = await noRbacGateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "user-1",
        "human",
        Role.AGENT_BASIC, // wouldn't normally have this permission
        Permission.ROOM_CREATE,
      );

      expect(result.accessDecision).toBe("allowed");
      await noRbacGateway.shutdown();
    });
  });

  describe("routeToolCall — AllowList enforcement", () => {
    it("denies call when tool is not in allowlist (restrictive mode)", async () => {
      const allowList = gateway.getAllowList();
      allowList.setRestrictive("agent-1", true);
      // agent-1 in restrictive mode with no allowed tools

      const result = await gateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "agent-1",
        "agent",
        Role.HUMAN_USER,
        Permission.MESSAGE_SEND,
      );

      expect(result.accessDecision).toBe("denied");
      expect(result.denialReason).toContain("allowlist");
    });

    it("allows call when tool is in allowlist", async () => {
      const allowList = gateway.getAllowList();
      allowList.setRestrictive("agent-2", true);
      allowList.allowTool("agent-2", "send_message");

      const result = await gateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "agent-2",
        "agent",
        Role.HUMAN_USER,
        Permission.MESSAGE_SEND,
      );

      expect(result.accessDecision).toBe("allowed");
    });
  });

  describe("routeToolCall — concurrent limit", () => {
    it("denies call when concurrent limit is exceeded", async () => {
      const limitedGateway = new GatewayService({ maxConcurrentCalls: 0 });

      const result = await limitedGateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "user-1",
        "human",
        Role.HUMAN_USER,
        Permission.MESSAGE_SEND,
      );

      expect(result.accessDecision).toBe("denied");
      expect(result.denialReason).toContain("Concurrent call limit");
      await limitedGateway.shutdown();
    });
  });

  describe("routeToolCall — unknown tool", () => {
    it("denies call for non-existent tool", async () => {
      const result = await gateway.routeToolCall(
        "nonexistent_tool",
        {},
        "user-1",
        "human",
        Role.SUPER_ADMIN,
        Permission.MCP_TOOL_CALL,
      );

      expect(result.accessDecision).toBe("denied");
      expect(result.denialReason).toContain("No server found");
    });
  });

  describe("routeToolCall — invocation metadata", () => {
    it("populates invocation fields correctly", async () => {
      const result = await gateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "user-1",
        "human",
        Role.HUMAN_USER,
        Permission.MESSAGE_SEND,
      );

      expect(result.invocationId).toBeTruthy();
      expect(result.toolName).toBe("send_message");
      expect(result.callerId).toBe("user-1");
      expect(result.callerKind).toBe("human");
      expect(result.serverId).toBe("local");
      expect(result.startedAt).toBeTruthy();
      expect(result.result).toBeDefined();
    });
  });

  describe("audit logging", () => {
    it("records allowed calls in audit log", async () => {
      await gateway.routeToolCall(
        "send_message",
        { roomId: "room-1", content: "hello" },
        "user-1",
        "human",
        Role.HUMAN_USER,
        Permission.MESSAGE_SEND,
      );

      const auditLog = gateway.getAuditLog();
      expect(auditLog.length).toBe(1);
      expect(auditLog[0].accessDecision).toBe("allowed");
      expect(auditLog[0].callerId).toBe("user-1");
      expect(auditLog[0].toolName).toBe("send_message");
    });

    it("records denied calls in audit log", async () => {
      await gateway.routeToolCall(
        "send_message",
        {},
        "user-1",
        "human",
        Role.AGENT_BASIC,
        Permission.ROOM_CREATE,
      );

      const auditLog = gateway.getAuditLog();
      expect(auditLog.length).toBe(1);
      expect(auditLog[0].accessDecision).toBe("denied");
    });

    it("supports pagination in audit log", async () => {
      for (let i = 0; i < 5; i++) {
        await gateway.routeToolCall(
          "send_message",
          { roomId: "room-1", content: `msg-${i}` },
          "user-1",
          "human",
          Role.HUMAN_USER,
          Permission.MESSAGE_SEND,
        );
      }

      const page1 = gateway.getAuditLog(2, 0);
      expect(page1.length).toBe(2);
      const page2 = gateway.getAuditLog(2, 2);
      expect(page2.length).toBe(2);
      const page3 = gateway.getAuditLog(2, 4);
      expect(page3.length).toBe(1);
    });

    it("filters audit log by caller", async () => {
      await gateway.routeToolCall("send_message", { roomId: "r1", content: "hi" }, "alice", "human", Role.HUMAN_USER, Permission.MESSAGE_SEND);
      await gateway.routeToolCall("send_message", { roomId: "r2", content: "hi" }, "bob", "human", Role.HUMAN_USER, Permission.MESSAGE_SEND);

      const aliceLogs = gateway.getAuditLogForCaller("alice");
      expect(aliceLogs.length).toBe(1);
      expect(aliceLogs[0].callerId).toBe("alice");
    });
  });

  describe("listAllTools", () => {
    it("includes local server tools", () => {
      const tools = gateway.listAllTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t) => t.name === "send_message")).toBe(true);
    });
  });

  describe("listServers", () => {
    it("includes local server", () => {
      const servers = gateway.listServers();
      expect(servers.some((s) => s.serverId === "local")).toBe(true);
    });
  });

  describe("healthCheck", () => {
    it("reports local server as healthy", async () => {
      const health = await gateway.healthCheck();
      expect(health.some((h) => h.serverId === "local" && h.healthy)).toBe(true);
    });
  });

  describe("shutdown", () => {
    it("clears remote server state", async () => {
      await gateway.routeToolCall("send_message", { roomId: "r1", content: "hi" }, "user-1", "human", Role.HUMAN_USER, Permission.MESSAGE_SEND);
      await gateway.shutdown();

      // After shutdown, only the local server remains (local server always exists)
      const servers = gateway.listServers();
      expect(servers.length).toBe(1);
      expect(servers[0].serverId).toBe("local");
    });
  });
});
