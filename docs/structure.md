# KALEN — Project Structure

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)
**Last Updated:** 2026-06-09
**Status:** Pre-Alpha — scaffold only

> **Legend:**
> - ✅ **Exists** — File or directory is present in the repository
> - 📋 **Planned** — File is defined in `PROJECT_STRUCTURE.md` but does not yet exist
> - 🔲 **Placeholder** — Directory structure referenced but empty or not created

---

## Top-Level Layout

```
kalen/
├── apps/                   # Application packages
├── packages/               # Shared library packages
├── infra/                  # Infrastructure configurations
├── docs/                   # Documentation
├── .github/                # GitHub-specific config (CI/CD, templates)
├── .husky/                 # Git hooks
├── .vscode/                # Shared VS Code config
├── package.json            # Root workspace manifest
├── pnpm-workspace.yaml     # Workspace package definitions
├── turbo.json              # Turborepo task configuration
├── tsconfig.json           # Base TypeScript configuration
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variable template
├── README.md               # Project overview
└── PROJECT_STRUCTURE.md    # Full directory tree reference
```

---

## Root Files

| File | Status | Purpose |
|------|--------|---------|
| `package.json` | ✅ Exists | Root workspace manifest. Defines monorepo scripts (`dev`, `build`, `lint`, `test`, `infra:up`, etc.), dev dependencies (ESLint, Prettier, Husky, commitlint, Turbo, TypeScript), and package manager (pnpm 9.15). |
| `pnpm-workspace.yaml` | ✅ Exists | Declares workspace packages: `apps/*` and `packages/*`. |
| `turbo.json` | ✅ Exists | Turborepo task graph configuration. Defines `build`, `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `clean` tasks with dependency ordering and output caching. |
| `tsconfig.json` | ✅ Exists | Base TypeScript config: ES2022 target, strict mode, ESNext modules, bundler resolution, path aliases for `@kalen/shared`, `@kalen/identity`, `@kalen/mcp-gateway`, `@kalen/a2a-router`. |
| `.gitignore` | ✅ Exists | Excludes: node_modules, dist, .next, .env, secrets (*.pem, *.key), IDE files, Docker volumes, logs, Turbo cache. |
| `.env.example` | ✅ Exists | Environment variable template with 50+ variables across 10 categories: Application, WebAuthn, JWT, PostgreSQL, Redis, NATS, MinIO, Elasticsearch, LiveKit, TURN, Traefik, OpenIM, MCP Gateway, A2A Router, Agent Identity, AI/LLM, Monitoring. |
| `README.md` | ✅ Exists | Comprehensive project overview (~770 lines): vision, architecture, protocol integration, dual identity model, honest status, tech stack, quick start, structure, development, testing, deployment, contributing, security, license, acknowledgments. |
| `PROJECT_STRUCTURE.md` | ✅ Exists | Complete directory tree with file-level descriptions for all planned files across the monorepo. |

---

## apps/ — Application Packages

### apps/web/ — Next.js Web Client (`@kalen/web`)

| Path | Status | Purpose |
|------|--------|---------|
| `apps/web/` | 📋 Planned | Next.js 14+ web client using App Router |
| `apps/web/package.json` | 📋 Planned | Dependencies: next, react, @kalen/* packages |
| `apps/web/next.config.ts` | 📋 Planned | Next.js config: transpilePackages for @kalen/*, rewrites for API proxy |
| `apps/web/tsconfig.json` | 📋 Planned | Extends root tsconfig |
| `apps/web/tailwind.config.ts` | 📋 Planned | Design tokens: colors, spacing, typography |
| `apps/web/postcss.config.js` | 📋 Planned | PostCSS with Tailwind + autoprefixer |
| `apps/web/.env.example` | 📋 Planned | NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, etc. |
| `apps/web/middleware.ts` | 📋 Planned | Auth guard: validate session tokens before page render |
| `apps/web/public/` | 📋 Planned | Static assets (favicon, PWA manifest, assetlinks) |
| `apps/web/src/app/layout.tsx` | 📋 Planned | Root layout: providers, fonts, metadata |
| `apps/web/src/app/page.tsx` | 📋 Planned | Landing page / redirect to /chat |
| `apps/web/src/app/globals.css` | 📋 Planned | Tailwind directives + CSS custom properties |
| `apps/web/src/app/(auth)/login/page.tsx` | 📋 Planned | WebAuthn passkey login page |
| `apps/web/src/app/(auth)/register/page.tsx` | 📋 Planned | Passkey registration + recovery setup |
| `apps/web/src/app/(auth)/recovery/page.tsx` | 📋 Planned | Account recovery via 24-word phrase |
| `apps/web/src/app/(main)/layout.tsx` | 📋 Planned | Sidebar + header + presence indicator |
| `apps/web/src/app/(main)/chat/page.tsx` | 📋 Planned | Chat list view |
| `apps/web/src/app/(main)/chat/[conversationId]/page.tsx` | 📋 Planned | Conversation view with message feed |
| `apps/web/src/app/(main)/channels/page.tsx` | 📋 Planned | Channel directory |
| `apps/web/src/app/(main)/channels/[channelId]/page.tsx` | 📋 Planned | Channel view |
| `apps/web/src/app/(main)/agents/page.tsx` | 📋 Planned | Agent directory: browse, create, manage |
| `apps/web/src/app/(main)/agents/[agentId]/page.tsx` | 📋 Planned | Agent profile: manifest, tools, activity |
| `apps/web/src/app/(main)/calls/page.tsx` | 📋 Planned | Active calls view with WebRTC UI |
| `apps/web/src/app/(main)/settings/page.tsx` | 📋 Planned | User settings: keys, devices, preferences |
| `apps/web/src/app/(main)/admin/page.tsx` | 📋 Planned | Admin dashboard |
| `apps/web/src/app/(main)/admin/agents/page.tsx` | 📋 Planned | Agent governance: approve, revoke, scope |
| `apps/web/src/app/(main)/admin/audit/page.tsx` | 📋 Planned | Audit log viewer with filters |
| `apps/web/src/app/not-found.tsx` | 📋 Planned | 404 page |
| `apps/web/src/components/ui/` | 📋 Planned | Primitives (shadcn/ui): button, input, dialog, dropdown, avatar, badge, tooltip, scroll-area, separator, sheet |
| `apps/web/src/components/chat/` | 📋 Planned | Chat-specific: message-list, message-item, message-input, reaction-bar, typing-indicator, read-receipt, file-upload, conversation-list |
| `apps/web/src/components/agents/` | 📋 Planned | Agent UI: agent-card, agent-manifest, agent-create-form, agent-activity-feed, agent-scope-editor |
| `apps/web/src/components/calls/` | 📋 Planned | WebRTC: call-view, call-controls, call-participant, call-incoming |
| `apps/web/src/components/identity/` | 📋 Planned | Identity/auth: passkey-register, passkey-login, recovery-phrase, device-manager, entity-badge |
| `apps/web/src/components/layout/` | 📋 Planned | App shell: sidebar, header, presence-dot, command-palette |
| `apps/web/src/hooks/use-auth.ts` | 📋 Planned | Auth state: user, isAuthenticated, login, logout |
| `apps/web/src/hooks/use-websocket.ts` | 📋 Planned | WebSocket connection with reconnect |
| `apps/web/src/hooks/use-messages.ts` | 📋 Planned | Message CRUD with optimistic updates |
| `apps/web/src/hooks/use-conversations.ts` | 📋 Planned | Conversation list and management |
| `apps/web/src/hooks/use-webrtc.ts` | 📋 Planned | LiveKit room connection |
| `apps/web/src/hooks/use-agents.ts` | 📋 Planned | Agent directory and management |
| `apps/web/src/hooks/use-presence.ts` | 📋 Planned | Online status subscription |
| `apps/web/src/hooks/use-file-upload.ts` | 📋 Planned | Presigned URL upload to MinIO |
| `apps/web/src/hooks/use-search.ts` | 📋 Planned | Full-text message search |
| `apps/web/src/lib/api-client.ts` | 📋 Planned | Typed fetch wrapper with auth headers |
| `apps/web/src/lib/ws-client.ts` | 📋 Planned | WebSocket manager: connect, subscribe, reconnect |
| `apps/web/src/lib/livekit-client.ts` | 📋 Planned | LiveKit room helpers |
| `apps/web/src/lib/webauthn-client.ts` | 📋 Planned | navigator.credentials helpers |
| `apps/web/src/lib/query-client.ts` | 📋 Planned | TanStack Query client config |
| `apps/web/src/lib/utils.ts` | 📋 Planned | cn(), formatDate(), etc. |
| `apps/web/src/stores/auth-store.ts` | 📋 Planned | Zustand: user session, token, entity type |
| `apps/web/src/stores/chat-store.ts` | 📋 Planned | Zustand: active conversation, drafts, filters |
| `apps/web/src/stores/presence-store.ts` | 📋 Planned | Zustand: online users and agents map |
| `apps/web/src/stores/ui-store.ts` | 📋 Planned | Zustand: sidebar collapsed, theme, modals |
| `apps/web/tests/e2e/auth.spec.ts` | 📋 Planned | Playwright: passkey register/login flow |
| `apps/web/tests/e2e/chat.spec.ts` | 📋 Planned | Playwright: send message, receive, react |
| `apps/web/tests/e2e/agents.spec.ts` | 📋 Planned | Playwright: create agent, view manifest |
| `apps/web/Dockerfile` | 📋 Planned | Multi-stage: deps → build → node:alpine |

### apps/server/ — NestJS API Server (`@kalen/server`)

| Path | Status | Purpose |
|------|--------|---------|
| `apps/server/` | 📋 Planned | NestJS API server |
| `apps/server/package.json` | 📋 Planned | Dependencies: @nestjs/core, @kalen/* packages |
| `apps/server/nest-cli.json` | 📋 Planned | NestJS CLI config |
| `apps/server/tsconfig.json` | 📋 Planned | Extends root tsconfig |
| `apps/server/.env.example` | 📋 Planned | DB_URL, REDIS_URL, NATS_URL, JWT_SECRET, etc. |
| `apps/server/src/main.ts` | 📋 Planned | Bootstrap: NestFactory, CORS, validation pipe |
| `apps/server/src/app.module.ts` | 📋 Planned | Root module: imports all feature modules |
| `apps/server/src/config/` | 📋 Planned | Configuration module: config.module, config.service, config.schema |
| `apps/server/src/auth/` | 📋 Planned | Authentication: controller, service, JWT strategy/guard, WS guard, DTOs |
| `apps/server/src/conversations/` | 📋 Planned | Messaging: controller, service, entities (conversation, message), gateway (WS), DTOs |
| `apps/server/src/channels/` | 📋 Planned | Channels: controller, service, entity (visibility, allowedEntityTypes), DTOs |
| `apps/server/src/agents/` | 📋 Planned | Agent management: controller, service, identity service, scope service, entity, DTOs |
| `apps/server/src/calls/` | 📋 Planned | WebRTC/LiveKit: controller, service, gateway, DTOs |
| `apps/server/src/files/` | 📋 Planned | File storage: controller, service (MinIO presigned), entity, DTOs |
| `apps/server/src/search/` | 📋 Planned | Full-text search: controller, service (Elasticsearch), DTOs |
| `apps/server/src/presence/` | 📋 Planned | Presence: service (Redis + NATS), gateway (WS) |
| `apps/server/src/audit/` | 📋 Planned | Audit logging: service (append-only signed), entity, interceptor |
| `apps/server/src/admin/` | 📋 Planned | Admin: controller, guard (role: admin), service (dashboard aggregation) |
| `apps/server/src/events/` | 📋 Planned | Event bus: module (NATS), service (publish/subscribe), event subjects |
| `apps/server/src/database/` | 📋 Planned | Database: TypeORM config, migrations |
| `apps/server/tests/` | 📋 Planned | E2E tests: auth, conversations, agents |
| `apps/server/Dockerfile` | 📋 Planned | Multi-stage: build → node:alpine |

---

## packages/ — Shared Library Packages

### packages/shared/ — Core Types and Utilities (`@kalen/shared`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/shared/` | 📋 Planned | Shared types, schemas, and utilities consumed by all packages |
| `packages/shared/package.json` | 📋 Planned | @kalen/shared package manifest |
| `packages/shared/tsconfig.json` | 📋 Planned | Extends root tsconfig |
| `packages/shared/src/index.ts` | 📋 Planned | Barrel export for all shared modules |
| `packages/shared/src/types/entity.ts` | 📋 Planned | EntityType enum: HUMAN \| AGENT |
| `packages/shared/src/types/user.ts` | 📋 Planned | HumanUser type: id, username, credentialIds |
| `packages/shared/src/types/agent.ts` | 📋 Planned | Agent type: id, name(ai), publicKey, manifestUrl |
| `packages/shared/src/types/conversation.ts` | 📋 Planned | Conversation type: id, type, members, lastMessage |
| `packages/shared/src/types/message.ts` | 📋 Planned | Message type: id, content, sender, reactions, readBy |
| `packages/shared/src/types/channel.ts` | 📋 Planned | Channel type: id, visibility, allowedEntityTypes |
| `packages/shared/src/types/call.ts` | 📋 Planned | Call type: id, type, participants, livekitRoom |
| `packages/shared/src/types/file.ts` | 📋 Planned | FileAttachment type: id, key, size, mimeType |
| `packages/shared/src/types/presence.ts` | 📋 Planned | PresenceStatus type: userId, status, lastSeen |
| `packages/shared/src/types/audit.ts` | 📋 Planned | AuditEntry type: timestamp, entityType, action, target |
| `packages/shared/src/types/api.ts` | 📋 Planned | API response wrappers: ApiResponse\<T\>, Paginated\<T\> |
| `packages/shared/src/protocols/ws-events.ts` | 📋 Planned | WebSocket event type definitions |
| `packages/shared/src/protocols/nats-events.ts` | 📋 Planned | NATS subject/payload type definitions |
| `packages/shared/src/protocols/mcp-types.ts` | 📋 Planned | MCP JSON-RPC type definitions |
| `packages/shared/src/protocols/a2a-types.ts` | 📋 Planned | A2A JSON-RPC 2.0 type definitions |
| `packages/shared/src/schemas/auth.schema.ts` | 📋 Planned | Zod schemas: RegisterRequest, LoginRequest |
| `packages/shared/src/schemas/conversation.schema.ts` | 📋 Planned | Zod schemas: CreateConversation, SendMessage |
| `packages/shared/src/schemas/agent.schema.ts` | 📋 Planned | Zod schemas: CreateAgent, AgentManifest |
| `packages/shared/src/schemas/mcp.schema.ts` | 📋 Planned | Zod schemas: MCP request/response |
| `packages/shared/src/schemas/a2a.schema.ts` | 📋 Planned | Zod schemas: A2A Task, Message, Artifact |
| `packages/shared/src/constants/entity-rules.ts` | 📋 Planned | AGENT_SUFFIX = "(ai)", naming regex |
| `packages/shared/src/constants/permissions.ts` | 📋 Planned | Permission enum: READ, WRITE, CALL, ADMIN |
| `packages/shared/src/constants/channel-visibility.ts` | 📋 Planned | PUBLIC, PRIVATE, AGENT_ONLY, HYBRID |
| `packages/shared/src/constants/limits.ts` | 📋 Planned | MAX_FILE_SIZE, MAX_GROUP_SIZE, etc. |
| `packages/shared/src/utils/entity-helpers.ts` | 📋 Planned | isAgent(), isHuman(), parseEntityName() |
| `packages/shared/src/utils/validation.ts` | 📋 Planned | validateAgentName(), validateSuffix() |
| `packages/shared/src/utils/crypto.ts` | 📋 Planned | base64url encode/decode, hash helpers |
| `packages/shared/src/utils/id.ts` | 📋 Planned | nanoid-based ID generation |
| `packages/shared/tsup.config.ts` | 📋 Planned | Build config: dual CJS + ESM output |

