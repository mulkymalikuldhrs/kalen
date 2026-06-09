/**
 * @kalen/mcp-gateway — MCPServer Tests
 */
import { MCPServer, type ToolHandler, type ToolCallContext } from "../server/mcp-server";
import type { MCPTool, MCPResource, MCPCallResult } from "@kalen/shared";

describe("MCPServer", () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer();
  });

  describe("built-in tools", () => {
    it("registers 6 built-in tools", () => {
      const tools = server.listTools();
      expect(tools.length).toBe(6);
    });

    it("has send_message tool", () => {
      const tools = server.listTools();
      const sendMsg = tools.find((t) => t.name === "send_message");
      expect(sendMsg).toBeDefined();
      expect(sendMsg!.description).toContain("message");
    });

    it("has create_room tool", () => {
      const tools = server.listTools();
      expect(tools.find((t) => t.name === "create_room")).toBeDefined();
    });

    it("has list_rooms tool", () => {
      const tools = server.listTools();
      expect(tools.find((t) => t.name === "list_rooms")).toBeDefined();
    });

    it("has invite_user tool", () => {
      const tools = server.listTools();
      expect(tools.find((t) => t.name === "invite_user")).toBeDefined();
    });

    it("has search_messages tool", () => {
      const tools = server.listTools();
      expect(tools.find((t) => t.name === "search_messages")).toBeDefined();
    });

    it("has manage_agent tool", () => {
      const tools = server.listTools();
      expect(tools.find((t) => t.name === "manage_agent")).toBeDefined();
    });
  });

  describe("built-in resources", () => {
    it("registers 2 built-in resources", () => {
      const resources = server.listResources();
      expect(resources.length).toBe(2);
    });

    it("has kalen://rooms/recent resource", () => {
      const resources = server.listResources();
      expect(resources.find((r) => r.uri === "kalen://rooms/recent")).toBeDefined();
    });

    it("has kalen://identity/me resource", () => {
      const resources = server.listResources();
      expect(resources.find((r) => r.uri === "kalen://identity/me")).toBeDefined();
    });
  });

  describe("registerTool", () => {
    it("registers a custom tool", () => {
      const tool: MCPTool = {
        name: "custom_tool",
        description: "A custom tool",
        inputSchema: { type: "object", properties: { x: { type: "string" } } },
      };
      const handler: ToolHandler = async () => ({ isError: false, content: [] });

      server.registerTool(tool, handler);
      const tools = server.listTools();
      expect(tools.find((t) => t.name === "custom_tool")).toBeDefined();
    });

    it("throws when registering a duplicate tool name", () => {
      const tool: MCPTool = {
        name: "send_message", // already registered as built-in
        description: "Duplicate",
        inputSchema: { type: "object" },
      };
      expect(() => server.registerTool(tool, async () => ({ isError: false, content: [] }))).toThrow(
        "already registered",
      );
    });
  });

  describe("registerResource", () => {
    it("registers a custom resource", () => {
      const resource: MCPResource = {
        uri: "kalen://custom/resource",
        name: "Custom Resource",
      };
      server.registerResource(resource, async () => null);
      const resources = server.listResources();
      expect(resources.find((r) => r.uri === "kalen://custom/resource")).toBeDefined();
    });

    it("throws when registering a duplicate resource URI", () => {
      const resource: MCPResource = {
        uri: "kalen://rooms/recent", // already registered
        name: "Duplicate",
      };
      expect(() => server.registerResource(resource, async () => null)).toThrow("already registered");
    });
  });

  describe("callTool", () => {
    const context: ToolCallContext = {
      callerId: "user-1",
      callerKind: "human",
      requestId: "req-1",
    };

    it("executes send_message tool", async () => {
      const result = await server.callTool("send_message", {
        roomId: "room-1",
        content: "Hello!",
      }, context);

      expect(result.isError).toBe(false);
      const data = JSON.parse(result.content[0].text!);
      expect(data.action).toBe("message_sent");
      expect(data.roomId).toBe("room-1");
    });

    it("returns error when send_message is missing required args", async () => {
      const result = await server.callTool("send_message", {}, context);
      expect(result.isError).toBe(true);
    });

    it("executes create_room tool", async () => {
      const result = await server.callTool("create_room", {
        type: "group",
        name: "Test Room",
      }, context);

      expect(result.isError).toBe(false);
      const data = JSON.parse(result.content[0].text!);
      expect(data.action).toBe("room_created");
    });

    it("executes list_rooms tool", async () => {
      const result = await server.callTool("list_rooms", {}, context);
      expect(result.isError).toBe(false);
    });

    it("executes invite_user tool with required args", async () => {
      const result = await server.callTool("invite_user", {
        roomId: "room-1",
        userId: "user-2",
        userKind: "human",
      }, context);

      expect(result.isError).toBe(false);
      const data = JSON.parse(result.content[0].text!);
      expect(data.action).toBe("user_invited");
    });

    it("returns error when invite_user is missing required args", async () => {
      const result = await server.callTool("invite_user", { roomId: "room-1" }, context);
      expect(result.isError).toBe(true);
    });

    it("executes search_messages tool", async () => {
      const result = await server.callTool("search_messages", { query: "test" }, context);
      expect(result.isError).toBe(false);
    });

    it("returns error when search_messages is missing query", async () => {
      const result = await server.callTool("search_messages", {}, context);
      expect(result.isError).toBe(true);
    });

    it("executes manage_agent tool", async () => {
      const result = await server.callTool("manage_agent", {
        action: "update_scope",
        agentId: "agent-1",
      }, context);

      expect(result.isError).toBe(false);
    });

    it("returns error for unknown tool", async () => {
      const result = await server.callTool("nonexistent_tool", {}, context);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown tool");
    });

    it("handles tool handler exceptions gracefully", async () => {
      const tool: MCPTool = {
        name: "failing_tool",
        description: "A tool that throws",
        inputSchema: { type: "object" },
      };
      const handler: ToolHandler = async () => {
        throw new Error("Handler exploded");
      };
      server.registerTool(tool, handler);

      const result = await server.callTool("failing_tool", {}, context);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Handler exploded");
    });
  });

  describe("readResource", () => {
    const context = { callerId: "user-1", callerKind: "human" as const };

    it("reads kalen://rooms/recent", async () => {
      const result = await server.readResource("kalen://rooms/recent", context);
      expect(result).toBeDefined();
      expect((result as any).uri).toBe("kalen://rooms/recent");
    });

    it("reads kalen://identity/me", async () => {
      const result = await server.readResource("kalen://identity/me", context);
      expect(result).toBeDefined();
      expect((result as any).id).toBe("user-1");
    });

    it("throws for unknown resource URI", async () => {
      await expect(server.readResource("kalen://unknown", context)).rejects.toThrow("Unknown resource");
    });
  });

  describe("getServerInfo", () => {
    it("returns server name and version", () => {
      const info = server.getServerInfo();
      expect(info.name).toBe("kalen-mcp-server");
      expect(info.version).toBe("0.1.0");
    });
  });
});
