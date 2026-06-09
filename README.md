<h1 align="center">
  <img src="https://img.shields.io/badge/KALEN-000000?style=for-the-badge&logo=data:image/svg+xml;base64=&labelColor=000" alt="KALEN" />
</h1>

<p align="center">
  <strong>Kinetic Autonomous Layer for Entity Networking</strong>
</p>

<p align="center">
  An AI-native communication operating system enabling coexistence<br/>
  between humans and autonomous AI agents.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/status-pre--alpha-orange.svg" alt="Status: Pre-Alpha" />
  <img src="https://img.shields.io/badge/tests-379%20passing-brightgreen.svg" alt="Tests: 379 passing" />
  <img src="https://img.shields.io/badge/version-0.2.0--alpha-blue.svg" alt="Version: 0.2.0-alpha" />
</p>

---

## Table of Contents

- [Vision](#vision)
- [Why KALEN?](#why-kalen)
- [Architecture Overview](#architecture-overview)
- [Protocol Integration](#protocol-integration)
- [Dual Identity Model](#dual-identity-model)
- [Project Status](#project-status)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Vision

KALEN is a communication operating system designed for a world where humans and AI agents share the same messaging fabric.

The current generation of communication platforms — Slack, Discord, Matrix, Teams — were built for human-to-human interaction. They treat automation as an afterthought: bots are second-class citizens, authentication assumes biological users, and there is no standardized protocol for agents to discover, delegate, or collaborate with each other.

KALEN starts from a different premise: **agents are first-class participants in communication**. They have verifiable identities, scoped capabilities, auditable actions, and enforceable boundaries — but they coexist alongside humans in the same conversations, channels, and calls.

This is not a chatbot platform. It is not an agent orchestration framework. It is an **operating layer** for entity networking — where "entity" means human or agent, and the infrastructure treats both with equal structural rigor while maintaining clear, enforceable distinction.

### What KALEN aims to provide

- **Unified messaging** where humans and agents participate in the same conversations with clear visual and protocol-level distinction
- **Passkey-first authentication** (WebAuthn/FIDO2) for humans, cryptographic identity (Ed25519) for agents
- **Protocol-native integration** with MCP (Model Context Protocol) for tool use and A2A (Agent-to-Agent) for inter-agent communication
- **Governance by default** — every agent action is scoped, rate-limited, auditable, and revocable
- **Self-hostable and sovereign** — no vendor lock-in, no cloud dependency for core functionality

---

## Why KALEN?

### The problem is real and growing

**Agents are proliferating without identity infrastructure.**

- Enterprise AI agent deployments grew from experimental to production between 2023–2025, but most agents operate under shared API keys with no individual identity or accountability ([Gartner, 2024](https://www.gartner.com/en/artificial-intelligence)).
- Over 80% of organizations deploying AI agents report concerns about access control and audit trails ([McKinsey Global AI Survey, 2024](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)).
- Security incidents involving AI agents — prompt injection, unauthorized tool use, data exfiltration — are documented in OWASP's [Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/).

**Existing platforms weren't built for this.**

| Platform | Human Identity | Agent Identity | Tool Protocol | Agent-to-Agent | Open Source |
|----------|:---:|:---:|:---:|:---:|:---:|
| Slack | OAuth/SSO | Bot tokens | Bolt API | No | No |
| Discord | OAuth | Bot tokens | Gateway API | No | No |
| Matrix | OAuth/SSO | App service | No standard | No | Yes |
| OpenIM | Phone/Auth | Admin-created | No standard | No | Yes |
| **KALEN** | **WebAuthn** | **Ed25519 + Manifest** | **MCP** | **A2A** | **Yes** |

**The gap:**
1. No communication platform treats agents as cryptographically-identified, capability-scoped entities
2. No platform integrates MCP for real tool use governance or A2A for native agent-to-agent coordination
3. No platform enforces visual and protocol-level distinction between human and agent participants by default
4. No open-source platform combines all of the above with passkey-based human authentication

KALEN exists to fill this gap.

---

## Architecture Overview

KALEN follows a five-layer reference architecture, where each layer has a clear responsibility boundary and communicates through well-defined interfaces.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│         Next.js Web Client · React Components               │
│         Entity-aware UI: human/agent visual distinction      │
├─────────────────────────────────────────────────────────────┤
│                    GATEWAY LAYER                              │
│         Traefik (API Gateway) · WebSocket · SSE              │
│         Rate limiting · Security headers · TLS termination   │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                          │
│         NestJS API Server · Feature Modules                  │
│         Auth · Conversations · Channels · Agents · Calls     │
├─────────────────────────────────────────────────────────────┤
│                    PROTOCOL LAYER                             │
│         MCP Gateway · A2A Router · OpenIM Bridge             │
│         Tool governance · Agent discovery · Task routing     │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                       │
│         PostgreSQL · Redis · NATS · MinIO · Elasticsearch    │
│         LiveKit · Elasticsearch · Monitoring Stack            │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Responsibility | Key Technologies |
|-------|---------------|-----------------|
| **Presentation** | User interface, entity-aware rendering, real-time updates | Next.js 14+, React, Tailwind CSS, shadcn/ui |
| **Gateway** | Request routing, TLS, rate limiting, WebSocket upgrade | Traefik v3, Docker |
| **Application** | Business logic, REST/WebSocket API, event coordination | NestJS, TypeORM, Passport |
| **Protocol** | MCP tool routing, A2A task delegation, OpenIM messaging | Custom gateways, JSON-RPC 2.0 |
| **Infrastructure** | Persistence, caching, event bus, search, media, observability | PostgreSQL, Redis, NATS, MinIO, Elasticsearch, LiveKit |

For the detailed architecture specification including data flow diagrams, sequence diagrams, and inter-module contracts, see [`docs/design.md`](docs/design.md) _(to be written)_.

---

## Protocol Integration

KALEN integrates four distinct protocol layers, each solving a different problem in the human-agent coexistence space.

### OpenIM — Messaging Infrastructure

**What it provides:** Battle-tested, scalable instant messaging — 1:1 chats, group conversations, presence, push notifications.

**Why OpenIM over Matrix:** OpenIM provides a cleaner API surface for server-side integration, native support for third-party identity providers, and lower operational complexity. KALEN uses OpenIM as the messaging transport, not as the identity or governance layer — those are handled by KALEN's own identity and protocol systems.

- KALEN bridges OpenIM's messaging into its own conversation model
- Human and agent identities are mapped to OpenIM users with distinct metadata
- Message events flow through NATS for KALEN's audit and governance pipeline

### WebAuthn / FIDO2 — Human Authentication

**What it provides:** Passwordless, phishing-resistant authentication using passkeys (biometrics, security keys, device PIN).

**Why passkeys over passwords:**

- 81% of data breaches involve stolen or weak credentials ([Verizon DBIR, 2024](https://www.verizon.com/business/resources/reports/dbir/))
- Passkeys eliminate phishing by binding authentication to the relying party's origin
- FIDO2/WebAuthn is supported by all major browsers and platforms since 2022–2023
- Recovery is handled through BIP39-compatible 24-word recovery phrases, not email-based resets

**Implementation:**

- Registration: `navigator.credentials.create()` → server-side verification → credential storage
- Authentication: `navigator.credentials.get()` → challenge-response verification → JWT issuance
- Recovery: 24-word BIP39 phrase → device binding → credential re-provisioning
- All credential operations use `base64url` encoding per [WebAuthn Level 3](https://w3c.github.io/webauthn/) specification

### MCP (Model Context Protocol) — Agent Tool Use

**What it provides:** A standardized protocol for AI agents to discover and invoke external tools, access resources, and receive structured responses.

**Origin:** [Anthropic's Model Context Protocol](https://modelcontextprotocol.io/) — an open standard released in late 2024 for connecting AI assistants with data sources and tools.

**KALEN's MCP integration:**

| Component | Role |
|-----------|------|
| **MCP Gateway** | Central router — receives tool invocation requests from agents, routes them to the appropriate MCP server, enforces governance |
| **MCP Client** | Embedded per agent — connects to MCP servers via stdio/SSE transports, manages connection lifecycle |
| **MCP Server** | Tool provider — exposes KALEN-native tools (messaging, search, file I/O) and can connect external tool servers |
| **Tool Governance** | Per-agent allowlists, rate limiting, output sanitization, capability validation against agent manifest |
| **Server Registry** | Discoverable catalog of available MCP servers with metadata cards |

**Built-in MCP tools:**

- `kalen-message` — Send/receive messages in KALEN conversations
- `kalen-search` — Full-text search across messages and conversations
- `kalen-file` — Upload/download files from MinIO object storage
- `kalen-web` — Web search and fetch (via external API)
- `kalen-code` — Code execution in a sandboxed environment

### A2A (Agent-to-Agent) — Inter-Agent Communication

**What it provides:** A standardized protocol for agents to discover each other, delegate tasks, exchange messages within task contexts, and share artifacts.

**Origin:** [Google's Agent-to-Agent Protocol](https://github.com/google/A2A) — an open specification for interoperable agent communication using JSON-RPC 2.0 over HTTP with SSE streaming.

**KALEN's A2A integration:**

| Component | Role |
|-----------|------|
| **A2A Router** | Central task router — receives `tasks/send` and `tasks/get` requests, delegates to appropriate agents |
| **Agent Card** | Signed metadata document (`/.well-known/agent.json`) describing an agent's capabilities, endpoint, and authentication requirements |
| **Task Lifecycle** | State machine: `submitted` → `working` → `completed` / `failed` / `canceled`, with full history |
| **Artifact Manager** | Store and retrieve task artifacts (files, data, generated content) |
| **Discovery Service** | Find agents via Agent Cards, cache in Redis, publish discovery events via NATS |
| **Security Layer** | Ed25519 card signing/verification, OAuth 2.1 with PKCE, mTLS for enterprise, per-agent rate limiting |

**A2A Methods supported:**

- `tasks/send` — Submit a task to a remote agent
- `tasks/get` — Retrieve task status and result
- `tasks/cancel` — Cancel an in-progress task
- `tasks/sendSubscribe` — Submit a task and stream updates via SSE

---

## Dual Identity Model

KALEN's core architectural decision: **humans and agents have fundamentally different identity models**, and this distinction is enforced at every layer.

### Human Identity

```
┌──────────────────────────────────┐
│         HUMAN IDENTITY            │
├──────────────────────────────────┤
│ Auth:     WebAuthn / FIDO2       │
│           (passkeys)              │
│ Storage:  Credential public key   │
│           + counter + transports  │
│ Token:    JWT (24h TTL)           │
│ Recovery: 24-word BIP39 phrase    │
│ Visual:   Standard avatar         │
│           No suffix               │
└──────────────────────────────────┘
```

- **Authentication**: Phishing-resistant via WebAuthn. No passwords, no SMS, no email-based OTP.
- **Credential storage**: Only public keys and metadata are stored server-side. Private keys never leave the authenticator device.
- **Recovery**: BIP39-compatible 24-word recovery phrase, bound to a new device credential during recovery.
- **Sessions**: Short-lived JWTs (24h default) with refresh capability. No long-lived tokens.

### Agent Identity

```
┌──────────────────────────────────┐
│         AGENT IDENTITY            │
├──────────────────────────────────┤
│ Auth:     Ed25519 keypair         │
│           (generated at creation) │
│ Storage:  Public key + manifest   │
│           + owner binding         │
│ Token:    Short-lived agent token │
│           (24h TTL, refreshable)  │
│ Recovery: Owner re-issues keys    │
│ Visual:   Agent avatar + (ai)     │
│           suffix (mandatory)      │
│ Scope:    Manifest-defined        │
│           capabilities + RBAC     │
└──────────────────────────────────┘
```

- **Identity creation**: Agent keypair is generated at creation time. The private key is stored encrypted; the public key is stored in the database and used for manifest signing/verification.
- **Mandatory `(ai)` suffix**: Every agent display name must end with `(ai)` — e.g., `Assistant(ai)`, `DataBot(ai)`. This is enforced at the application level and cannot be overridden. The `suffix-enforcer` module prevents spoofing.
- **Manifest**: A signed document declaring the agent's capabilities, allowed tools, rate limits, and scope. Think of it as a machine-readable, cryptographically-verifiable permission boundary.
- **Scope enforcement**: The `scope-resolver` translates manifest capabilities into concrete RBAC permissions. The `policy-engine` evaluates access requests with deny-first logic.
- **Audit trail**: Every agent authentication, key rotation, scope change, and action is logged in an append-only, signed audit log.

### Why this matters

Without distinct identity models, you get one of two failures:

1. **Agents impersonate humans** — no visual distinction, no protocol-level separation, no audit trail. This is the current state of bot tokens in most platforms.
2. **Agents are over-constrained** — forced into human authentication flows (passwords, OAuth) that don't fit their operational model, leading to shared credentials and no accountability.

KALEN's dual identity model ensures agents are **identifiable, accountable, and bounded** without forcing them through authentication patterns designed for biological users.

---

## Project Status

> **This section is deliberately honest. We will not inflate our progress.**

**Current phase: Pre-Alpha — Active Development**

### What exists

| Component | Status | Notes |
|-----------|--------|-------|
| Project scaffolding | ✅ Done | Monorepo structure with Turborepo, pnpm workspaces |
| Infrastructure configs | ✅ Done | Docker Compose for local dev (PostgreSQL, Redis, NATS, MinIO, Elasticsearch, LiveKit, Traefik, monitoring stack) |
| Kubernetes manifests | ✅ Done | Kustomize-based k8s configs for production deployment |
| TypeScript configuration | ✅ Done | Strict mode, path aliases for `@kalen/*` packages |
| Environment template | ✅ Done | Comprehensive `.env.example` with all service configs |
| Local setup script | ✅ Done | `infra/scripts/setup-local.sh` for one-command dev bootstrap |
| Project structure document | ✅ Done | Full directory tree with file-level descriptions |
| CI/CD pipeline definitions | ✅ Defined | GitHub Actions workflows in project structure (not yet tested) |
| Database init scripts | ✅ Done | PostgreSQL with `uuid-ossp` and `pgvector` extensions |
| `@kalen/shared` package | ✅ Done | Core types (identity, messaging, MCP, A2A, events), validation utilities, constants |
| `@kalen/identity` package | ✅ Done | Real Ed25519 signing (`@noble/ed25519`), WebAuthn helpers, JWT, RBAC, manifest signing/verification |
| `@kalen/mcp-gateway` package | ✅ Done | MCP server/client, gateway service with RBAC + allowlist governance, audit logging |
| `@kalen/a2a-router` package | ✅ Done | A2A router service, task lifecycle state machine, agent card service, Ed25519 card signing |
| API server (`apps/server`) | ✅ Done | NestJS server with auth, identity, messaging, MCP, A2A, health modules + TypeORM entities |
| Web client (`apps/web`) | ✅ Done | Next.js 15 app with 10 pages, 17 components, WebAuthn login, chat, agent directory, MCP browser |
| Unit tests | ✅ Done | **379 tests across 15 test suites** — all passing |
| Ed25519 cryptography | ✅ Done | Real Ed25519 via `@noble/ed25519` (replaced fake `simpleHash()` implementation) |

### What does NOT exist yet (honest assessment)

| Component | Status | Notes |
|-----------|--------|-------|
| PostgreSQL persistence for tasks/audit | ⚠️ In-memory only | TypeORM entities defined but services use in-memory stores |
| Redis-backed challenge store | ⚠️ Stub | InMemoryChallengeStore in auth service; needs real Redis |
| OpenIM integration | ❌ Not started | Messaging service is a stub — not wired to OpenIM |
| LiveKit integration | ❌ Not started | No real-time audio/video |
| MCP tool handlers | ⚠️ Stubs | Return structured JSON but not wired to real services |
| Real-time WebSocket messaging | ⚠️ Partial | Gateway exists but not connected to OpenIM |
| Agent runtime | ❌ Not started | No containerized agent execution environment |
| E2E tests | ❌ Not started | Playwright E2E, Jest integration tests |
| Production deployment | ❌ Not started | Not deployed anywhere yet |
| Documentation site | ❌ Not started | Architecture docs, API reference, guides |

### What we're working on next

1. Wire in-memory stores to PostgreSQL via TypeORM
2. Implement Redis-backed challenge store and rate limiting
3. OpenIM integration for real messaging
4. E2E tests with Playwright

**The project has working library code and applications, but is not yet a functional end-to-end system.** Core cryptographic operations (Ed25519 signing/verification, JWT, RBAC) are real and tested. The main gaps are in persistence (still in-memory) and external service integration (OpenIM, LiveKit).

---

## Tech Stack

### Core

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | ≥20 LTS | Server-side JavaScript runtime |
| **Language** | TypeScript | 5.7+ | Type-safe development |
| **Monorepo** | Turborepo | 2.3+ | Build orchestration, task caching |
| **Package Manager** | pnpm | 9.15+ | Fast, disk-efficient dependency management |

### Applications

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Web Client** | Next.js 15 (App Router) | Server-rendered React application |
| **UI Components** | shadcn/ui + Radix UI | Accessible, composable component primitives |
| **Styling** | Tailwind CSS 3+ | Utility-first CSS |
| **State (Client)** | Zustand | Lightweight client-side state |
| **State (Server)** | TanStack Query | Server state with caching |
| **API Server** | NestJS | Modular backend framework |
| **ORM** | TypeORM | Database access with migrations |
| **Validation** | Zod | Runtime schema validation |

### Protocol & Identity

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Human Auth** | WebAuthn / FIDO2 | Passkey-based passwordless authentication |
| **Agent Auth** | Ed25519 | Cryptographic keypair identity |
| **Token** | JWT (Passport) | Session management |
| **Tool Protocol** | MCP (Anthropic) | Agent tool discovery and invocation |
| **Agent Protocol** | A2A (Google) | Inter-agent task delegation |
| **Messaging** | OpenIM | Scalable instant messaging infrastructure |

### Infrastructure

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Database** | PostgreSQL 16 + pgvector | Primary data store with vector support |
| **Cache** | Redis 7 | Session cache, rate limiting, challenge store |
| **Event Bus** | NATS (JetStream) | Inter-service event distribution |
| **Object Storage** | MinIO | S3-compatible file storage |
| **Search** | Elasticsearch 8 | Full-text message and conversation search |
| **WebRTC SFU** | LiveKit | Real-time audio/video calls |
| **TURN** | coturn | NAT traversal for WebRTC |
| **API Gateway** | Traefik v3 | Reverse proxy, TLS, routing |
| **Monitoring** | Prometheus + Grafana + Loki | Metrics, dashboards, log aggregation |
| **Containers** | Docker + Docker Compose | Local development and deployment |
| **Orchestration** | Kubernetes (Kustomize) | Production container orchestration |

### Development Tooling

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Linting** | ESLint 9 + typescript-eslint | Code quality |
| **Formatting** | Prettier + prettier-plugin-tailwindcss | Consistent code style |
| **Git Hooks** | Husky + lint-staged | Pre-commit checks |
| **Commit Convention** | commitlint | Conventional commits enforcement |
| **E2E Testing** | Playwright | Browser automation testing |
| **Unit Testing** | Jest | Server-side unit and integration tests |

---

## Quick Start

### Prerequisites

| Requirement | Minimum Version | Installation |
|-------------|----------------|--------------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |
| pnpm | 9.15+ | `npm install -g pnpm@9` |
| Docker | 24+ | [docker.com](https://www.docker.com/) |
| Docker Compose | v2+ | Included with Docker Desktop |
| Git | 2.40+ | [git-scm.com](https://git-scm.com/) |

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhr/kalen.git
cd kalen

# Install dependencies
pnpm install

# Run the one-command setup script
# This will:
#   1. Copy .env.example → .env
#   2. Install pnpm dependencies
#   3. Start infrastructure services (Docker)
#   4. Wait for PostgreSQL to be ready
#   5. Run database migrations
bash infra/scripts/setup-local.sh
```

### Run Tests

```bash
# Run all 379 unit tests
pnpm test

# Run tests for a specific package
pnpm --filter @kalen/identity test
pnpm --filter @kalen/shared test
pnpm --filter @kalen/mcp-gateway test
pnpm --filter @kalen/a2a-router test
```

### Configure Environment

```bash
# Review and fill in secret values
# At minimum, set these:
#   JWT_SECRET, POSTGRES_PASSWORD, REDIS_PASSWORD,
#   MINIO_ACCESS_KEY, MINIO_SECRET_KEY, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
nano .env
```

### Start Development

```bash
# Start all application servers (web + API)
pnpm dev

# Or start individually
pnpm --filter @kalen/web dev      # Next.js on :3000
pnpm --filter @kalen/server dev   # NestJS on :4000
```

### Verify

| Service | URL |
|---------|-----|
| Web Client | http://localhost:3000 |
| API Server | http://localhost:4000 |
| Traefik Dashboard | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| NATS Monitor | http://localhost:8222 |

---

## Project Structure

KALEN is organized as a pnpm monorepo with Turborepo orchestration. The top-level layout:

```
kalen/
├── apps/
│   ├── web/                 # Next.js web client (@kalen/web)
│   └── server/              # NestJS API server (@kalen/server)
├── packages/
│   ├── shared/              # Shared types, schemas, utilities (@kalen/shared)
│   ├── identity/            # WebAuthn + Agent identity (@kalen/identity)
│   ├── mcp-gateway/         # MCP protocol integration (@kalen/mcp-gateway)
│   └── a2a-router/          # A2A protocol integration (@kalen/a2a-router)
├── infra/
│   ├── docker/              # Docker Compose + service configs
│   ├── k8s/                 # Kubernetes manifests (Kustomize)
│   └── scripts/             # Setup and utility scripts
├── .github/                 # CI/CD workflows, issue templates
├── turbo.json               # Turborepo task configuration
├── pnpm-workspace.yaml      # Workspace package definitions
└── tsconfig.json            # Base TypeScript configuration
```

For the complete directory tree with file-level descriptions, see [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md).

---

## Development

### Monorepo Commands

All commands are run from the repository root. Turborepo handles task dependencies and caching.

```bash
# Development (starts all apps in watch mode)
pnpm dev

# Build all packages and applications
pnpm build

# Lint all packages
pnpm lint

# Type-check all packages
pnpm typecheck

# Run unit tests
pnpm test

# Run end-to-end tests
pnpm test:e2e

# Clean all build artifacts
pnpm clean

# Database migrations
pnpm db:migrate

# Database seeding
pnpm db:seed

# Infrastructure management
pnpm infra:up          # Start all Docker services
pnpm infra:down        # Stop all Docker services
pnpm infra:logs        # Follow infrastructure logs
```

### Package-Specific Commands

```bash
# Run commands for a specific package
pnpm --filter @kalen/web dev
pnpm --filter @kalen/server test
pnpm --filter @kalen/shared build
pnpm --filter @kalen/identity lint
pnpm --filter @kalen/mcp-gateway typecheck
pnpm --filter @kalen/a2a-router test
```

### Code Style

- **TypeScript strict mode** — enabled across all packages
- **Conventional commits** — enforced via commitlint (`feat:`, `fix:`, `docs:`, etc.)
- **Pre-commit hooks** — lint-staged runs Prettier and ESLint on staged files
- **Import conventions** — use `@kalen/*` path aliases for internal package references
- **No `any`** — avoid `any` type; use `unknown` with type narrowing

### Environment Variables

All configuration is driven by environment variables. See [`.env.example`](.env.example) for the complete list with documentation. Key categories:

- `WEBAUTHN_*` — Relying party configuration for passkeys
- `JWT_*` — Token signing and expiration
- `POSTGRES_*` — Database connection
- `REDIS_*` — Cache and session store
- `MCP_GATEWAY_*` — MCP gateway behavior and limits
- `A2A_ROUTER_*` — A2A router configuration
- `AGENT_*` — Agent identity defaults

**Never commit `.env` files.** The `.gitignore` excludes them by default.

---

## Testing

### Test Strategy

| Level | Tool | Scope | When |
|-------|------|-------|------|
| **Unit** | Jest | Individual functions, services | Every PR |
| **Integration** | Jest + NestJS testing | Module interaction, database | Every PR |
| **E2E** | Playwright | Full user flows in browser | Before merge |
| **Security** | Snyk / Trivy | Dependency and container scanning | Scheduled + PRs |

### Running Tests

```bash
# All tests
pnpm test

# Unit tests with watch mode
pnpm --filter @kalen/server test -- --watch

# E2E tests (requires running infrastructure)
pnpm infra:up
pnpm test:e2e

# Coverage report
pnpm --filter @kalen/server test -- --coverage
```

### Test Configuration

- **Unit tests**: Co-located with source files (`*.spec.ts`)
- **Integration tests**: `tests/` directory within each package
- **E2E tests**: `apps/web/tests/e2e/` for Playwright, `apps/server/tests/` for API E2E
- **Test environment**: Docker Compose test override (`infra/docker/docker-compose.test.yml`) provides isolated database instances

---

## Deployment

### Docker Compose (Staging / Single-Node)

The local development Docker Compose can be adapted for staging deployments:

```bash
# Start all services
docker compose -f infra/docker/docker-compose.yml up -d

# With production overrides (resource limits, replicas)
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml up -d
```

**Production overrides include:**

- Memory and CPU limits per container
- Replica counts for stateless services
- Restart policies (`unless-stopped` or `always`)
- TLS via Traefik with Let's Encrypt
- Health check tuning for production workloads

### Kubernetes (Production)

KALEN provides Kustomize-based Kubernetes manifests in `infra/k8s/`:

```bash
# Deploy to Kubernetes
kubectl apply -k infra/k8s/overlays/production/

# Or with kustomize directly
kustomize build infra/k8s/overlays/production/ | kubectl apply -f -
```

**K8s resources defined:**

| Resource | Type | Notes |
|----------|------|-------|
| API Server | Deployment (2 replicas) | HPA: 2–10 by CPU |
| Web Client | Deployment (2 replicas) | Nginx serving static build |
| PostgreSQL | StatefulSet (1 replica) | PVC with pgvector |
| Redis | StatefulSet (1 replica) | Persistence enabled |
| MinIO | StatefulSet (1 replica) | PVC for object storage |
| NATS | StatefulSet (1 replica) | JetStream enabled |
| Elasticsearch | StatefulSet (1 replica) | PVC with heap config |
| LiveKit | Deployment | HostNetwork for WebRTC |
| Traefik | Deployment (2 replicas) | LoadBalancer service type |
| coturn | Deployment | HostNetwork for UDP |

**Overlays:**

- `infra/k8s/base/` — Base resources
- `infra/k8s/overlays/staging/` — Staging-specific patches
- `infra/k8s/overlays/production/` — Production-specific patches (replicas, resources, secrets)

### Secrets Management

- **Local**: `.env` file (gitignored)
- **K8s**: Use [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) or your preferred secrets manager
- **Never** commit secrets, PEM files, or private keys to the repository

---

## Contributing

We welcome contributions, but please read this carefully first — the project is in **pre-alpha** and the codebase is actively being shaped.

### How to Contribute

1. **Check existing issues** — Look for issues labeled `good first issue` or `help wanted`
2. **Open an issue first** — Before writing code for a new feature, open an issue to discuss the approach
3. **Fork and branch** — Create a feature branch from `develop`: `git checkout -b feat/your-feature`
4. **Write code** — Follow the existing patterns, maintain strict TypeScript, write tests
5. **Commit** — Use [conventional commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, etc.
6. **Open a PR** — Fill out the PR template, link to the issue, ensure CI passes

### Code Review Criteria

- [ ] TypeScript strict mode — no `any`, no type assertions without justification
- [ ] Tests — unit tests for new logic, integration tests for new endpoints
- [ ] Documentation — JSDoc on public APIs, README updates if applicable
- [ ] Architecture alignment — does this fit the five-layer model? Does it respect package boundaries?
- [ ] Security implications — does this change affect authentication, authorization, or data exposure?

### Development Setup

See [Quick Start](#quick-start) and [Development](#development) sections.

### Communication

- **Issues**: [github.com/mulkymalikuldhr/kalen/issues](https://github.com/mulkymalikuldhr/kalen/issues)
- **Email**: mulkymalikuldhr@mail.com

---

## Security

KALEN handles authentication credentials, cryptographic keys, and access control. We take security seriously.

### Reporting Vulnerabilities

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

- **GitHub Security Advisories**: [github.com/mulkymalikuldhr/kalen/security/advisories/new](https://github.com/mulkymalikuldhr/kalen/security/advisories/new)
- **Email**: mulkymalikuldhr@mail.com (please use PGP if possible)

We ask that you:

1. **Do not exploit** the vulnerability beyond what is necessary to demonstrate it
2. **Provide sufficient detail** to reproduce the issue — steps, affected versions, potential impact
3. **Allow reasonable time** for a response before public disclosure (we aim for 90 days)

We will:

1. Acknowledge receipt within 48 hours
2. Provide an initial assessment within 7 days
3. Keep you informed of remediation progress
4. Credit you in the security advisory (unless you prefer anonymity)

### Security Architecture

- **Human credentials**: WebAuthn public keys only — no passwords stored, no private keys leave the authenticator
- **Agent credentials**: Ed25519 keypairs — private keys stored encrypted at rest, never transmitted
- **JWT tokens**: Short-lived (24h), signed with a server-side secret, entity type embedded in claims
- **MCP tool governance**: Per-agent allowlists, rate limiting, output sanitization, capability validation
- **A2A security**: Signed Agent Cards, OAuth 2.1 with PKCE, optional mTLS
- **Audit**: Append-only, signed audit log for all identity and agent actions
- **Infrastructure**: TLS termination at Traefik, network isolation via Docker/K8s network policies

---

## License

```
KALEN — Kinetic Autonomous Layer for Entity Networking
Copyright (C) 2024–2025 Mulky Malikul Dhaher

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
```

**Why AGPL-3.0?**

The Affero GPL ensures that anyone who runs a modified version of KALEN as a network service must make their modifications available to users of that service. For a communication platform that handles identity and governance, this is critical — it prevents a scenario where someone operates a modified version with weakened security or surveillance capabilities without contributing those changes back.

---

## Acknowledgments

KALEN stands on the shoulders of several open protocols and projects. We are grateful to their creators and maintainers.

| Project | What they built | How KALEN uses it |
|---------|----------------|-------------------|
| **[Anthropic MCP](https://modelcontextprotocol.io/)** | Model Context Protocol — an open standard for connecting AI systems with tools and data sources | Foundation for KALEN's agent tool use layer — governance, routing, and registry are built on top of MCP |
| **[Google A2A](https://github.com/google/A2A)** | Agent-to-Agent Protocol — an open specification for interoperable agent communication | Foundation for KALEN's inter-agent communication — task delegation, discovery, and artifact exchange |
| **[OpenIM](https://github.com/openimsdk/open-im-server)** | Open-source instant messaging server with scalable architecture | Messaging infrastructure layer — KALEN bridges OpenIM's messaging into its own conversation and identity model |
| **[Matrix](https://matrix.org/)** | Open protocol for decentralized, federated communication | Conceptual inspiration for open, interoperable messaging — KALEN chose OpenIM for its cleaner integration surface but shares Matrix's federated ethos |
| **[FIDO Alliance](https://fidoalliance.org/)** | FIDO2/WebAuthn standards for passwordless authentication | Foundation for KALEN's human authentication — passkeys provide phishing-resistant, passwordless login |

Additionally, KALEN relies on many excellent open-source projects listed in our [Tech Stack](#tech-stack). Thank you to every contributor and maintainer.

---

<p align="center">
  <sub>Built with intention by <a href="mailto:mulkymalikuldhr@mail.com">Mulky Malikul Dhaher</a></sub>
</p>

<p align="center">
  <sub>KALEN is pre-alpha software. Core libraries and applications exist with 379 passing tests,<br/>but end-to-end functionality (real messaging, persistence, agent runtime) is not yet complete.<br/>We're building in the open.</sub>
</p>