### packages/identity/ — WebAuthn + Agent Identity (`@kalen/identity`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/identity/` | 📋 Planned | Identity service for human and agent authentication |
| `packages/identity/package.json` | 📋 Planned | @kalen/identity package manifest |
| `packages/identity/tsconfig.json` | 📋 Planned | Extends root tsconfig |
| `packages/identity/src/index.ts` | 📋 Planned | Barrel export |
| `packages/identity/src/webauthn/registration.service.ts` | 📋 Planned | generateRegistrationOptions(), verifyRegistration() |
| `packages/identity/src/webauthn/authentication.service.ts` | 📋 Planned | generateAuthenticationOptions(), verifyAuthentication() |
| `packages/identity/src/webauthn/challenge-store.ts` | 📋 Planned | Redis-backed challenge storage with TTL |
| `packages/identity/src/webauthn/credential-store.ts` | 📋 Planned | PostgreSQL credential storage: publicKey, counter |
| `packages/identity/src/webauthn/webauthn.config.ts` | 📋 Planned | rpID, rpName, origin, timeout, attestation |
| `packages/identity/src/agent-identity/keypair.service.ts` | 📋 Planned | Ed25519 keypair generation, storage, rotation |
| `packages/identity/src/agent-identity/manifest.service.ts` | 📋 Planned | Agent manifest CRUD: skills, tools, rate, owner |
| `packages/identity/src/agent-identity/manifest-signer.ts` | 📋 Planned | Sign manifest with agent Ed25519 private key |
| `packages/identity/src/agent-identity/manifest-verifier.ts` | 📋 Planned | Verify manifest signature against public key |
| `packages/identity/src/agent-identity/agent-token.service.ts` | 📋 Planned | Short-lived token (24h TTL) creation, validation |
| `packages/identity/src/agent-identity/suffix-enforcer.ts` | 📋 Planned | Enforce (ai) suffix on agent names, prevent spoofing |
| `packages/identity/src/recovery/recovery.service.ts` | 📋 Planned | Generate/verify 24-word recovery phrase |
| `packages/identity/src/recovery/recovery-phrase.ts` | 📋 Planned | BIP39 wordlist + generation + validation |
| `packages/identity/src/recovery/device-binding.ts` | 📋 Planned | Bind recovery to device credentials |
| `packages/identity/src/rbac/role.service.ts` | 📋 Planned | Role assignment: HUMAN, AGENT, ADMIN |
| `packages/identity/src/rbac/permission.service.ts` | 📋 Planned | Permission check: canAccess(room, tool, entity) |
| `packages/identity/src/rbac/scope-resolver.ts` | 📋 Planned | Resolve agent scope from manifest capabilities |
| `packages/identity/src/rbac/policy-engine.ts` | 📋 Planned | Evaluate access policies with deny-first logic |
| `packages/identity/src/audit/identity-audit.service.ts` | 📋 Planned | Log identity events: register, auth, rotate, revoke |
| `packages/identity/src/audit/identity-audit.entity.ts` | 📋 Planned | Audit record type definition |
| `packages/identity/tsup.config.ts` | 📋 Planned | Build config: dual CJS + ESM output |

