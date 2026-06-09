# Changelog

All notable changes to KALEN will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0-alpha.1] - 2026-06-10

> **Note:** This is a significant pre-alpha release. Core library packages now have real implementations
> with comprehensive tests. Two applications (API server and web client) now exist. However, the system
> is not yet functional end-to-end — persistence is still in-memory, and external service integrations
> (OpenIM, LiveKit) are stubs.

### Added

- **`@kalen/shared` package** — Fully implemented with: core types (identity, messaging, MCP, A2A, events), validation utilities (`validateAgentName`, `validateEmail`, `validatePublicKey`, `validateMCPToolSchema`), constants (`AGENT_SUFFIX`, `TaskStatus`, `VALID_TRANSITIONS`, `MAX_ROOM_MEMBERS`), type guards (`isHumanIdentity`, `isAgentIdentity`)
- **`@kalen/identity` package** — Fully implemented with: real Ed25519 signing via `@noble/ed25519` (`Ed25519Signer.generate()`, `sign()`, `verify()`, `fromPrivateKey()`), WebAuthn helpers (`generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`), JWT token management (`createToken`, `issueHumanAccessToken`, `issueAgentAccessToken`, `verifyToken`, `refreshTokens`), RBAC system (`Role`, `Permission`, `checkPermission`, `evaluateAccess`, `checkScope`), manifest signing and verification (`createManifest`, `validateManifest`, `signManifest`, `verifyManifestSignature`), agent identity verification (`verifyAgentToken`, `checkSuffixEnforcement`, `verifyAgentIdentity`)
- **`@kalen/mcp-gateway` package** — Fully implemented with: `MCPServer` (built-in tools/resources, registerTool, callTool), `MCPClient` (connect to MCP servers via SSE transport), `GatewayService` (RBAC enforcement, allowlist enforcement, concurrent limits, audit logging, health check, shutdown), `AllowList` (permissive/restrictive modes, global deny list, evaluation order)
- **`@kalen/a2a-router` package** — Fully implemented with: `A2ARouterService` (createTask, delegateTask, cancelTask, transitionTask, task limits, agent discovery), `AgentCardService` (registerCard, validateAgentCard, updateCard, listCards, serveWellKnown), `TaskLifecycle` (state machine with validated transitions, full lifecycle chains, addArtifact, addMessage), `signAgentCard` / `verifyAgentCardSignature` (real Ed25519 card signing using `@kalen/identity`)
- **`@kalen/server` NestJS application** (`apps/server/`) — Full NestJS server with: auth module (WebAuthn registration/authentication, Ed25519 agent auth, JWT tokens), identity module (agent CRUD with suffix enforcement), messaging module (rooms and messages with TypeORM entities), MCP module (tool listing, invocation, server registration), A2A module (task CRUD, agent discovery), health module (database connectivity check), common utilities (CurrentUser decorator, TransformInterceptor, RateLimiterMiddleware, HttpExceptionFilter, JWT/RBAC guards), TypeORM entities (User, Agent, Room, Message, AuditLog, A2ATask, MCPCall), Swagger API docs
- **`@kalen/web` Next.js application** (`apps/web/`) — Next.js 15 web client with 10 pages: landing page, login (WebAuthn passkey), registration (WebAuthn passkey), chat room list, chat room view, agent directory, agent profile, settings, MCP tools browser; 17 components: app-shell, sidebar, header, mobile-nav, room-list, message-list, message-bubble, message-input, typing-indicator, presence-badge, passkey-register, passkey-login, agent-card, agent-directory, identity-badge, tool-browser, tool-invocation; supporting lib (api-client, socket, auth-context, types), hooks (use-auth, use-socket, use-rooms)
- **379 unit tests** across 15 test suites: `@kalen/shared` (2 suites, 81 tests), `@kalen/identity` (6 suites, 127 tests), `@kalen/mcp-gateway` (3 suites, 71 tests), `@kalen/a2a-router` (4 suites, 100 tests) — all passing
- **Jest test infrastructure** — jest.config.ts for root (multi-project) and each package, ESM module transform support, manual mock for `@simplewebauthn/server`

### Changed

