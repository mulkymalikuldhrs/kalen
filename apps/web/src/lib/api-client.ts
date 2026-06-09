/**
 * KALEN API Client
 * Handles all HTTP communication with the KALEN API server.
 * TODO: Replace with actual API endpoints once the server is implemented.
 */

import type {
  ApiResponse,
  LoginResponse,
  RegistrationResponse,
  Room,
  Message,
  AgentProfile,
  PaginatedResponse,
  MCPToolInvocation,
  MCPServerInfo,
  A2ATask,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // ─── Identity / Auth ─────────────────────────────────────────

  async beginRegistration(email: string, displayName: string): Promise<ApiResponse<any>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/identity/register-begin", {
      method: "POST",
      body: JSON.stringify({ email, displayName }),
    });
  }

  async finishRegistration(attestation: any): Promise<ApiResponse<RegistrationResponse>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/identity/register-finish", {
      method: "POST",
      body: JSON.stringify(attestation),
    });
  }

  async beginAuthentication(email: string): Promise<ApiResponse<any>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/identity/auth-begin", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async finishAuthentication(assertion: any): Promise<ApiResponse<LoginResponse>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/identity/auth-finish", {
      method: "POST",
      body: JSON.stringify(assertion),
    });
  }

  // ─── Rooms ──────────────────────────────────────────────────

  async getRooms(): Promise<ApiResponse<Room[]>> {
    // TODO: Replace with real API call
    // Simulated data for now
    return {
      success: true,
      data: [
        {
          roomId: "room-1",
          type: "direct",
          name: "Alice",
          members: ["user-1", "user-2"],
          memberKinds: ["human", "human"],
          createdBy: "user-1",
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        },
        {
          roomId: "room-2",
          type: "group",
          name: "Project Alpha",
          members: ["user-1", "agent-1", "agent-2"],
          memberKinds: ["human", "agent", "agent"],
          createdBy: "user-1",
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        },
        {
          roomId: "room-3",
          type: "agent-workspace",
          name: "Agent War Room",
          members: ["user-1", "agent-1", "agent-2", "agent-3"],
          memberKinds: ["human", "agent", "agent", "agent"],
          createdBy: "user-1",
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        },
      ],
    };
  }

  async createRoom(name: string, type: string, memberIds: string[]): Promise<ApiResponse<Room>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/msg/rooms", {
      method: "POST",
      body: JSON.stringify({ name, type, memberIds }),
    });
  }

  // ─── Messages ───────────────────────────────────────────────

  async getMessages(
    roomId: string,
    page = 1,
    pageSize = 50
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    // TODO: Replace with real API call
    // Simulated data for now
    const messages: Message[] = [
      {
        messageId: "msg-1",
        roomId,
        senderId: "user-1",
        senderKind: "human",
        content: "Hey team! Let's discuss the new feature implementation.",
        contentType: "markdown",
        reactions: {},
        readBy: [],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        deleted: false,
      },
      {
        messageId: "msg-2",
        roomId,
        senderId: "agent-1",
        senderKind: "agent",
        content: "I've analyzed the requirements. Here's my proposed approach:\n\n1. **Authentication Layer** — WebAuthn with challenge-response\n2. **Real-time Layer** — Socket.IO for message delivery\n3. **Agent Identity** — Ed25519 keypairs with `(ai)` suffix\n\nShall I proceed with the implementation?",
        contentType: "markdown",
        reactions: { "👍": ["user-1"] },
        readBy: [],
        createdAt: new Date(Date.now() - 3500000).toISOString(),
        deleted: false,
      },
      {
        messageId: "msg-3",
        roomId,
        senderId: "user-1",
        senderKind: "human",
        content: "Looks great! Go ahead with the implementation. 🚀",
        contentType: "markdown",
        reactions: {},
        readBy: [],
        createdAt: new Date(Date.now() - 3400000).toISOString(),
        deleted: false,
      },
      {
        messageId: "msg-4",
        roomId,
        senderId: "agent-2",
        senderKind: "agent",
        content: "I can assist with the `Authentication Layer` implementation. I'll start with the WebAuthn registration flow.\n\n```typescript\nconst challenge = await generateChallenge();\nconst credential = await navigator.credentials.create({\n  publicKey: {\n    challenge,\n    rp: { name: 'KALEN', id: window.location.hostname },\n    user: { id, name, displayName },\n  },\n});\n```",
        contentType: "markdown",
        reactions: { "👀": ["user-1", "agent-1"] },
        readBy: [],
        createdAt: new Date(Date.now() - 3300000).toISOString(),
        deleted: false,
      },
    ];

    return {
      success: true,
      data: {
        items: messages,
        total: messages.length,
        page,
        pageSize,
        hasMore: false,
      },
    };
  }

  async sendMessage(roomId: string, content: string, contentType = "markdown"): Promise<ApiResponse<Message>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/msg/messages", {
      method: "POST",
      body: JSON.stringify({ roomId, content, contentType }),
    });
  }

  // ─── Agents ─────────────────────────────────────────────────

  async getAgents(): Promise<ApiResponse<AgentProfile[]>> {
    // TODO: Replace with real API call
    return {
      success: true,
      data: [
        {
          agentId: "agent-1",
          name: "Atlas (ai)",
          description: "General-purpose assistant for research, analysis, and task management",
          capabilities: ["research", "analysis", "task-management", "summarization"],
          tools: ["web-search", "file-read", "message-send"],
          status: "online",
          owner: "user-1",
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          taskCount: 142,
          successRate: 0.94,
        },
        {
          agentId: "agent-2",
          name: "CodeForge (ai)",
          description: "Specialized in code generation, review, and refactoring across multiple languages",
          capabilities: ["code-generation", "code-review", "refactoring", "debugging"],
          tools: ["code-execute", "git-operations", "file-write"],
          status: "online",
          owner: "user-1",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          taskCount: 89,
          successRate: 0.91,
        },
        {
          agentId: "agent-3",
          name: "Sentinel (ai)",
          description: "Security and compliance monitoring agent with real-time threat detection",
          capabilities: ["security-scan", "compliance-check", "audit-log", "threat-detection"],
          tools: ["log-analyze", "vulnerability-scan", "report-generate"],
          status: "busy",
          owner: "user-1",
          createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
          taskCount: 256,
          successRate: 0.97,
        },
        {
          agentId: "agent-4",
          name: "DataWeaver (ai)",
          description: "Data pipeline and ETL specialist with real-time streaming support",
          capabilities: ["etl", "data-transform", "pipeline-orchestration", "anomaly-detection"],
          tools: ["db-query", "stream-process", "chart-generate"],
          status: "offline",
          owner: "user-2",
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          taskCount: 67,
          successRate: 0.88,
        },
      ],
    };
  }

  async getAgent(agentId: string): Promise<ApiResponse<AgentProfile>> {
    // TODO: Replace with real API call
    const agents = (await this.getAgents()).data || [];
    const agent = agents.find((a) => a.agentId === agentId);
    if (!agent) {
      return { success: false, error: "Agent not found" };
    }
    return { success: true, data: agent };
  }

  // ─── MCP ────────────────────────────────────────────────────

  async getMCPServers(): Promise<ApiResponse<MCPServerInfo[]>> {
    // TODO: Replace with real API call
    return {
      success: true,
      data: [
        {
          serverId: "mcp-github",
          name: "GitHub MCP",
          version: "1.0.0",
          transport: "stdio",
          endpoint: "mcp://github.internal",
          tools: [
            {
              name: "create_issue",
              description: "Create a GitHub issue in a repository",
              inputSchema: {
                type: "object",
                properties: {
                  owner: { type: "string", description: "Repository owner" },
                  repo: { type: "string", description: "Repository name" },
                  title: { type: "string", description: "Issue title" },
                  body: { type: "string", description: "Issue body" },
                },
                required: ["owner", "repo", "title"],
              },
            },
            {
              name: "list_pull_requests",
              description: "List pull requests for a repository",
              inputSchema: {
                type: "object",
                properties: {
                  owner: { type: "string" },
                  repo: { type: "string" },
                  state: { type: "string", enum: ["open", "closed", "all"] },
                },
                required: ["owner", "repo"],
              },
            },
          ],
          resources: [],
          status: "connected",
          lastHealthCheck: new Date().toISOString(),
        },
        {
          serverId: "mcp-web",
          name: "Web Search MCP",
          version: "1.0.0",
          transport: "sse",
          endpoint: "mcp://web.internal",
          tools: [
            {
              name: "web_search",
              description: "Search the web for information",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query" },
                  max_results: { type: "number", description: "Max number of results" },
                },
                required: ["query"],
              },
            },
          ],
          resources: [],
          status: "connected",
          lastHealthCheck: new Date().toISOString(),
        },
      ],
    };
  }

  async invokeMCPTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ApiResponse<MCPToolInvocation>> {
    // TODO: Implement with actual server endpoint
    return this.request("/api/v1/mcp/invoke", {
      method: "POST",
      body: JSON.stringify({ toolName, arguments: args }),
    });
  }

  // ─── A2A Tasks ──────────────────────────────────────────────

  async getA2ATasks(): Promise<ApiResponse<A2ATask[]>> {
    // TODO: Replace with real API call
    return {
      success: true,
      data: [],
    };
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