### packages/mcp-gateway/ — MCP Protocol Integration (`@kalen/mcp-gateway`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/mcp-gateway/` | 📋 Planned | MCP Gateway: tool discovery, routing, governance |
| `packages/mcp-gateway/package.json` | 📋 Planned | @kalen/mcp-gateway package manifest |
| `packages/mcp-gateway/tsconfig.json` | 📋 Planned | Extends root tsconfig |
| `packages/mcp-gateway/src/index.ts` | 📋 Planned | Barrel export |
| `packages/mcp-gateway/src/gateway/mcp-gateway.service.ts` | 📋 Planned | Central gateway: route tool calls to MCP servers |
| `packages/mcp-gateway/src/gateway/mcp-gateway.controller.ts` | 📋 Planned | HTTP endpoints for MCP operations |
| `packages/mcp-gateway/src/gateway/mcp-gateway.module.ts` | 📋 Planned | NestJS module definition |
| `packages/mcp-gateway/src/gateway/gateway.config.ts` | 📋 Planned | Gateway config: timeouts, maxConcurrent, retries |
| `packages/mcp-gateway/src/client/mcp-client.ts` | 📋 Planned | MCP client: connect to servers via stdio/SSE |
| `packages/mcp-gateway/src/client/client-transport.ts` | 📋 Planned | Transport layer: stdio, SSE, WebSocket |
| `packages/mcp-gateway/src/client/client-pool.ts` | 📋 Planned | Pool of MCP clients per agent, with lifecycle |
| `packages/mcp-gateway/src/client/client.config.ts` | 📋 Planned | Client config: requestTimeout, maxRetries |
| `packages/mcp-gateway/src/server/mcp-server.ts` | 📋 Planned | MCP server: expose tools, resources, prompts |
| `packages/mcp-gateway/src/server/server-transport.ts` | 📋 Planned | Transport: stdio, SSE |
| `packages/mcp-gateway/src/server/tool-registry.ts` | 📋 Planned | Register tool definitions with input schemas |
| `packages/mcp-gateway/src/server/resource-provider.ts` | 📋 Planned | Expose data resources to MCP clients |
| `packages/mcp-gateway/src/registry/server-registry.service.ts` | 📋 Planned | CRUD: register, discover, deprecate MCP servers |
| `packages/mcp-gateway/src/registry/server-registry.entity.ts` | 📋 Planned | TypeORM: name, version, tools, status, owner |
| `packages/mcp-gateway/src/registry/server-card.ts` | 📋 Planned | MCP server metadata card |
| `packages/mcp-gateway/src/governance/allowlist.service.ts` | 📋 Planned | Per-agent tool allowlist enforcement |
| `packages/mcp-gateway/src/governance/tool-sanitizer.ts` | 📋 Planned | Sanitize tool outputs: strip prompt injection |
| `packages/mcp-gateway/src/governance/capability-validator.ts` | 📋 Planned | Validate tool calls against agent manifest scope |
| `packages/mcp-gateway/src/governance/rate-limiter.ts` | 📋 Planned | Per-agent, per-tool rate limiting (Redis) |
| `packages/mcp-gateway/src/governance/oauth.service.ts` | 📋 Planned | OAuth 2.1 integration for external API tools |
| `packages/mcp-gateway/src/tools/kalen-message.tool.ts` | 📋 Planned | Built-in tool: send/receive messages |
| `packages/mcp-gateway/src/tools/kalen-search.tool.ts` | 📋 Planned | Built-in tool: search messages and conversations |
| `packages/mcp-gateway/src/tools/kalen-file.tool.ts` | 📋 Planned | Built-in tool: upload/download files from MinIO |
| `packages/mcp-gateway/src/tools/kalen-web.tool.ts` | 📋 Planned | Built-in tool: web search and fetch |
| `packages/mcp-gateway/src/tools/kalen-code.tool.ts` | 📋 Planned | Built-in tool: code execution in sandbox |
| `packages/mcp-gateway/src/protocol/json-rpc.ts` | 📋 Planned | JSON-RPC 2.0 base: request, response, error |
| `packages/mcp-gateway/src/protocol/mcp-messages.ts` | 📋 Planned | MCP-specific messages: initialize, tools/list, etc. |
| `packages/mcp-gateway/src/protocol/mcp-errors.ts` | 📋 Planned | MCP error codes and factories |
| `packages/mcp-gateway/tsup.config.ts` | 📋 Planned | Build config: dual CJS + ESM output |

