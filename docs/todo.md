# KALEN — Development TODO

> **Status**: Pre-Alpha. No production code deployed. This document tracks honest progress.

**Last Updated**: 2026-06-09

---

## Phase 0: Project Setup ✅ (Current)

- [x] Initialize monorepo (pnpm workspaces + Turborepo)
- [x] Configure TypeScript strict mode across all packages
- [x] Create `@kalen/shared` types and utilities package
- [x] Create `@kalen/identity` package structure
- [x] Create `@kalen/mcp-gateway` package structure
- [x] Create `@kalen/a2a-router` package structure
- [x] Docker Compose for local development (14 services)
- [x] Traefik API gateway configuration
- [x] PostgreSQL + pgvector initialization
- [x] Redis, NATS, MinIO, Elasticsearch configs
- [x] Prometheus + Grafana monitoring stack
- [x] LiveKit WebRTC SFU configuration
- [x] `.env.example` with all required variables
- [x] `.gitignore` for Node.js, Go, secrets, certs
- [x] LICENSE (AGPL-3.0)
- [x] Comprehensive documentation (README, PRD, design, architecture, API, deployment, security, contributing, structure, changelog)

### Known Issues in Phase 0

- **Ed25519 signing**: Current implementation uses deterministic hash-based approach. Must replace with `@noble/ed25519` or `crypto.sign()` for real Ed25519 signatures.
- **MCP tool handlers**: Built-in tools return structured responses but are not wired to actual services yet.
- **A2A task storage**: In-memory only. Needs PostgreSQL persistence.
- **SSE transport**: Uses browser EventSource. Server-side needs `eventsource` npm package.
- **No test files**: Zero test coverage. Must be addressed in Phase 1.

---

## Phase 1: Identity Service (MVP Foundation)

- [ ] Replace hash-based signing with real Ed25519 (`@noble/ed25519`)
- [ ] Implement WebAuthn registration end-to-end test with real browser
- [ ] Implement WebAuthn authentication end-to-end test with real browser
- [ ] Wire ChallengeStore to real Redis connection
- [ ] Create PostgreSQL schema for credentials and identities
- [ ] Implement credential storage service (TypeORM + PostgreSQL)
- [ ] Build REST API endpoints for identity operations:
  - [ ] `POST /api/v1/identity/register` — Human registration with passkey
  - [ ] `POST /api/v1/identity/authenticate` — Human authentication
  - [ ] `POST /api/v1/identity/agent/create` — Agent identity creation
  - [ ] `GET /api/v1/identity/agent/:id` — Agent identity retrieval
  - [ ] `POST /api/v1/identity/agent/:id/verify` — Agent token verification
- [ ] Implement RBAC middleware for API routes
- [ ] Write unit tests for identity package (>80% coverage target)
- [ ] Write integration tests for WebAuthn flow
- [ ] Security audit: verify no private keys stored server-side
- [ ] Security audit: verify suffix enforcement is unbreakable

**Estimated Duration**: 4-6 weeks
**Success Criteria**: A human can register with a passkey, an agent can be created with `(ai)` suffix, tokens are issued and verified correctly.

---

## Phase 2: Messaging Integration (OpenIM)

- [ ] Set up OpenIM Server in Docker Compose
- [ ] Implement OpenIM auth hook (delegate to KALEN identity service)
- [ ] Implement OpenIM callback/webhook handlers
- [ ] Create conversation service:
  - [ ] Direct message rooms (human-human, human-agent)
  - [ ] Group rooms with membership management
  - [ ] Agent workspace rooms
  - [ ] System notification rooms
- [ ] Implement message enrichment pipeline (KALEN envelope)
- [ ] Add presence service (online/offline/busy)
- [ ] Add typing indicators
- [ ] Implement message search with Elasticsearch
- [ ] Write unit tests for messaging module
- [ ] Write integration tests with real OpenIM instance
- [ ] Load test: verify <200ms p95 messaging latency

**Estimated Duration**: 4-6 weeks
**Success Criteria**: Two users can exchange messages, an agent can participate in a room, messages are searchable.

---

## Phase 3: MCP Gateway (Agent-Tool Integration)

- [ ] Replace EventSource with server-compatible SSE client
- [ ] Implement stdio transport for MCP client
- [ ] Wire MCP tool handlers to actual KALEN services
- [ ] Implement tool discovery with catalog merging from multiple MCP servers
- [ ] Build MCP Gateway REST API:
  - [ ] `GET /api/v1/mcp/tools` — List all available tools
  - [ ] `POST /api/v1/mcp/tools/:name/invoke` — Invoke a tool
  - [ ] `GET /api/v1/mcp/resources` — List available resources
  - [ ] `POST /api/v1/mcp/servers` — Register new MCP server