- **Ed25519 cryptography is now REAL** — Replaced fake `simpleHash()` implementation with `@noble/ed25519` v3.1.0 for actual cryptographic signing and verification. SHA-512 provided by Node.js built-in `crypto.createHash('sha512')`. Affects `packages/identity/src/agent-identity/creation.ts` and `packages/a2a-router/src/security/card-signer.ts`
- **ADR-006 revised** — Backend is now TypeScript (NestJS), not Go. The original ADR specified Go for backend services, but implementation proceeded with TypeScript for pragmatic reasons (shared types, faster iteration, unified language across packages and apps)
- **`@kalen/identity` package now depends on `@noble/ed25519`** — Added `@noble/ed25519@^3.1.0` as a dependency
- **`@kalen/a2a-router` card-signer now uses `@kalen/identity`** — `signAgentCard()` and `verifyAgentCardSignature()` use `Ed25519Signer` from `@kalen/identity` instead of local `simpleHash()`

### Deprecated

- Nothing yet.

### Removed

- **`simpleHash()` function** — Removed from both `packages/identity/src/agent-identity/creation.ts` and `packages/a2a-router/src/security/card-signer.ts`. This fake hash function was insecure and has been replaced by real Ed25519 cryptography.

### Fixed

- **`validatePublicKey()` base64url length calculation** — Changed `Math.ceil` to `Math.floor` in `packages/shared/src/utils/validation.ts`. A 43-character base64url string (32-byte Ed25519 public key) was incorrectly calculated as 33 bytes, causing valid public keys to be rejected.
- **`Ed25519Signer.verify()` previously always returned true** — Fixed with real Ed25519 verification that actually validates signatures cryptographically
- **Agent and human keypairs were independently random** — Fixed so that `Ed25519Signer.generate()` derives the public key cryptographically from the private key using `ed.getPublicKey()`

### Security

- **Ed25519 signing is now cryptographically real** — Uses `@noble/ed25519` for actual Ed25519 signatures. Previously, `simpleHash()` produced deterministic but non-cryptographic hashes, and `verify()` always returned `true`. This was a critical security vulnerability that is now fixed.
- **WebAuthn helper functions are implemented** — `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse` use `@simplewebauthn/server`
- **JWT token issuance and verification is implemented** — Human and agent tokens with entity type embedding, refresh token support
- **RBAC system is implemented** — Role/Permission enums, rolePermissions mapping, checkPermission, evaluateAccess, checkScope with deny-first logic
- **Remaining security gaps:**
  - Challenge store is in-memory (needs Redis backing)
  - Rate limiting is in-memory only (needs Redis for production)
  - MCP tool output sanitization not yet implemented
  - OAuth 2.1 / PKCE for A2A not yet implemented
  - Audit logging is in-memory (needs PostgreSQL persistence)
  - Data encryption at rest not yet implemented

---

## [0.1.0-alpha.1] - 2026-06-09

> **Note:** This is an initial scaffold release. There is no running application code.
> The items listed below represent infrastructure, configuration, and documentation
> that have been created. No features are functional yet.

### Added