### packages/a2a-router/ — A2A Protocol Integration (`@kalen/a2a-router`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/a2a-router/` | 📋 Planned | A2A Router: agent discovery, task delegation, artifact exchange |
| `packages/a2a-router/package.json` | 📋 Planned | @kalen/a2a-router package manifest |
| `packages/a2a-router/tsconfig.json` | 📋 Planned | Extends root tsconfig |
| `packages/a2a-router/src/index.ts` | 📋 Planned | Barrel export |
| `packages/a2a-router/src/router/a2a-router.service.ts` | 📋 Planned | Central router: route tasks to agents |
| `packages/a2a-router/src/router/a2a-router.controller.ts` | 📋 Planned | HTTP endpoints: A2A JSON-RPC 2.0 over HTTP |
| `packages/a2a-router/src/router/a2a-router.module.ts` | 📋 Planned | NestJS module definition |
| `packages/a2a-router/src/router/router.config.ts` | 📋 Planned | Router config: discovery cache TTL, maxTasks |
| `packages/a2a-router/src/agent-card/agent-card.service.ts` | 📋 Planned | Generate, sign, verify, cache Agent Cards |
| `packages/a2a-router/src/agent-card/agent-card.entity.ts` | 📋 Planned | TypeORM: url, name, description, capabilities |
| `packages/a2a-router/src/agent-card/agent-card.schema.ts` | 📋 Planned | Zod schema for Agent Card validation |
| `packages/a2a-router/src/agent-card/well-known.controller.ts` | 📋 Planned | GET /.well-known/agent.json endpoint |
| `packages/a2a-router/src/task/task.service.ts` | 📋 Planned | Task CRUD: create, update, cancel, complete |
| `packages/a2a-router/src/task/task.entity.ts` | 📋 Planned | TypeORM: id, status, history, artifacts |
| `packages/a2a-router/src/task/task-lifecycle.ts` | 📋 Planned | State machine: submitted→working→completed/failed |
| `packages/a2a-router/src/task/task-delegator.ts` | 📋 Planned | Delegate tasks to appropriate agents |
| `packages/a2a-router/src/task/task-events.gateway.ts` | 📋 Planned | SSE: stream task status updates to clients |
| `packages/a2a-router/src/artifact/artifact.service.ts` | 📋 Planned | Create, store, retrieve artifacts |
| `packages/a2a-router/src/artifact/artifact.entity.ts` | 📋 Planned | TypeORM: id, taskId, type, content, parts |
| `packages/a2a-router/src/artifact/artifact.schema.ts` | 📋 Planned | Zod schema for artifact validation |
| `packages/a2a-router/src/message/a2a-message.service.ts` | 📋 Planned | Send/receive task-scoped messages |
| `packages/a2a-router/src/message/a2a-message.entity.ts` | 📋 Planned | TypeORM: id, taskId, role, content, parts |
| `packages/a2a-router/src/message/a2a-message.schema.ts` | 📋 Planned | Zod schema for message validation |
| `packages/a2a-router/src/discovery/discovery.service.ts` | 📋 Planned | Discover agents via Agent Cards, cache in Redis |
| `packages/a2a-router/src/discovery/discovery-cache.ts` | 📋 Planned | Redis-backed Agent Card cache with TTL |
| `packages/a2a-router/src/discovery/discovery-events.ts` | 📋 Planned | NATS events for new/updated/deprecated agents |
| `packages/a2a-router/src/security/card-signer.ts` | 📋 Planned | Sign Agent Cards with Ed25519 |
| `packages/a2a-router/src/security/card-verifier.ts` | 📋 Planned | Verify Agent Card signatures |
| `packages/a2a-router/src/security/oauth-pkce.ts` | 📋 Planned | OAuth 2.1 with PKCE for A2A auth |
| `packages/a2a-router/src/security/mtls.config.ts` | 📋 Planned | mTLS configuration for enterprise deployment |
| `packages/a2a-router/src/security/a2a-rate-limiter.ts` | 📋 Planned | Per-agent rate limiting for A2A endpoints |
| `packages/a2a-router/src/protocol/json-rpc.ts` | 📋 Planned | JSON-RPC 2.0: parse, validate, respond |
| `packages/a2a-router/src/protocol/a2a-methods.ts` | 📋 Planned | A2A methods: tasks/send, tasks/get, etc. |
| `packages/a2a-router/src/protocol/a2a-errors.ts` | 📋 Planned | A2A error codes: -32600, -32601, etc. |
| `packages/a2a-router/src/protocol/a2a-sse.ts` | 📋 Planned | SSE stream handler for task updates |
| `packages/a2a-router/tsup.config.ts` | 📋 Planned | Build config: dual CJS + ESM output |

