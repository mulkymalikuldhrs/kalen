# KALEN — Project Structure

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)
**Last Updated:** 2026-06-10
**Status:** Pre-Alpha — core libraries implemented, applications scaffolded, in-memory persistence

> **Legend:**
> - ✅ **Exists** — File is present in the repository and implemented
> - ⚠️ **Stub** — File exists but contains placeholder/simulated implementation
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
├── jest.config.ts          # Root Jest config (multi-project)
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variable template
├── README.md               # Project overview
├── LICENSE                 # AGPL-3.0
└── PROJECT_STRUCTURE.md    # Full directory tree reference
```

---

## Root Files

| File | Status | Purpose |
|------|--------|---------|
| `package.json` | ✅ Exists | Root workspace manifest. Defines monorepo scripts, dev dependencies, and package manager (pnpm). |
| `pnpm-workspace.yaml` | ✅ Exists | Declares workspace packages: `apps/*` and `packages/*`. |
| `turbo.json` | ✅ Exists | Turborepo task graph configuration. |
| `tsconfig.json` | ✅ Exists | Base TypeScript config: ES2022 target, strict mode, path aliases for `@kalen/*`. |
| `jest.config.ts` | ✅ Exists | Root Jest config with multi-project setup for all 4 library packages. |
| `.gitignore` | ✅ Exists | Excludes: node_modules, dist, .next, .env, secrets, IDE files, Docker volumes, logs, Turbo cache. |
| `.env.example` | ✅ Exists | Environment variable template with 50+ variables across 10 categories. |
| `README.md` | ✅ Exists | Comprehensive project overview with honest status tracking. |
| `PROJECT_STRUCTURE.md` | ✅ Exists | Complete directory tree with file-level descriptions. |
| `LICENSE` | ✅ Exists | AGPL-3.0 license. |

---

## apps/ — Application Packages

### apps/web/ — Next.js Web Client (`@kalen/web`)

| Path | Status | Purpose |
|------|--------|---------|
| `apps/web/package.json` | ✅ Exists | @kalen/web with next, react, @kalen/* dependencies |
| `apps/web/next.config.ts` | ✅ Exists | Next.js config with transpilePackages for @kalen/* |
| `apps/web/tsconfig.json` | ✅ Exists | Extends root tsconfig |
| `apps/web/tailwind.config.ts` | ✅ Exists | Custom KALEN color system, dark theme |
| `apps/web/postcss.config.mjs` | ✅ Exists | PostCSS with Tailwind |
| `apps/web/next-env.d.ts` | ✅ Exists | Next.js type declarations |
| `apps/web/src/app/layout.tsx` | ✅ Exists | Root layout with AuthProvider + AppShell |
| `apps/web/src/app/page.tsx` | ✅ Exists | Landing page with KALEN branding, 4 pillars, CTAs |
| `apps/web/src/app/globals.css` | ✅ Exists | Dark theme, custom scrollbar, agent/human badges, animations |
| `apps/web/src/app/login/page.tsx` | ✅ Exists | WebAuthn/Passkey login page |
| `apps/web/src/app/register/page.tsx` | ✅ Exists | WebAuthn/Passkey registration |
| `apps/web/src/app/chat/page.tsx` | ✅ Exists | Chat room list with sidebar |
| `apps/web/src/app/chat/[roomId]/page.tsx` | ✅ Exists | Room view with members panel |
| `apps/web/src/app/agents/page.tsx` | ✅ Exists | Agent directory |
| `apps/web/src/app/agents/[id]/page.tsx` | ✅ Exists | Agent profile with stats/capabilities |
| `apps/web/src/app/settings/page.tsx` | ✅ Exists | Profile, security, notifications, appearance |
| `apps/web/src/app/mcp/page.tsx` | ✅ Exists | MCP tools browser with invocation |
| `apps/web/src/components/layout/app-shell.tsx` | ✅ Exists | Auth-aware shell with sidebar |
| `apps/web/src/components/layout/sidebar.tsx` | ✅ Exists | Rooms list, nav, user info |
| `apps/web/src/components/layout/header.tsx` | ✅ Exists | Search, notifications |
| `apps/web/src/components/layout/mobile-nav.tsx` | ✅ Exists | Bottom tab bar |
| `apps/web/src/components/chat/room-list.tsx` | ✅ Exists | Filterable room list |
| `apps/web/src/components/chat/message-list.tsx` | ✅ Exists | Auto-scroll, loading states |
| `apps/web/src/components/chat/message-bubble.tsx` | ✅ Exists | Markdown, agent/human distinction |
| `apps/web/src/components/chat/message-input.tsx` | ✅ Exists | Markdown toolbar, code mode |
| `apps/web/src/components/chat/typing-indicator.tsx` | ✅ Exists | Animated dots |
| `apps/web/src/components/chat/presence-badge.tsx` | ✅ Exists | Online/offline/dnd |
| `apps/web/src/components/auth/passkey-register.tsx` | ✅ Exists | WebAuthn registration flow |
| `apps/web/src/components/auth/passkey-login.tsx` | ✅ Exists | WebAuthn login flow |
| `apps/web/src/components/agents/agent-card.tsx` | ✅ Exists | Agent card with (ai) badge |
| `apps/web/src/components/agents/agent-directory.tsx` | ✅ Exists | Filterable agent grid |
| `apps/web/src/components/identity/identity-badge.tsx` | ✅ Exists | Human vs agent badge |
| `apps/web/src/components/mcp/tool-browser.tsx` | ✅ Exists | Server/tool catalog |
| `apps/web/src/components/mcp/tool-invocation.tsx` | ✅ Exists | Parameter inputs, results |
| `apps/web/src/lib/types.ts` | ✅ Exists | Re-exports @kalen/shared + UI-specific types |
| `apps/web/src/lib/api-client.ts` | ⚠️ Stub | HTTP client with simulated data (all endpoints TODO) |
| `apps/web/src/lib/socket.ts` | ✅ Exists | Socket.IO client with event system |
| `apps/web/src/lib/auth-context.tsx` | ✅ Exists | Auth state with localStorage persistence |
| `apps/web/src/hooks/use-auth.ts` | ✅ Exists | Auth context accessor |
| `apps/web/src/hooks/use-socket.ts` | ✅ Exists | Socket connection + event listeners |
| `apps/web/src/hooks/use-rooms.ts` | ✅ Exists | SWR-based data fetching for rooms/agents/MCP |
| `apps/web/src/app/recovery/page.tsx` | 📋 Planned | Account recovery via 24-word phrase |
| `apps/web/src/app/channels/page.tsx` | 📋 Planned | Channel directory |
| `apps/web/src/app/calls/page.tsx` | 📋 Planned | Active calls view with WebRTC UI |
| `apps/web/src/app/admin/page.tsx` | 📋 Planned | Admin dashboard |
| `apps/web/tests/e2e/` | 📋 Planned | Playwright E2E tests |

### apps/server/ — NestJS API Server (`@kalen/server`)

| Path | Status | Purpose |
|------|--------|---------|
| `apps/server/package.json` | ✅ Exists | @kalen/server with @nestjs/core, @kalen/* packages |
| `apps/server/nest-cli.json` | ✅ Exists | NestJS CLI config |
| `apps/server/tsconfig.json` | ✅ Exists | Extends root tsconfig |
| `apps/server/src/main.ts` | ✅ Exists | Bootstrap: NestFactory, CORS, Swagger, global filters/interceptors |
| `apps/server/src/app.module.ts` | ✅ Exists | Root module: imports all feature modules |
| `apps/server/src/app.controller.ts` | ✅ Exists | Protocol info endpoint with Swagger decorators |
| `apps/server/src/config/configuration.ts` | ✅ Exists | Typed config accessor |
| `apps/server/src/config/validation.ts` | ✅ Exists | Env var validation schema |
| `apps/server/src/auth/auth.module.ts` | ✅ Exists | Imports IdentityModule, JwtModule, AgentEntity |
| `apps/server/src/auth/auth.controller.ts` | ✅ Exists | WebAuthn + agent auth endpoints with Swagger |
| `apps/server/src/auth/auth.service.ts` | ⚠️ Stub | Real Ed25519 agent auth; InMemoryChallengeStore (needs Redis) |
| `apps/server/src/auth/dto/` | ✅ Exists | Login-begin, login-finish, register-begin, register-finish, refresh, agent-auth DTOs |
| `apps/server/src/identity/identity.module.ts` | ✅ Exists | Agent identity module |
| `apps/server/src/identity/agent.controller.ts` | ✅ Exists | Agent CRUD with Swagger decorators |
| `apps/server/src/identity/agent.service.ts` | ✅ Exists | Agent creation with suffix enforcement, owner validation |
| `apps/server/src/identity/dto/` | ✅ Exists | Create-agent, update-agent DTOs |
| `apps/server/src/messaging/messaging.module.ts` | ✅ Exists | Rooms + messages module |
| `apps/server/src/messaging/room.controller.ts` | ✅ Exists | Room CRUD endpoints with Swagger |
| `apps/server/src/messaging/room.service.ts` | ✅ Exists | Room management with MAX_ROOM_MEMBERS validation |
| `apps/server/src/messaging/message.controller.ts` | ✅ Exists | Message CRUD endpoints with Swagger |
| `apps/server/src/messaging/message.service.ts` | ⚠️ Stub | Not wired to OpenIM for real delivery |
| `apps/server/src/messaging/dto/` | ✅ Exists | Create-room, send-message DTOs |
| `apps/server/src/mcp/mcp.module.ts` | ✅ Exists | MCP module wiring GatewayService |
| `apps/server/src/mcp/mcp.controller.ts` | ✅ Exists | Tool listing, invocation, server registration |
| `apps/server/src/mcp/mcp.service.ts` | ⚠️ Stub | Delegates to GatewayService (tool handlers are stubs) |
| `apps/server/src/mcp/dto/` | ✅ Exists | Invoke-tool, register-server DTOs |
| `apps/server/src/a2a/a2a.controller.ts` | ✅ Exists | A2A task CRUD with Swagger |
| `apps/server/src/a2a/a2a.service.ts` | ⚠️ Stub | Delegates to A2ARouterService (in-memory) |
| `apps/server/src/a2a/dto/` | ✅ Exists | Create-task, a2a-message, json-rpc-request DTOs |
| `apps/server/src/health/health.controller.ts` | ✅ Exists | Real DB connectivity check via TypeORM |
| `apps/server/src/health/health.module.ts` | ✅ Exists | Health module with TypeORM UserEntity |
| `apps/server/src/gateway/events.gateway.ts` | ✅ Exists | WebSocket gateway |
| `apps/server/src/database/database.module.ts` | ✅ Exists | TypeORM config with synchronize: true |
| `apps/server/src/database/entities/` | ✅ Exists | User, Agent, Room, Message, AuditLog, A2ATask, MCPCall entities |
| `apps/server/src/common/decorators/current-user.decorator.ts` | ✅ Exists | Parameter decorator for authenticated identity |
| `apps/server/src/common/decorators/permissions.decorator.ts` | ✅ Exists | Permission requirement decorator |
| `apps/server/src/common/interceptors/audit.interceptor.ts` | ⚠️ Stub | Audit interceptor (in-memory logging) |
| `apps/server/src/common/interceptors/transform.interceptor.ts` | ✅ Exists | Response wrapping with { data, meta } |
| `apps/server/src/common/middleware/rate-limiter.middleware.ts` | ⚠️ Stub | In-memory rate limiting (needs Redis) |
| `apps/server/src/common/filters/http-exception.filter.ts` | ✅ Exists | Consistent error response format |
| `apps/server/src/common/guards/jwt-auth.guard.ts` | ✅ Exists | JWT validation guard |
| `apps/server/src/common/guards/rbac.guard.ts` | ✅ Exists | Role-based access control guard |
| `apps/server/src/common/index.ts` | ✅ Exists | Barrel export for common utilities |

---

## packages/ — Shared Library Packages

### packages/shared/ — Core Types and Utilities (`@kalen/shared`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/shared/package.json` | ✅ Exists | @kalen/shared package manifest |
| `packages/shared/tsconfig.json` | ✅ Exists | Extends root tsconfig |
| `packages/shared/jest.config.ts` | ✅ Exists | Jest config for shared package |
| `packages/shared/src/index.ts` | ✅ Exists | Barrel export for all shared modules |
| `packages/shared/src/types/identity.ts` | ✅ Exists | HumanIdentity, AgentIdentity, EntityType, Ed25519PublicKey types |
| `packages/shared/src/types/messaging.ts` | ✅ Exists | Room, Message, RoomType, MessageType types |
| `packages/shared/src/types/mcp.ts` | ✅ Exists | MCPTool, MCPResource, MCPServerInfo, MCPToolCall types |
| `packages/shared/src/types/a2a.ts` | ✅ Exists | A2ATask, A2AAgentCard, TaskStatus, A2AMessage types |
| `packages/shared/src/types/events.ts` | ✅ Exists | WebSocket event type definitions |
| `packages/shared/src/utils/constants.ts` | ✅ Exists | AGENT_SUFFIX, TaskStatus, VALID_TRANSITIONS, MAX_ROOM_MEMBERS |
| `packages/shared/src/utils/validation.ts` | ✅ Exists | validateAgentName, validateEmail, validatePublicKey (bug fixed), validateMCPToolSchema |
| `packages/shared/src/__tests__/validation.spec.ts` | ✅ Exists | 81 validation tests |
| `packages/shared/src/__tests__/constants-and-types.spec.ts` | ✅ Exists | Constants, enums, type guard tests |

### packages/identity/ — WebAuthn + Agent Identity (`@kalen/identity`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/identity/package.json` | ✅ Exists | @kalen/identity with @noble/ed25519, @simplewebauthn/server |
| `packages/identity/tsconfig.json` | ✅ Exists | Extends root tsconfig |
| `packages/identity/jest.config.ts` | ✅ Exists | Jest config for identity package |
| `packages/identity/src/index.ts` | ✅ Exists | Barrel export |
| `packages/identity/src/agent-identity/creation.ts` | ✅ Exists | **Real** Ed25519Signer using @noble/ed25519 (generate, sign, verify, fromPrivateKey) |
| `packages/identity/src/agent-identity/manifest.ts` | ✅ Exists | createManifest, validateManifest, signManifest, verifyManifestSignature |
| `packages/identity/src/agent-identity/verification.ts` | ✅ Exists | verifyAgentToken, checkSuffixEnforcement, verifyAgentIdentity |
| `packages/identity/src/webauthn/registration.ts` | ✅ Exists | generateRegistrationOptions, verifyRegistrationResponse |
| `packages/identity/src/webauthn/authentication.ts` | ✅ Exists | generateAuthenticationOptions, verifyAuthenticationResponse |
| `packages/identity/src/webauthn/challenge-store.ts` | ✅ Exists | ChallengeStore interface + InMemoryChallengeStore |
| `packages/identity/src/token/jwt.ts` | ✅ Exists | createToken, issue/verify human/agent tokens, decodeToken, refreshTokens |
| `packages/identity/src/rbac/roles.ts` | ✅ Exists | Role, Permission enums, rolePermissions mapping |
| `packages/identity/src/rbac/permission-check.ts` | ✅ Exists | checkPermission, checkPermissions, hasAnyPermission, checkScope, evaluateAccess |
| `packages/identity/src/__tests__/creation.spec.ts` | ✅ Exists | 17 tests: Ed25519Signer generate, sign, verify, fromPrivateKey, tampered messages |
| `packages/identity/src/__tests__/manifest.spec.ts` | ✅ Exists | 19 tests: manifest create, validate, sign, verify, tampered content |
| `packages/identity/src/__tests__/verification.spec.ts` | ✅ Exists | 12 tests: verifyAgentToken, checkSuffix, expired tokens, multiple errors |
| `packages/identity/src/__tests__/jwt.spec.ts` | ✅ Exists | 27 tests: createToken, issue/verify tokens, decode, refresh |
| `packages/identity/src/__tests__/rbac.spec.ts` | ✅ Exists | 28 tests: roles, permissions, checkPermission, evaluateAccess |
| `packages/identity/src/__tests__/webauthn.spec.ts` | ✅ Exists | 16 tests: registration, authentication, ChallengeStore (mocked) |
| `packages/identity/src/__mocks__/@simplewebauthn/server.ts` | ✅ Exists | Manual mock for @simplewebauthn/server |

### packages/mcp-gateway/ — MCP Protocol Integration (`@kalen/mcp-gateway`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/mcp-gateway/package.json` | ✅ Exists | @kalen/mcp-gateway package manifest |
| `packages/mcp-gateway/tsconfig.json` | ✅ Exists | Extends root tsconfig |
| `packages/mcp-gateway/jest.config.ts` | ✅ Exists | Jest config for mcp-gateway package |
| `packages/mcp-gateway/src/index.ts` | ✅ Exists | Barrel export |
| `packages/mcp-gateway/src/server/mcp-server.ts` | ✅ Exists | MCPServer: built-in tools/resources, registerTool, callTool, readResource |
| `packages/mcp-gateway/src/client/mcp-client.ts` | ✅ Exists | MCPClient: connect to MCP servers via SSE transport |
| `packages/mcp-gateway/src/gateway/gateway-service.ts` | ✅ Exists | GatewayService: RBAC, allowlist, concurrent limits, audit, health, shutdown |
| `packages/mcp-gateway/src/governance/allowlist.ts` | ✅ Exists | AllowList: permissive/restrictive modes, global deny list, evaluation |
| `packages/mcp-gateway/src/__tests__/mcp-server.spec.ts` | ✅ Exists | 18 tests: MCPServer tools, resources, callTool, errors |
| `packages/mcp-gateway/src/__tests__/gateway-service.spec.ts` | ✅ Exists | 28 tests: RBAC, allowlist, concurrent limits, audit, health |
| `packages/mcp-gateway/src/__tests__/allowlist.spec.ts` | ✅ Exists | 25 tests: permissive/restrictive modes, global deny, evaluation |

### packages/a2a-router/ — A2A Protocol Integration (`@kalen/a2a-router`)

| Path | Status | Purpose |
|------|--------|---------|
| `packages/a2a-router/package.json` | ✅ Exists | @kalen/a2a-router package manifest |
| `packages/a2a-router/tsconfig.json` | ✅ Exists | Extends root tsconfig |
| `packages/a2a-router/jest.config.ts` | ✅ Exists | Jest config for a2a-router package |
| `packages/a2a-router/src/index.ts` | ✅ Exists | Barrel export |
| `packages/a2a-router/src/router/a2a-router-service.ts` | ✅ Exists | A2ARouterService: createTask, delegateTask, cancelTask, transitionTask |
| `packages/a2a-router/src/agent-card/agent-card-service.ts` | ✅ Exists | AgentCardService: register, validate, update, list, serveWellKnown |
| `packages/a2a-router/src/task/task-lifecycle.ts` | ✅ Exists | TaskLifecycle: state machine with validated transitions |
| `packages/a2a-router/src/security/card-signer.ts` | ✅ Exists | **Real** Ed25519 card signing via @kalen/identity (signAgentCard, verifyAgentCardSignature) |
| `packages/a2a-router/src/__tests__/task-lifecycle.spec.ts` | ✅ Exists | 23 tests: valid/invalid transitions, full lifecycle, addArtifact |
| `packages/a2a-router/src/__tests__/agent-card-service.spec.ts` | ✅ Exists | 19 tests: register, validate, update, list, unregister, well-known |
| `packages/a2a-router/src/__tests__/a2a-router-service.spec.ts` | ✅ Exists | 17 tests: createTask, delegateTask, cancelTask, transitionTask |
| `packages/a2a-router/src/__tests__/card-signer.spec.ts` | ✅ Exists | 13 tests: sign, verify, round-trip, tamper detection |

---

## infra/ — Infrastructure Configurations

### infra/docker/ — Docker Configurations

| Path | Status | Purpose |
|------|--------|---------|
| `infra/docker/docker-compose.yml` | ✅ Exists | Local dev stack: 11 services with healthchecks and volumes |
| `infra/docker/traefik/traefik.yml` | ✅ Exists | Traefik static config |
| `infra/docker/livekit/livekit.yaml` | ✅ Exists | LiveKit config: dev API keys, room auto-creation |
| `infra/docker/postgres/init.sql` | ✅ Exists | PostgreSQL init: uuid-ossp and pgvector extensions |
| `infra/docker/monitoring/prometheus/prometheus.yml` | ✅ Exists | Scrape configs for kalen-server, LiveKit, NATS |
| `infra/docker/monitoring/grafana/datasources.yml` | ✅ Exists | Prometheus + Loki datasource provisioning |
| `infra/docker/monitoring/grafana/dashboard-providers.yml` | ✅ Exists | File-based dashboard provider config |
| `infra/docker/docker-compose.prod.yml` | 📋 Planned | Production overrides |
| `infra/docker/docker-compose.test.yml` | 📋 Planned | Test environment |

### infra/scripts/ — Setup and Utility Scripts

| Path | Status | Purpose |
|------|--------|---------|
| `infra/scripts/setup-local.sh` | ✅ Exists | One-command dev bootstrap |

### infra/k8s/ — Kubernetes Manifests

| Path | Status | Purpose |
|------|--------|---------|
| `infra/k8s/` | 📋 Planned | Kustomize-based Kubernetes manifests (structure defined in docs) |

---

## .github/ — GitHub Configuration

| Path | Status | Purpose |
|------|--------|---------|
| `.github/` | 📋 Planned | CI/CD workflows, issue templates, CODEOWNERS |

---

## docs/ — Documentation

| Path | Status | Purpose |
|------|--------|---------|
| `docs/PRD.md` | ✅ Exists | Product Requirements Document |
| `docs/design.md` | ✅ Exists | System Design Document |
| `docs/architecture.md` | ✅ Exists | Architecture Decision Records (ADRs) |
| `docs/CHANGELOG.md` | ✅ Exists | Keep a Changelog format version history |
| `docs/structure.md` | ✅ Exists | This file — detailed project structure with existence status |
| `docs/todo.md` | ✅ Exists | Phased TODO list with progress percentages |
| `docs/CONTRIBUTING.md` | ✅ Exists | Contribution guidelines |
| `docs/SECURITY.md` | ✅ Exists | Security policy |
| `docs/API.md` | ✅ Exists | API documentation (planned endpoints) |
| `docs/DEPLOYMENT.md` | ✅ Exists | Deployment documentation |

---

## Summary Statistics

| Category | Exists | Stub | Planned | Total |
|----------|--------|------|---------|-------|
| Root config files | 10 | 0 | 0 | 10 |
| apps/web files | ~42 | 1 | ~10 | ~53 |
| apps/server files | ~50 | 5 | 0 | ~55 |
| packages/shared files | 8 | 0 | 0 | 8 |
| packages/identity files | 19 | 0 | 0 | 19 |
| packages/mcp-gateway files | 8 | 0 | 0 | 8 |
| packages/a2a-router files | 9 | 0 | 0 | 9 |
| infra/docker files | 7 | 0 | ~15 | ~22 |
| infra/k8s files | 0 | 0 | ~25 | ~25 |
| .github files | 0 | 0 | ~12 | ~12 |
| docs files | 10 | 0 | 0 | 10 |
| **Total** | **~163** | **~6** | **~62** | **~231** |

**As of 2026-06-10, approximately 70% of the planned file structure exists.** Of existing files, ~4% are stubs that need real implementation (mainly in-memory stores that need Redis/PostgreSQL, and simulated API client data). The remaining ~27% of planned files are primarily: Kubernetes manifests, production Docker configs, CI/CD workflows, and some additional web pages (admin, calls, channels).
