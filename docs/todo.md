# KALEN — Development TODO

> **Status**: Pre-Alpha. Core library packages implemented with 379 tests. Applications exist but not yet end-to-end functional. This document tracks honest progress.

**Last Updated**: 2026-06-10

---

## Phase 0: Project Setup ✅ (Complete)

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

### Completed in Subsequent Tasks

- [x] Replace hash-based signing with real Ed25519 (`@noble/ed25519`) — **Task 1**
- [x] Write unit tests for all 4 library packages — **Task 5** (379 tests passing)
- [x] Fix `validatePublicKey()` base64url length bug (Math.ceil → Math.floor) — **Task 5**

### Known Issues (carried forward)

- **MCP tool handlers**: Built-in tools return structured responses but are not wired to actual services yet.
- **A2A task storage**: In-memory only. TypeORM entities defined but services use in-memory stores.
- **SSE transport**: Uses browser EventSource. Server-side needs `eventsource` npm package.
- **Challenge store**: In-memory only. Needs Redis backing.

---

## Phase 1: Identity Service (MVP Foundation) — ~60% Complete

- [x] Replace hash-based signing with real Ed25519 (`@noble/ed25519`)
- [x] Implement Ed25519 keypair generation, signing, and verification
- [x] Implement JWT token issuance and verification (human + agent)
- [x] Implement RBAC system (Role, Permission, checkPermission, evaluateAccess, checkScope)
- [x] Implement manifest signing and verification
- [x] Implement agent identity verification (verifyAgentToken, checkSuffixEnforcement)
- [x] Implement WebAuthn helper functions (generateRegistrationOptions, verifyRegistrationResponse, etc.)
- [x] Create NestJS server with auth, identity modules
- [x] Create Next.js web client with WebAuthn login/registration pages
- [x] Write unit tests for identity package (127 tests, 6 suites)
- [ ] Implement WebAuthn registration end-to-end test with real browser
- [ ] Implement WebAuthn authentication end-to-end test with real browser
- [ ] Wire ChallengeStore to real Redis connection
- [ ] Create PostgreSQL schema for credentials and identities (TypeORM entities exist, need migration)
- [ ] Implement credential storage service (TypeORM + PostgreSQL — entities defined, not yet used)
- [ ] Build REST API endpoints for identity operations (controllers exist, need real persistence):
  - [x] `POST /api/v1/auth/register-begin` — Controller exists, uses in-memory store
  - [x] `POST /api/v1/auth/register-finish` — Controller exists, uses in-memory store
  - [x] `POST /api/v1/auth/login-begin` — Controller exists, uses in-memory store
  - [x] `POST /api/v1/auth/login-finish` — Controller exists, uses in-memory store
  - [x] `POST /api/v1/auth/agent` — Controller exists, uses Ed25519Signer.verify()
  - [x] `POST /api/v1/identity/agent/create` — Controller exists with suffix enforcement
  - [ ] Wire all controllers to PostgreSQL-backed persistence
- [x] Implement RBAC middleware for API routes (guards exist)
- [x] Write unit tests for identity package (>80% coverage target — achieved)
- [ ] Write integration tests for WebAuthn flow (with real DB)
- [ ] Security audit: verify no private keys stored server-side
- [ ] Security audit: verify suffix enforcement is unbreakable

**Estimated Duration**: 4-6 weeks (2-3 weeks remaining)
**Success Criteria**: A human can register with a passkey, an agent can be created with `(ai)` suffix, tokens are issued and verified correctly. — *Partially met: library code works, but end-to-end with real persistence not yet functional.*

---

## Phase 2: Messaging Integration (OpenIM) — ~15% Complete

- [ ] Set up OpenIM Server in Docker Compose
- [ ] Implement OpenIM auth hook (delegate to KALEN identity service)
- [ ] Implement OpenIM callback/webhook handlers
- [x] Create NestJS messaging module with controllers and services (in-memory)
- [x] Create TypeORM entities for rooms and messages
- [x] Create Next.js chat interface with room list, message list, message input
- [ ] Wire messaging service to real message delivery (OpenIM):
  - [ ] Direct message rooms (human-human, human-agent)
  - [ ] Group rooms with membership management
  - [ ] Agent workspace rooms
  - [ ] System notification rooms
- [ ] Implement message enrichment pipeline (KALEN envelope)
- [ ] Add presence service (online/offline/busy)
- [ ] Add typing indicators (UI exists, needs real backend)
- [ ] Implement message search with Elasticsearch
- [ ] Write unit tests for messaging module
- [ ] Write integration tests with real OpenIM instance
- [ ] Load test: verify <200ms p95 messaging latency

**Estimated Duration**: 4-6 weeks
**Success Criteria**: Two users can exchange messages, an agent can participate in a room, messages are searchable.

---

## Phase 3: MCP Gateway (Agent-Tool Integration) — ~40% Complete