---

## infra/ — Infrastructure Configurations

### infra/docker/ — Docker Configurations

| Path | Status | Purpose |
|------|--------|---------|
| `infra/docker/docker-compose.yml` | ✅ Exists | Local dev stack: 11 services (Traefik, PostgreSQL+pgvector, Redis, NATS, MinIO, Elasticsearch, LiveKit, coturn, Prometheus, Grafana, Loki) with healthchecks, volumes, and kalen-net bridge network |
| `infra/docker/docker-compose.prod.yml` | 📋 Planned | Production overrides: resource limits, replicas, restart policies, TLS via Traefik with Let's Encrypt |
| `infra/docker/docker-compose.test.yml` | 📋 Planned | Test environment: isolated database instances, test fixtures |
| `infra/docker/traefik/traefik.yml` | ✅ Exists | Traefik static config: API insecure, DEBUG log, web (80) and websecure (443) entrypoints, Docker + file providers |
| `infra/docker/traefik/traefik-dynamic.yml` | 📋 Planned | Dynamic config: routers, services, middlewares (rate limit, security headers, CORS) |
| `infra/docker/traefik/acme.json` | 📋 Planned | Let's Encrypt cert storage (gitignored) |
| `infra/docker/traefik/middleware/` | 📋 Planned | Rate limiting, security headers, CORS middleware configs |
| `infra/docker/openim/config.yaml` | 📋 Planned | OpenIM server configuration |
| `infra/docker/openim/notification.yaml` | 📋 Planned | Push notification configuration |
| `infra/docker/livekit/livekit.yaml` | ✅ Exists | LiveKit config: dev API keys, room auto-creation, max 50 participants, RTC port range |
| `infra/docker/livekit/egress.yaml` | 📋 Planned | Recording/egress template config |
| `infra/docker/postgres/init.sql` | ✅ Exists | PostgreSQL init: uuid-ossp and pgvector extensions |
| `infra/docker/postgres/pg_hba.conf` | 📋 Planned | Host-based auth config |
| `infra/docker/redis/redis.conf` | 📋 Planned | maxmemory, eviction policy, ACLs |
| `infra/docker/minio/policy.json` | 📋 Planned | Bucket access policy |
| `infra/docker/nats/nats.conf` | 📋 Planned | Cluster, jetstream, auth config |
| `infra/docker/elasticsearch/elasticsearch.yml` | 📋 Planned | Index settings, shard config |
| `infra/docker/coturn/turnserver.conf` | 📋 Planned | Realm, credentials, TLS cert paths |
| `infra/docker/monitoring/prometheus/prometheus.yml` | ✅ Exists | Scrape configs for kalen-server, LiveKit, NATS, postgres-exporter |
| `infra/docker/monitoring/prometheus/alert.rules.yml` | 📋 Planned | Alert rules: high latency, low uptime |
| `infra/docker/monitoring/grafana/datasources.yml` | ✅ Exists | Prometheus + Loki datasource provisioning |
| `infra/docker/monitoring/grafana/dashboard-providers.yml` | ✅ Exists | File-based dashboard provider config |
| `infra/docker/monitoring/grafana/dashboards/` | 📋 Planned | Dashboard JSONs: kalen-overview, messaging-metrics, agent-activity |
| `infra/docker/monitoring/loki/loki-config.yml` | 📋 Planned | Log aggregation config |