- **Monorepo scaffold** — pnpm workspace with Turborepo orchestration (`pnpm-workspace.yaml`, `turbo.json`)
- **Root package.json** — Project metadata, scripts (`dev`, `build`, `lint`, `test`, `infra:up`, `infra:down`), dev dependencies (ESLint, Prettier, Husky, commitlint, TypeScript 5.7)
- **TypeScript configuration** — Strict mode, ES2022 target, `@kalen/*` path aliases for `packages/shared`, `packages/identity`, `packages/mcp-gateway`, `packages/a2a-router`
- **Environment template** — Comprehensive `.env.example` with 50+ variables covering: WebAuthn RP config, JWT, PostgreSQL, Redis, NATS, MinIO, Elasticsearch, LiveKit, coturn, Traefik, OpenIM, MCP Gateway, A2A Router, Agent Identity, LLM/AI, and Monitoring
- **Git configuration** — `.gitignore` excluding node_modules, build outputs, .env files, secrets (*.pem, *.key), Docker volumes, IDE files, logs, Turbo cache
- **Docker Compose local development stack** — 11 services: Traefik v3 (API gateway), PostgreSQL 16 + pgvector, Redis 7, NATS (JetStream), MinIO (S3-compatible), Elasticsearch 8, LiveKit (WebRTC SFU), coturn (TURN), Prometheus, Grafana, Loki
- **PostgreSQL init script** — `uuid-ossp` and `vector` (pgvector) extension provisioning
- **LiveKit configuration** — Dev API keys, room auto-creation, max 50 participants
- **Traefik static configuration** — HTTP/HTTPS entrypoints, Docker provider, debug logging
- **Prometheus scrape config** — Targets for kalen-server, LiveKit, NATS, postgres-exporter
- **Grafana provisioning** — Prometheus + Loki datasources, file-based dashboard provider
- **Local setup script** — `infra/scripts/setup-local.sh` for one-command dev bootstrap (copy .env, install deps, start Docker, wait for PostgreSQL, run migrations)
- **README.md** — Comprehensive project overview with: vision, architecture, protocol integration (OpenIM, WebAuthn, MCP, A2A), dual identity model, honest project status table, tech stack, quick start guide, project structure, development commands, testing strategy, deployment overview, contributing guidelines, security policy, license (AGPL-3.0), acknowledgments
- **PROJECT_STRUCTURE.md** — Complete directory tree with file-level descriptions covering: apps/web (Next.js), apps/server (NestJS), packages/shared, packages/identity, packages/mcp-gateway, packages/a2a-router, infra/docker, infra/k8s, .github, .husky, .vscode
- **docs/PRD.md** — Product Requirements Document with: vision, problem statement, target users, user stories, functional requirements (Identity, Messaging, AI Agent, MCP Gateway, A2A Router, Data layers), non-functional requirements (performance, scalability, reliability, security, observability), protocol integration requirements, security requirements, MVP scope, roadmap, success metrics, risks and mitigations
- **docs/design.md** — System Design Document with: design philosophy, five-layer architecture overview, identity model (human WebAuthn + agent Ed25519 + suffix enforcement), messaging architecture (OpenIM integration, room types, message flow, enrichment), MCP integration (gateway pattern, tool discovery, lifecycle, invocation), A2A integration (router pattern, agent cards, task lifecycle), security design, data architecture, scalability design, deployment design, monitoring design
- **docs/architecture.md** — Architecture Decision Records (ADRs): ADR-001 (Monorepo), ADR-002 (OpenIM over Matrix), ADR-003 (WebAuthn over OAuth2), ADR-004 (MCP for tool integration), ADR-005 (A2A for agent coordination), ADR-006 (Go backend + TypeScript frontend), ADR-007 (PostgreSQL + pgvector), ADR-008 (NATS JetStream), ADR-009 (Ed25519 for agent auth), ADR-010 (JWT convergence)

### Changed

- Nothing yet — this is the first release.

### Deprecated

- Nothing yet — this is the first release.

### Removed

- Nothing yet — this is the first release.

### Fixed

- Nothing yet — this is the first release.

### Security

- **No security features are implemented yet.** The following are designed but not running:
  - WebAuthn/FIDO2 authentication for humans
  - Ed25519 keypair authentication for agents
  - JWT token issuance and validation
  - Per-agent RBAC with deny-first policy engine
  - MCP tool allowlists and output sanitization
  - A2A agent card signing and verification
  - Audit logging
  - TLS termination at Traefik
- **Default credentials in Docker Compose are for development only.** Do not use `kalen_dev` passwords in any environment that is not local development.
- **The `.env.example` template contains placeholder values.** All secret fields (JWT_SECRET, POSTGRES_PASSWORD, etc.) must be filled with cryptographically random values before any deployment.

---

## Release Notes Format

Each subsequent release will follow this structure:

- **Added** — New features, modules, endpoints, configurations
- **Changed** — Changes to existing functionality, API changes, dependency upgrades
- **Deprecated** — Features that will be removed in a future release
- **Removed** — Features removed in this release
- **Fixed** — Bug fixes, correctness improvements
- **Security** — Security-relevant changes, vulnerability fixes, security advisories

[0.2.0-alpha.1]: https://github.com/mulkymalikuldhr/kalen/releases/tag/v0.2.0-alpha.1
[0.1.0-alpha.1]: https://github.com/mulkymalikuldhr/kalen/releases/tag/v0.1.0-alpha.1