- [ ] Implement allowlist/denylist governance UI
- [ ] Add audit logging for all tool invocations (PostgreSQL)
- [ ] Write unit tests for MCP gateway
- [ ] Integration test: connect to a real MCP server, list tools, invoke tool
- [ ] Security: implement tool output sanitization (strip prompt injection)

**Estimated Duration**: 3-4 weeks
**Success Criteria**: An agent can discover and invoke tools through the gateway, invocations are audited and governed by allowlist.

---

## Phase 4: A2A Router (Agent-Agent Communication)

- [ ] Replace in-memory task storage with PostgreSQL
- [ ] Implement agent card `.well-known/agent.json` endpoint
- [ ] Build A2A Router REST API:
  - [ ] `GET /api/v1/a2a/agents/:id/card` — Get agent card
  - [ ] `POST /api/v1/a2a/tasks` — Create task
  - [ ] `GET /api/v1/a2a/tasks/:id` — Get task status
  - [ ] `POST /api/v1/a2a/tasks/:id/cancel` — Cancel task
  - [ ] `POST /api/v1/a2a/tasks/:id/message` — Send message to task
- [ ] Implement task lifecycle with validated state transitions
- [ ] Implement artifact storage with MinIO presigned URLs
- [ ] Implement remote agent discovery with caching and retry
- [ ] Add OAuth 2.1 / PKCE for A2A authentication
- [ ] Write unit tests for A2A router
- [ ] Integration test: two agents negotiate and complete a task
- [ ] Security: verify card signatures, validate all inputs

**Estimated Duration**: 3-4 weeks
**Success Criteria**: Two agents can discover each other, create a task, exchange messages, and produce artifacts.

---

## Phase 5: Web Client (Next.js)

- [ ] Scaffold Next.js 14 app with App Router
- [ ] Implement login/registration page with WebAuthn
- [ ] Implement chat interface (rooms, messages, presence)
- [ ] Implement agent management dashboard
- [ ] Implement MCP tool browser
- [ ] Implement A2A task monitor
- [ ] Implement admin panel (RBAC, allowlist, audit logs)
- [ ] Implement real-time updates via WebSocket
- [ ] Implement audio/video calls via LiveKit SDK
- [ ] Responsive design (mobile-first)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] E2E tests with Playwright

**Estimated Duration**: 6-8 weeks
**Success Criteria**: A user can log in with a passkey, chat with humans and agents, manage tools, and monitor agent tasks from a browser.

---

## Phase 6: Testing & Hardening

- [ ] Achieve >80% unit test coverage across all packages
- [ ] Integration test suite with real services (Docker Compose)
- [ ] Load testing: verify 10,000 concurrent WebSocket connections
- [ ] Load testing: verify <200ms p95 messaging latency
- [ ] Security penetration testing
- [ ] Dependency audit (npm audit, Snyk)
- [ ] Rate limiting implementation across all API endpoints
- [ ] Implement mTLS for inter-service communication
- [ ] Implement E2EE for messaging (Olm/Megolm via Matrix)
- [ ] Chaos engineering: test service failures, network partitions
- [ ] Performance profiling and optimization
- [ ] Documentation review and accuracy audit

**Estimated Duration**: 4-6 weeks
**Success Criteria**: All performance targets met, no critical security vulnerabilities, comprehensive test coverage.

---

## Phase 7: Production Deployment

- [ ] Kubernetes manifests for all services
- [ ] Kustomize overlays for staging and production
- [ ] Helm chart for one-command deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated database migrations
- [ ] Backup and disaster recovery procedures
- [ ] Monitoring dashboards (Grafana)
- [ ] Alerting rules (Prometheus AlertManager)
- [ ] Log aggregation (Loki)
- [ ] Distributed tracing (Tempo)
- [ ] SSL/TLS certificate management (cert-manager)
- [ ] Secret management (Vault or Sealed Secrets)
- [ ] Production runbook documentation
- [ ] On-call rotation setup

**Estimated Duration**: 4-6 weeks
**Success Criteria**: KALEN can be deployed to a Kubernetes cluster with a single command, all services are healthy, monitoring is active.

---

## Deferred (Explicitly Out of MVP)

- Mobile apps (React Native / Flutter)
- Desktop app (Tauri / Electron)
- Matrix federation (bridging to other Matrix homeservers)
- Custom LLM integration (bring-your-own-model)
- Marketplace for agent templates
- Billing and subscription management
- Multi-tenant organization isolation
- Agent Society paradigm (theoretical — requires empirical validation)
- Blockchain/Web3 features
- Social features (feeds, stories, reactions)
- Voice transcription and translation