### infra/scripts/ — Setup and Utility Scripts

| Path | Status | Purpose |
|------|--------|---------|
| `infra/scripts/setup-local.sh` | ✅ Exists | One-command dev bootstrap: copy .env, install pnpm, install deps, start Docker, wait for PostgreSQL, run migrations |

### infra/k8s/ — Kubernetes Manifests

| Path | Status | Purpose |
|------|--------|---------|
| `infra/k8s/` | 📋 Planned | Kustomize-based Kubernetes manifests |
| `infra/k8s/base/namespace.yaml` | 📋 Planned | kalen-system namespace |
| `infra/k8s/base/kustomization.yaml` | 📋 Planned | Base resource references |
| `infra/k8s/base/server/` | 📋 Planned | API server: deployment (2 replicas), service, configmap, HPA |
| `infra/k8s/base/web/` | 📋 Planned | Web client: deployment (2 replicas), service |
| `infra/k8s/base/identity/` | 📋 Planned | Identity service (if split from server) |
| `infra/k8s/base/postgres/` | 📋 Planned | PostgreSQL StatefulSet (1 replica), service, PVC |
| `infra/k8s/base/redis/` | 📋 Planned | Redis StatefulSet, service |
| `infra/k8s/base/minio/` | 📋 Planned | MinIO StatefulSet, service, PVC |
| `infra/k8s/base/nats/` | 📋 Planned | NATS StatefulSet (JetStream), service |
| `infra/k8s/base/elasticsearch/` | 📋 Planned | Elasticsearch StatefulSet, service |
| `infra/k8s/base/livekit/` | 📋 Planned | LiveKit deployment, service |
| `infra/k8s/base/traefik/` | 📋 Planned | Traefik Ingress Controller, LoadBalancer service |
| `infra/k8s/base/coturn/` | 📋 Planned | TURN server, hostNetwork deployment |
| `infra/k8s/overlays/staging/` | 📋 Planned | Staging-specific patches |
| `infra/k8s/overlays/production/` | 📋 Planned | Production patches: replicas, resources, secrets |