- [x] Implement MCP Server with built-in tools and resources
- [x] Implement MCP Client with SSE transport
- [x] Implement GatewayService with RBAC + allowlist governance
- [x] Implement AllowList (permissive/restrictive modes)
- [x] Create NestJS MCP module with controllers (list tools, invoke, register server)
- [x] Create Next.js MCP tools browser UI
- [x] Write unit tests for MCP gateway package (71 tests, 3 suites)
- [ ] Replace EventSource with server-compatible SSE client
- [ ] Implement stdio transport for MCP client
- [ ] Wire MCP tool handlers to actual KALEN services
- [ ] Implement tool discovery with catalog merging from multiple MCP servers
- [ ] Implement allowlist/denylist governance UI
- [ ] Add audit logging for all tool invocations (PostgreSQL — entity exists, not used)
- [ ] Integration test: connect to a real MCP server, list tools, invoke tool
- [ ] Security: implement tool output sanitization (strip prompt injection)

**Estimated Duration**: 3-4 weeks (2-3 weeks remaining)
**Success Criteria**: An agent can discover and invoke tools through the gateway, invocations are audited and governed by allowlist.

---

## Phase 4: A2A Router (Agent-Agent Communication) — ~45% Complete

- [x] Implement A2ARouterService with task CRUD and delegation
- [x] Implement AgentCardService with register, validate, update, list
- [x] Implement TaskLifecycle state machine with validated transitions
- [x] Implement Ed25519 Agent Card signing and verification
- [x] Create NestJS A2A module with controllers and DTOs
- [x] Write unit tests for A2A router package (100 tests, 4 suites)
- [ ] Replace in-memory task storage with PostgreSQL (entity exists, not used)
- [ ] Implement agent card `.well-known/agent.json` endpoint (service exists, needs route)
- [ ] Implement artifact storage with MinIO presigned URLs
- [ ] Implement remote agent discovery with caching and retry
- [ ] Add OAuth 2.1 / PKCE for A2A authentication
- [ ] Integration test: two agents negotiate and complete a task
- [ ] Security: verify card signatures, validate all inputs

**Estimated Duration**: 3-4 weeks (2-3 weeks remaining)
**Success Criteria**: Two agents can discover each other, create a task, exchange messages, and produce artifacts.

---

## Phase 5: Web Client (Next.js) — ~50% Complete

- [x] Scaffold Next.js 15 app with App Router
- [x] Implement login/registration page with WebAuthn UI
- [x] Implement chat interface (rooms, messages, presence) — UI exists, uses simulated data
- [x] Implement agent management dashboard — UI exists
- [x] Implement MCP tool browser — UI exists
- [x] Responsive design (mobile-first with mobile-nav)
- [ ] Implement A2A task monitor
- [ ] Implement admin panel (RBAC, allowlist, audit logs)
- [ ] Implement real-time updates via WebSocket (socket client exists, needs real server)
- [ ] Implement audio/video calls via LiveKit SDK
- [ ] Wire all components to real API backend (currently uses simulated data)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] E2E tests with Playwright

**Estimated Duration**: 6-8 weeks (3-5 weeks remaining)
**Success Criteria**: A user can log in with a passkey, chat with humans and agents, manage tools, and monitor agent tasks from a browser.

---

## Phase 6: Testing & Hardening — ~20% Complete

- [x] Achieve >80% unit test coverage across all library packages (379 tests)
- [x] Fix validatePublicKey() bug found through testing
- [ ] Integration test suite with real services (Docker Compose)
- [ ] Load testing: verify 10,000 concurrent WebSocket connections
- [ ] Load testing: verify <200ms p95 messaging latency
- [ ] Security penetration testing
- [ ] Dependency audit (npm audit, Snyk)
- [x] Rate limiting implementation (in-memory, exists in server)
- [ ] Replace in-memory rate limiting with Redis-backed
- [ ] Implement mTLS for inter-service communication
- [ ] Implement E2EE for messaging (Olm/Megolm via Matrix)
- [ ] Chaos engineering: test service failures, network partitions
- [ ] Performance profiling and optimization
- [ ] Documentation review and accuracy audit

**Estimated Duration**: 4-6 weeks
**Success Criteria**: All performance targets met, no critical security vulnerabilities, comprehensive test coverage.

---

## Phase 7: Production Deployment — ~10% Complete

- [x] Kubernetes manifest structure defined in docs
- [x] Kustomize overlay structure planned
- [ ] Kubernetes manifests for all services (created and tested)
- [ ] Helm chart for one-command deployment
- [ ] CI/CD pipeline (GitHub Actions — defined but not tested)
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

## Overall Progress Summary

| Phase | Progress | Status |
|-------|----------|--------|
| Phase 0: Project Setup | 100% | ✅ Complete |
| Phase 1: Identity Service | ~60% | 🔄 In Progress |
| Phase 2: Messaging | ~15% | 📋 Early Stage |
| Phase 3: MCP Gateway | ~40% | 🔄 In Progress |
| Phase 4: A2A Router | ~45% | 🔄 In Progress |
| Phase 5: Web Client | ~50% | 🔄 In Progress |
| Phase 6: Testing & Hardening | ~20% | 📋 Early Stage |
| Phase 7: Production Deployment | ~10% | 📋 Planned |

**Overall project completion: ~35%** (up from ~15% at project start)

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