---

## .github/ — GitHub Configuration

| Path | Status | Purpose |
|------|--------|---------|
| `.github/` | 📋 Planned | GitHub-specific config directory |
| `.github/workflows/ci.yml` | 📋 Planned | CI: lint, typecheck, test, build on PR |
| `.github/workflows/cd-staging.yml` | 📋 Planned | CD: deploy staging on merge to develop |
| `.github/workflows/cd-production.yml` | 📋 Planned | CD: deploy production on merge to main |
| `.github/workflows/security-scan.yml` | 📋 Planned | Snyk/Trivy vulnerability scanning |
| `.github/workflows/release.yml` | 📋 Planned | Semantic versioning + changelog generation |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | 📋 Planned | Structured bug report form |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | 📋 Planned | Feature request form |
| `.github/ISSUE_TEMPLATE/security_vulnerability.yml` | 📋 Planned | Private security disclosure form |
| `.github/PULL_REQUEST_TEMPLATE.md` | 📋 Planned | PR checklist with architecture impact |
| `.github/CODEOWNERS` | 📋 Planned | Per-package code ownership |
| `.github/dependabot.yml` | 📋 Planned | Automated dependency updates |

---

## docs/ — Documentation

| Path | Status | Purpose |
|------|--------|---------|
| `docs/PRD.md` | ✅ Exists | Product Requirements Document: vision, problem statement, user stories, functional/non-functional requirements, protocol integration, security, roadmap |
| `docs/design.md` | ✅ Exists | System Design Document: philosophy, architecture, identity model, messaging, MCP, A2A, security, data, scalability, deployment, monitoring |
| `docs/architecture.md` | ✅ Exists | Architecture Decision Records: 10 ADRs covering monorepo, OpenIM, WebAuthn, MCP, A2A, Go/TS, PostgreSQL, NATS, Ed25519, JWT |
| `docs/CHANGELOG.md` | ✅ Exists | Keep a Changelog format version history |
| `docs/structure.md` | ✅ Exists | This file — detailed project structure with existence status |
| `docs/todo.md` | ✅ Exists | Phased TODO list |
| `docs/CONTRIBUTING.md` | ✅ Exists | Contribution guidelines |
| `docs/SECURITY.md` | ✅ Exists | Security policy |
| `docs/API.md` | ✅ Exists | API documentation (planned endpoints) |
| `docs/DEPLOYMENT.md` | ✅ Exists | Deployment documentation |

---

## Summary Statistics

| Category | Exists | Planned | Total |
|----------|--------|---------|-------|
| Root config files | 7 | 0 | 7 |
| apps/web files | 0 | ~45 | ~45 |
| apps/server files | 0 | ~30 | ~30 |
| packages/shared files | 0 | ~25 | ~25 |
| packages/identity files | 0 | ~20 | ~20 |
| packages/mcp-gateway files | 0 | ~30 | ~30 |
| packages/a2a-router files | 0 | ~35 | ~35 |
| infra/docker files | 7 | ~15 | ~22 |
| infra/k8s files | 0 | ~25 | ~25 |
| infra/scripts files | 1 | 0 | 1 |
| .github files | 0 | ~12 | ~12 |
| docs files | 3 | 7 | 10 |
| **Total** | **18** | **~244** | **~262** |

**As of 2026-06-09, approximately 7% of the planned file structure exists.** The existing files are exclusively infrastructure configurations and documentation — no application code has been written.
