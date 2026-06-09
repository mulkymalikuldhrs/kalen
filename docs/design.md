# KALEN System Design Document

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)  
**Version:** 0.1.0-draft  
**Date:** 2026-06-08  
**Status:** Pre-Alpha — sections marked `[DESIGN]` are aspirational; sections marked `[IMPLEMENTED]` reflect running code; sections marked `[PARTIAL]` are implemented but with stubs or in-memory stores.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Identity Model](#3-identity-model)
4. [Messaging Architecture](#4-messaging-architecture)
5. [MCP Integration](#5-mcp-integration)
6. [A2A Integration](#6-a2a-integration)
7. [Security Design](#7-security-design)
8. [Data Architecture](#8-data-architecture)
9. [Scalability Design](#9-scalability-design)
10. [Deployment Design](#10-deployment-design)
11. [Monitoring Design](#11-monitoring-design)
12. [Implementation Status Summary](#12-implementation-status-summary)

---

## 1. Design Philosophy

KALEN is built on four foundational principles that govern every architectural decision:

### 1.1 Human-Agent Parity

Humans and AI agents are first-class participants in the same communication fabric. There is no "bot API" tucked behind a separate integration layer — agents participate in the same rooms, use the same messaging primitives, and are governed by the same permission model as human users. The only distinction is the **identity provenance**: humans authenticate via WebAuthn; agents authenticate via cryptographic keypairs. Once authenticated, both are peers.

### 1.2 Protocol-Native Integration

KALEN does not wrap third-party protocols in proprietary abstractions that leak. Instead, it commits to protocol-native integration:

- **OpenIM** for messaging — not a custom chat server with an OpenIM adapter.
- **MCP (Model Context Protocol)** for tool use — not a bespoke function-calling framework.
- **A2A (Agent-to-Agent Protocol)** for inter-agent coordination — not a custom RPC layer.

When a protocol falls short, KALEN extends it through the protocol's own extension mechanisms rather than forking it.

### 1.3 Defense in Depth

Security is not a perimeter. Every layer — identity, transport, storage, computation — applies its own authentication, authorization, and audit controls. A compromise at one layer does not cascade to others.

### 1.4 Observability as a Feature

Every significant action produces structured, correlation-linked telemetry. KALEN is designed so that an operator can trace a single user request from the API gateway through message delivery, tool invocation, and agent handoff without gaps.

---

## 2. Architecture Overview

KALEN employs a five-layer architecture. Each layer has a single responsibility boundary and communicates with adjacent layers through well-defined interfaces.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LAYER 5: PRESENTATION                        │
│    Web SPA (Next.js)  │  CLI (kln)  │  Mobile (React Native)       │
├─────────────────────────────────────────────────────────────────────┤
│                        LAYER 4: API GATEWAY                         │
│    Kong / Envoy  │  Rate Limiting  │  TLS Termination  │  Routing  │
├─────────────────────────────────────────────────────────────────────┤
│                     LAYER 3: SERVICE MESH                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Identity │  │ Messaging│  │  MCP     │  │  A2A              │  │
│  │ Service  │  │ Service  │  │  Gateway │  │  Router           │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                     LAYER 2: EVENT BACKBONE                          │
│              NATS JetStream (persistent streams)                     │
├─────────────────────────────────────────────────────────────────────┤
│                     LAYER 1: DATA PLANE                              │
│  PostgreSQL   │  Redis   │  MinIO   │  Elasticsearch   │  pgvector │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.1 Layer 1 — Data Plane

**Status: `[PARTIAL]`** — PostgreSQL schema defined; TypeORM entities exist in apps/server. Redis, MinIO, Elasticsearch, and pgvector are designed but not yet wired to running code.

The data plane provides durable storage, caching, object storage, search, and vector similarity. Each store has a single job:

| Store | Responsibility | Why |
|-------|---------------|-----|
| PostgreSQL + pgvector | Relational data + vector similarity | ACID transactions for identity, messages, tasks; pgvector for semantic search without a separate vector DB |
| Redis | Session state, rate-limit counters, ephemeral caches | Sub-millisecond reads for hot-path data |
| MinIO | Attachments, artifacts, MCP tool payloads | S3-compatible API; self-hosted; avoids egress costs of cloud S3 |
| Elasticsearch | Full-text search across messages, tasks, audit logs | Relevance-ranked search that PostgreSQL full-text cannot match at scale |
| NATS JetStream | Event persistence and replay | Durable streams for event sourcing and guaranteed delivery |

**Diagram: Data flow write path**

```
Client Request
      │
      ▼
  API Gateway ──► Service (e.g., Messaging)
                      │
                      ├──► PostgreSQL (durable write)
                      ├──► NATS JetStream (event publish)
                      ├──► Redis (cache invalidate/update)
                      └──► Elasticsearch (async index via NATS consumer)
```

### 2.2 Layer 2 — Event Backbone

**Status: `[PARTIAL]`** — NATS JetStream infrastructure exists in Docker Compose. Application-level event publishing not yet implemented (services use in-memory stores).

NATS JetStream serves as the central nervous system. All state-changing operations publish events to named streams:

| Stream | Subjects | Consumers |
|--------|----------|-----------|
| `KALEN.MSG` | `kalen.msg.created`, `kalen.msg.updated`, `kalen.msg.deleted` | Search indexer, push notifier, audit logger |
| `KALEN.IDENTITY` | `kalen.identity.created`, `kalen.identity.key_rotated` | Provisioning workers |
| `KALEN.MCP` | `kalen.mcp.tool_invoked`, `kalen.mcp.tool_result` | Audit logger, billing |
| `KALEN.A2A` | `kalen.a2a.task_created`, `kalen.a2a.task_completed`, `kalen.a2a.artifact_produced` | Task orchestrator, notification |
| `KALEN.AUDIT` | `kalen.audit.*` | Long-term archive, SIEM |

**Diagram: Event flow**

```
┌─────────────┐    publish     ┌──────────────────┐    deliver    ┌──────────────┐
│  Messaging   │──────────────►│  NATS JetStream  │─────────────►│  ES Indexer   │
│  Service     │               │                  │─────────────►│  Audit Logger │
└─────────────┘               │  Stream:         │─────────────►│  Notifier     │
                               │  KALEN.MSG       │              └──────────────┘
┌─────────────┐               │                  │
│  A2A Router  │──────────────►│  Stream:         │
│             │               │  KALEN.A2A       │
└─────────────┘               └──────────────────┘
```

### 2.3 Layer 3 — Service Mesh

**Status: `[PARTIAL]`** — Service boundaries implemented in TypeScript (NestJS), not Go as originally planned. Library packages (@kalen/shared, @kalen/identity, @kalen/mcp-gateway, @kalen/a2a-router) are tested and functional. apps/server uses in-memory stores. No services are deployed to production yet.

Four core services form the business logic layer:

1. **Identity Service** — Manages human and agent identities, WebAuthn registration/authentication, keypair lifecycle, and RBAC.
2. **Messaging Service** — Wraps OpenIM server APIs with KALEN-specific logic (room creation policies, message enrichment, search indexing triggers).
3. **MCP Gateway** — Discovers, registers, and proxies MCP tool servers; enforces per-tool permission and rate limits.
4. **A2A Router** — Routes agent-to-agent task requests, manages agent cards, and orchestrates multi-agent workflows.

Services communicate synchronously via gRPC (for request-response) and asynchronously via NATS (for events). There is no shared database — each service owns its schema within the same PostgreSQL cluster.

**Diagram: Inter-service communication**

```
                    ┌─────────────────┐
                    │  API Gateway    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                  │
           ▼                 ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Identity    │  │  Messaging   │  │  MCP Gateway │
   │  Service     │  │  Service     │  │              │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                  │
          │    NATS events  │  gRPC calls      │
          └────────►NATS◄───┘◄─────────────────┘
                    │
                    ▼
           ┌──────────────┐
           │  A2A Router   │
           └──────────────┘
```

### 2.4 Layer 4 — API Gateway

**Status: `[PARTIAL]`** — Traefik exists in Docker Compose with static config. Dynamic config and production middleware not yet implemented. NestJS server handles its own rate limiting (in-memory).

The API gateway terminates TLS, enforces rate limits, injects correlation IDs, and routes requests to the appropriate service. It also handles WebSocket upgrade for the OpenIM long-connection protocol.

Key routes:

| Route Prefix | Service | Protocol |
|--------------|---------|----------|
| `/api/v1/identity/*` | Identity Service | HTTP/REST |
| `/api/v1/msg/*` | Messaging Service | HTTP/REST + WS |
| `/api/v1/mcp/*` | MCP Gateway | HTTP/REST + SSE |
| `/api/v1/a2a/*` | A2A Router | HTTP/REST |
| `/openim/*` | OpenIM Server | HTTP + WS (passthrough) |

### 2.5 Layer 5 — Presentation

**Status: `[PARTIAL]`** — Next.js 15 web client exists with 10 pages, 17 components. WebAuthn login/register pages use simulated data. CLI and mobile are design only.

The presentation layer is intentionally thin. It renders UI, captures user input, and delegates all business logic to the API gateway. State management uses TanStack Query for server state and Zustand for ephemeral client state.

---

## 3. Identity Model

**Status: `[PARTIAL]`** — @kalen/identity implements Ed25519 signing (real @noble/ed25519), WebAuthn helpers, JWT, RBAC, manifest signing. 127 tests passing. Challenge store is in-memory. NestJS server has auth/identity controllers.

KALEN's identity model unifies humans and agents under a single `Identity` abstraction while preserving their fundamentally different authentication mechanisms.

### 3.1 Core Identity Schema

```
┌──────────────────────────────────────────────────────────┐
│                       Identity                           │
├──────────────────────────────────────────────────────────┤
│  id:          UUID (primary key)                         │
│  kind:        ENUM('human', 'agent')                     │
│  display_name: VARCHAR(255)                              │
│  suffix:      VARCHAR(64)  — UNIQUE, enforced format     │
│  created_at:  TIMESTAMP                                  │
│  updated_at:  TIMESTAMP                                  │
│  deactivated: BOOLEAN DEFAULT false                      │
├──────────────────────────────────────────────────────────┤
│  Relations:                                              │
│    - HumanIdentity  (1:1, kind='human')                  │
│    - AgentIdentity  (1:1, kind='agent')                  │
│    - IdentityRoles  (M:N via identity_roles)             │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Human Identity — WebAuthn

Humans authenticate exclusively via **WebAuthn** (FIDO2). There are no passwords.

```
┌─────────────────────────────────────────────┐
│              HumanIdentity                  │
├─────────────────────────────────────────────┤
│  identity_id:    UUID (FK → Identity)       │
│  email:          VARCHAR(255) UNIQUE        │
│  webauthn_credentials: JSONB                │
│    [                                          │
│      { credential_id, public_key,            │
│        sign_count, transports,               │
│        aaguid }                               │
│    ]                                          │
│  last_auth_at:   TIMESTAMP                   │
└─────────────────────────────────────────────┘
```

**Registration Flow:**

```
Client                          Server                      Authenticator
  │                               │                             │
  │  POST /identity/register-begin│                             │
  │  { email, display_name }─────►│                             │
  │                               │  Generate challenge         │
  │◄──── { challenge, rp, user }─│                             │
  │                               │                             │
  │  navigator.credentials.create()─────────────────────────────►│
  │                               │                    User taps│
  │◄──── attestation ───────────────────────────────────────────│
  │                               │                             │
  │  POST /identity/register-finish                             │
  │  { attestation, clientData }──►│                             │
  │                               │  Verify attestation         │
  │                               │  Store credential           │
  │◄──── { identity_id, suffix }──│                             │
```

**Authentication Flow:**

```
Client                          Server                      Authenticator
  │                               │                             │
  │  POST /identity/auth-begin    │                             │
  │  { email }───────────────────►│                             │
  │                               │  Lookup credentials         │
  │                               │  Generate challenge         │
  │◄──── { challenge, cred_ids }──│                             │
  │                               │                             │
  │  navigator.credentials.get()────────────────────────────────►│
  │                               │                    User taps│
  │◄──── assertion ─────────────────────────────────────────────│
  │                               │                             │
  │  POST /identity/auth-finish   │                             │
  │  { assertion }───────────────►│                             │
  │                               │  Verify signature           │
  │                               │  Issue JWT + refresh token  │
  │◄──── { access_jwt, refresh }──│                             │
```

### 3.3 Agent Identity — Keypair

Agents authenticate via an **Ed25519 keypair**. The private key never leaves the agent's runtime; the public key is registered with the Identity Service.

```
┌─────────────────────────────────────────────┐
│              AgentIdentity                  │
├─────────────────────────────────────────────┤
│  identity_id:    UUID (FK → Identity)       │
│  public_key:     BYTEA (Ed25519, 32 bytes)  │
│  key_algorithm:  VARCHAR(32) DEFAULT 'Ed25519'│
│  agent_card_url: VARCHAR(512)               │
│  capabilities:   JSONB                      │
│  owner_id:       UUID (FK → Identity)       │
│  last_seen_at:   TIMESTAMP                  │
└─────────────────────────────────────────────┘
```

**Agent Authentication Flow:**

```
Agent                          Identity Service
  │                               │
  │  POST /identity/agent/register│
  │  { display_name, public_key,  │
  │    capabilities, owner_token }│
  │──────────────────────────────►│
  │                               │  Validate owner token
  │                               │  Create Identity + AgentIdentity
  │◄──── { identity_id, suffix }──│
  │                               │
  │  ── On each API call ──       │
  │                               │
  │  POST /identity/agent/auth    │
  │  { identity_id, timestamp,    │
  │    signature }───────────────►│
  │                               │  Verify Ed25519 signature
  │                               │  Check timestamp freshness (±30s)
  │◄──── { access_jwt }───────────│
```

### 3.4 Suffix Enforcement

Every identity receives a **globally unique suffix** that serves as a short, human-readable discriminator. Suffixes follow the format:

- **Humans:** `@<username>#<4-digit-hex>` — e.g., `@alice#a3f1`
- **Agents:** `@<name>.agent#<4-digit-hex>` — e.g., `@codebot.agent#7b2c`

The `.agent` infix in agent suffixes makes agent participation transparent in any UI. Suffix uniqueness is enforced by a PostgreSQL unique index on `Identity.suffix`.

**Suffix generation algorithm:**

```
function generateSuffix(kind: 'human' | 'agent', displayName: string): string {
  const base = slugify(displayName).toLowerCase();
  const hex = crypto.randomBytes(2).toString('hex');  // 4 hex chars
  const infix = kind === 'agent' ? '.agent' : '';
  return `@${base}${infix}#${hex}`;
}
```

Collision handling: if the generated suffix collides (extremely unlikely with 65,536 hex values per base), regenerate with a new random hex. Up to 5 retries before erroring.

---

## 4. Messaging Architecture

**Status: `[PARTIAL]`** — OpenIM integration is designed but not implemented. NestJS messaging module exists with in-memory stores. No real message delivery.

### 4.1 Why OpenIM

OpenIM was chosen over self-built and alternative messaging platforms for the following reasons:

- **Production-grade** — OpenIM powers messaging for millions of users in production deployments.
- **Pluggable architecture** — Authentication, message storage, and push are all hookable.
- **gRPC + HTTP APIs** — Suitable for both service-to-service and client-to-server communication.
- **Open source** — Apache 2.0 license; no vendor lock-in.
- **WebSocket support** — Native long-connection protocol for real-time delivery.

### 4.2 Room Types

KALEN defines four room types built on OpenIM's group model:

| Room Type | OpenIM Group Type | Max Members | Purpose |
|-----------|-------------------|-------------|---------|
| `direct` | Single Chat | 2 | Private 1:1 conversation (human↔human or human↔agent) |
| `team` | Group | 200 | Team collaboration, typically within an organization |
| `agent_war_room` | Group | 50 | Multi-agent collaboration on a task; agents and humans mixed |
| `broadcast` | Group | 10,000 | One-to-many announcements; only admins can send |

**Room membership rules:**

```
┌────────────────────────────────────────────────────────────────┐
│                    Room Membership Matrix                       │
├──────────────┬─────────┬──────┬────────────────┬──────────────┤
│   Action     │ direct  │ team │ agent_war_room │  broadcast   │
├──────────────┼─────────┼──────┼────────────────┼──────────────┤
│ Human join   │ invite  │ open │ invite         │  open (ro)   │
│ Agent join   │ invite  │ open │ invite/auto    │  no (listen) │
│ Send message │ members │ any  │ members        │  admins only │
│ Add reaction │ members │ any  │ members        │  any         │
│ Create room  │ auto    │ any  │ task trigger   │  admin only  │
└──────────────┴─────────┴──────┴────────────────┴──────────────┘
```

### 4.3 Message Flow

A message traverses the following path from sender to recipient:

```
┌────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│ Sender │────►│ API Gateway  │────►│ Messaging     │────►│ OpenIM       │
│ Client │     │              │     │ Service       │     │ Server       │
└────────┘     └──────────────┘     └───────┬───────┘     └──────┬───────┘
                                            │                    │
                                    ┌───────▼───────┐    ┌──────▼───────┐
                                    │ Enrich message│    │ Persist to   │
                                    │ - Add trace ID│    │ MongoDB      │
                                    │ - Sanitize    │    │ (OpenIM's    │
                                    │ - Check ACL   │    │  store)      │
                                    └───────┬───────┘    └──────┬───────┘
                                            │                    │
                                    ┌───────▼───────┐    ┌──────▼───────┐
                                    │ Publish to    │    │ Push via     │
                                    │ NATS          │    │ WebSocket    │
                                    │ KALEN.MSG     │    │ to online    │
                                    └───────────────┘    │ recipients   │
                                                         └──────────────┘
```

**Message enrichment** (performed by the Messaging Service before forwarding to OpenIM):

1. **Trace ID injection** — Every message receives a `X-Kalen-Trace-Id` header for end-to-end tracing.
2. **ACL check** — Verify the sender has permission to send in this room type.
3. **Content sanitization** — Strip potentially dangerous HTML; allow markdown only.
4. **Mention resolution** — Expand `@agent:codebot` mentions to identity IDs; trigger agent notification if mentioned.

### 4.4 Message Schema (KALEN Envelope)

KALEN wraps OpenIM messages with an enrichment envelope stored alongside the original:

```json
{
  "message_id": "uuid",
  "room_id": "uuid",
  "sender_suffix": "@alice#a3f1",
  "sender_kind": "human",
  "trace_id": "trace-uuid",
  "openim_msg_data": { "...original OpenIM message..." },
  "mentions": ["@codebot.agent#7b2c"],
  "mcp_tool_invocations": [],
  "a2a_task_refs": [],
  "created_at": "2026-06-08T12:00:00Z",
  "edited_at": null,
  "deleted_at": null
}
```

### 4.5 OpenIM Integration Points

```
┌──────────────────────────────────────────────────────────────────────┐
│                     OpenIM Integration Map                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    Webhook callback    ┌───────────────────────┐  │
│  │ OpenIM       │───────────────────────►│ KALEN Webhook Handler │  │
│  │ Server       │  (msg sent, msg read,  │ (enriches, indexes,   │  │
│  │              │   group member change) │  triggers agent notify)│  │
│  └──────┬───────┘                        └───────────────────────┘  │
│         │                                                            │
│         │ gRPC                                                       │
│         │                                                            │
│  ┌──────▼───────┐                                                    │
│  │ Messaging    │◄── REST API calls from KALEN services              │
│  │ Service      │    (create room, send system message, etc.)        │
│  └──────────────┘                                                    │
│                                                                      │
│  ┌──────────────┐    Auth callback                                   │
│  │ OpenIM       │───────────────────► Identity Service               │
│  │ Auth Hook    │                    (validates KALEN JWT)           │
│  └──────────────┘                                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key integration decisions:**

- KALEN does **not** use OpenIM's built-in user management. Instead, the OpenIM auth hook delegates to the KALEN Identity Service, which validates JWTs and returns OpenIM-compatible user info.
- KALEN uses OpenIM's **callback/webhook system** to receive real-time notifications of message events, which it then enriches and indexes.
- OpenIM's MongoDB is treated as **OpenIM's internal store** — KALEN does not read from it directly. All KALEN queries go through the Messaging Service, which uses OpenIM's APIs.

---

## 5. MCP Integration

**Status: `[PARTIAL]`** — @kalen/mcp-gateway implements GatewayService, MCPServer, MCPClient, AllowList with 71 tests. Tool handlers return structured JSON but are not wired to real services.

### 5.1 Gateway Pattern

KALEN implements an **MCP Gateway** that sits between KALEN agents and MCP tool servers. The gateway provides:

1. **Tool discovery and registration** — Tool servers register their capabilities with the gateway.
2. **Permission enforcement** — Each tool invocation is checked against the calling agent's RBAC permissions.
3. **Rate limiting** — Per-tool, per-agent rate limits to prevent abuse.
4. **Result caching** — Idempotent tool results are cached in Redis with configurable TTL.
5. **Audit logging** — Every invocation and result is logged for compliance.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  KALEN Agent │────►│ MCP Gateway  │────►│ MCP Tool Server  │
│              │     │              │     │ (e.g., GitHub)   │
│  "Call tool  │     │ 1. Auth check│     │                  │
│   github/    │     │ 2. Rate limit│     │  Processes tool  │
│   create_    │     │ 3. Route     │     │  call            │
│   issue"     │     │ 4. Audit log │     │                  │
│              │◄────│ 5. Cache     │◄────│  Returns result  │
│              │     │              │     │                  │
└──────────────┘     └──────────────┘     └──────────────────┘
```

### 5.2 Tool Discovery

Tool servers expose a `/tools/list` endpoint per the MCP specification. On startup, the MCP Gateway:

1. Reads the configured list of tool server URLs from its config.
2. Calls each server's `/tools/list` endpoint.
3. Merges all tools into a unified tool catalog.
4. Publishes the catalog to NATS (`kalen.mcp.catalog_updated`).
5. Re-discovers on a configurable interval (default: 60s) or on NATS signal.

```
┌──────────────────┐    /tools/list    ┌──────────────┐
│ MCP Tool Server A│──────────────────►│              │
│ (GitHub)         │                   │  MCP Gateway │
└──────────────────┘                   │              │
                                       │  Unified     │
┌──────────────────┐    /tools/list    │  Tool        │
│ MCP Tool Server B│──────────────────►│  Catalog     │
│ (Slack)          │                   │              │
└──────────────────┘                   │              │
                                       │              │
┌──────────────────┐    /tools/list    │              │
│ MCP Tool Server C│──────────────────►│              │
│ (Database)       │                   │              │
└──────────────────┘                   └──────┬───────┘
                                              │
                                       ┌──────▼───────┐
                                       │    NATS      │
                                       │  Publish:    │
                                       │  kalen.mcp.  │
                                       │  catalog_    │
                                       │  updated     │
                                       └──────────────┘
```

**Tool catalog entry:**

```json
{
  "tool_id": "github.create_issue",
  "server_url": "https://mcp-github.internal:8080",
  "name": "create_issue",
  "description": "Create a GitHub issue in a repository",
  "input_schema": { "...JSON Schema..." },
  "output_schema": { "...JSON Schema..." },
  "requires_permission": "mcp:github:write",
  "rate_limit": { "max_calls": 100, "window_seconds": 60 },
  "cache_ttl_seconds": 0,
  "idempotent": false
}
```

### 5.3 Tool Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│                     Tool Lifecycle States                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐   register    ┌──────────┐   health_ok          │
│  │ Unknown  │──────────────►│ Discovered│──────────────────┐   │
│  └──────────┘               └──────────┘                   │   │
│                                  │                     ┌───▼───┐│
│                                  │ health_fail         │ Active ││
│                                  ▼                     └───┬───┘│
│                              ┌──────────┐                 │    │
│                              │ Degraded │◄────────────────┘    │
│                              └──────┬───┘   health_fail        │
│                                     │                         │
│                                     │ config_remove           │
│                                     ▼                         │
│                              ┌──────────┐                     │
│                              │ Removed  │◄────────────────────┘
│                              └──────────┘    manual_remove
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**State descriptions:**

| State | Meaning | Transitions |
|-------|---------|-------------|
| `Unknown` | Tool server not yet contacted | → `Discovered` on successful `/tools/list` |
| `Discovered` | Server responded; tools cataloged | → `Active` when health check passes; → `Removed` if unreachable after retry |
| `Active` | Healthy and serving requests | → `Degraded` on health check failure; → `Removed` on manual removal |
| `Degraded` | Intermittent failures; requests retried with backoff | → `Active` on health recovery; → `Removed` after 5 consecutive failures |
| `Removed` | No longer in catalog; pending invocations fail gracefully | → `Discovered` if re-added and `/tools/list` succeeds |

### 5.4 Invocation Flow

```
Agent                   MCP Gateway                  Tool Server        Audit/NATS
  │                         │                            │                │
  │  POST /mcp/v1/invoke   │                            │                │
  │  { tool_id, input,     │                            │                │
  │    request_id }───────►│                            │                │
  │                         │  1. Validate JWT           │                │
  │                         │  2. Check permission       │                │
  │                         │  3. Check rate limit       │                │
  │                         │  4. Check cache            │                │
  │                         │                            │                │
  │                         │  POST /tools/call          │                │
  │                         │  { name, input }──────────►│                │
  │                         │                            │                │
  │                         │                     Process│                │
  │                         │                            │                │
  │                         │  { output, is_error }──────│                │
  │                         │◄───────────────────────────│                │
  │                         │                            │                │
  │                         │  5. Cache result (if idem) │                │
  │                         │  6. Publish audit event    │                │
  │                         │────────────────────────────────────────────►│
  │                         │                            │    NATS:       │
  │  { output, trace_id }  │                            │  kalen.mcp.   │
  │◄────────────────────────│                            │  tool_invoked │
  │                         │                            │                │
```

---

## 6. A2A Integration

**Status: `[PARTIAL]`** — @kalen/a2a-router implements A2ARouterService, AgentCardService, TaskLifecycle, real Ed25519 card signing with 100 tests. Task storage is in-memory.

### 6.1 Router Pattern

The A2A Router is KALEN's mechanism for enabling agents to discover, delegate to, and coordinate with other agents. It implements the A2A protocol specification for inter-agent communication.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         A2A Router                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐                          ┌────────────┐             │
│  │ Agent A    │──► "Create task for B" ──►│  Router    │             │
│  │ (Requester)│                          │  Core      │             │
│  └────────────┘                          └─────┬──────┘             │
│                                                │                    │
│                                    ┌───────────┼───────────┐       │
│                                    │           │           │       │
│                              ┌─────▼──┐  ┌─────▼──┐  ┌─────▼──┐  │
│                              │Agent B │  │Agent C │  │Agent D │  │
│                              │(Worker)│  │(Worker)│  │(Worker)│  │
│                              └────────┘  └────────┘  └────────┘  │
│                                                                      │
│  Router responsibilities:                                            │
│  1. Resolve target agent from agent card registry                    │
│  2. Validate requester has permission to delegate                    │
│  3. Route task request to target agent                               │
│  4. Track task lifecycle (created → working → completed/failed)      │
│  5. Relay artifacts back to requester                                │
│  6. Handle timeouts and retries                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Agent Card

Every agent registered with KALEN publishes an **Agent Card** — a machine-readable document describing its capabilities, accepted input schemas, and interaction protocols. The Agent Card follows the A2A specification.

```json
{
  "schema_version": "1.0",
  "agent_identity": {
    "suffix": "@codebot.agent#7b2c",
    "display_name": "CodeBot",
    "description": "Writes, reviews, and refactors code across multiple languages"
  },
  "capabilities": [
    {
      "id": "code.write",
      "name": "Write Code",
      "description": "Generates code from a natural language specification",
      "input_schema": { "...JSON Schema..." },
      "output_artifact_types": ["source_code", "diff"]
    },
    {
      "id": "code.review",
      "name": "Review Code",
      "description": "Reviews code for bugs, style, and security issues",
      "input_schema": { "...JSON Schema..." },
      "output_artifact_types": ["review_report"]
    }
  ],
  "interaction_protocols": {
    "synchronous": false,
    "streaming": true,
    "max_concurrent_tasks": 5,
    "average_task_duration_seconds": 30,
    "timeout_seconds": 300
  },
  "auth_requirements": {
    "key_algorithm": "Ed25519",
    "delegation_allowed": true
  }
}
```

**Agent Card storage:** Agent cards are stored in PostgreSQL (`agent_cards` table) and cached in Redis for fast lookup during routing decisions. When an agent updates its card, the change is published to NATS (`kalen.a2a.card_updated`), triggering cache invalidation across router instances.

### 6.3 Task Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    A2A Task Lifecycle                            │
│                                                                  │
│  ┌───────────┐         ┌───────────┐        ┌───────────────┐  │
│  │  Created  │────────►│  Working  │───────►│  Completed    │  │
│  └───────────┘         └─────┬─────┘        └───────────────┘  │
│       │                      │                                   │
│       │                      │           ┌───────────────┐      │
│       │                      └──────────►│   Failed      │      │
│       │                                  └───────────────┘      │
│       │                                                         │
│       │              ┌───────────┐                              │
│       └─────────────►│  Cancelled│                              │
│                      └───────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

State transitions:
  Created   → Working     (agent accepts task)
  Created   → Cancelled   (requester cancels before acceptance)
  Working   → Completed   (agent produces final artifact)
  Working   → Failed      (agent encounters unrecoverable error)
  Working   → Cancelled   (requester cancels; agent stops gracefully)
```

**Task schema:**

```
┌────────────────────────────────────────────────────────────────┐
│                       A2A Task                                 │
├────────────────────────────────────────────────────────────────┤
│  task_id:          UUID (primary key)                          │
│  requester_id:     UUID (FK → Identity)                        │
│  worker_id:        UUID (FK → Identity, nullable until accepted)│
│  capability_id:    VARCHAR(128)                                │
│  status:           ENUM('created','working','completed',       │
│                         'failed','cancelled')                  │
│  input:            JSONB                                       │
│  created_at:       TIMESTAMP                                   │
│  accepted_at:      TIMESTAMP (nullable)                        │
│  completed_at:     TIMESTAMP (nullable)                        │
│  timeout_at:       TIMESTAMP                                   │
│  error_message:    TEXT (nullable)                             │
│  parent_task_id:   UUID (FK → A2A Task, nullable)              │
│  trace_id:         UUID (for distributed tracing)              │
└────────────────────────────────────────────────────────────────┘
```

### 6.4 Artifact Flow

When a task completes, the worker agent produces **artifacts** — structured outputs that are stored and relayed back to the requester.

```
Worker Agent              A2A Router                Requester Agent
     │                        │                           │
     │  POST /a2a/v1/tasks/   │                           │
     │  {task_id}/artifact    │                           │
     │  {                     │                           │
     │    artifact_type,      │                           │
     │    content,            │                           │
     │    metadata            │                           │
     │  }────────────────────►│                           │
     │                        │  1. Validate artifact     │
     │                        │  2. Store in MinIO        │
     │                        │  3. Update task status    │
     │                        │  4. Publish to NATS       │
     │                        │     kalen.a2a.artifact_   │
     │                        │     produced              │
     │                        │                           │
     │                        │  WebSocket / SSE push     │
     │                        │──────────────────────────►│
     │                        │                           │
     │                        │  Or: GET /a2a/v1/tasks/   │
     │                        │  {task_id}/artifacts      │
     │                        │◄──────────────────────────│
     │                        │                           │
```

**Artifact schema:**

```json
{
  "artifact_id": "uuid",
  "task_id": "uuid",
  "artifact_type": "source_code",
  "storage_ref": "minio://kalen-artifacts/{task_id}/{artifact_id}.json",
  "metadata": {
    "language": "typescript",
    "lines_of_code": 142,
    "has_tests": true
  },
  "created_at": "2026-06-08T12:05:00Z"
}
```

Artifacts are stored as objects in MinIO. The `storage_ref` is a URI that the A2A Router resolves to a presigned download URL when the requester fetches the artifact. This avoids storing large payloads in PostgreSQL and leverages MinIO's built-in access control.

### 6.5 Multi-Agent Orchestration

For complex tasks that require multiple agents working together, the A2A Router supports **parent-child task decomposition**:

```
┌───────────────────────────────────────────────────────────────────┐
│              Multi-Agent Task Decomposition                       │
│                                                                   │
│  User: "Build a login page and deploy it"                        │
│                                                                   │
│  ┌──────────────────┐                                            │
│  │ Orchestrator     │                                            │
│  │ Agent            │                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│     ┌─────┼─────────────────┐                                    │
│     │     │                  │                                    │
│     ▼     ▼                  ▼                                    │
│  ┌──────┐ ┌──────┐    ┌──────────┐                              │
│  │Design│ │Code  │    │Deploy    │                              │
│  │Agent │ │Agent │    │Agent     │                              │
│  └──┬───┘ └──┬───┘    └────┬─────┘                              │
│     │        │             │                                     │
│     │  UI mockup    Source code   Deployment                     │
│     │  artifact     artifact      artifact                       │
│     │        │             │                                     │
│     └────────┴─────────────┘                                     │
│              │                                                    │
│              ▼                                                    │
│  Orchestrator aggregates artifacts, reports to user               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

The `parent_task_id` field in the Task schema enables this tree structure. The orchestrator agent creates child tasks, monitors their progress, and aggregates their artifacts.

---

## 7. Security Design

**Status: `[PARTIAL]`** — Threat model defined. Ed25519 signing, JWT, RBAC implemented and tested. Challenge store, rate limiting, output sanitization, and audit logging are in-memory stubs.

### 7.1 Threat Model

KALEN identifies the following threat categories, modeled after STRIDE:

| Threat | Example | Mitigation |
|--------|---------|------------|
| **Spoofing** | Agent impersonates a human | Suffix enforcement (`.agent` infix); separate auth mechanisms; JWT includes `kind` claim |
| **Tampering** | Message modified in transit | TLS everywhere; message integrity headers; Ed25519 signatures for agent messages |
| **Repudiation** | Agent denies making a tool call | Audit log with cryptographic receipts; all actions trace-linked |
| **Information Disclosure** | Agent reads messages in rooms it shouldn't | RBAC with room-level ACLs; data access audits |
| **Denial of Service** | Agent floods MCP tool invocations | Per-agent rate limiting; circuit breaker on MCP Gateway |
| **Elevation of Privilege** | Agent gains admin RBAC role | Role assignment requires human approval; role changes are audited |

### 7.2 Dual Authentication

KALEN employs a dual authentication system — one path for humans, one for agents — that converges on a common JWT format.

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Dual Authentication                              │
│                                                                      │
│  ┌─────────────┐                              ┌─────────────┐      │
│  │   Human     │                              │   Agent     │      │
│  │             │                              │             │      │
│  │  WebAuthn   │                              │  Ed25519    │      │
│  │  (FIDO2)    │                              │  Keypair    │      │
│  │             │                              │             │      │
│  └──────┬──────┘                              └──────┬──────┘      │
│         │                                            │             │
│         ▼                                            ▼             │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                  Identity Service                         │      │
│  │                                                           │      │
│  │  Verifies:            Verifies:                           │      │
│  │  - WebAuthn signature  - Ed25519 signature               │      │
│  │  - Credential ID       - Public key identity              │      │
│  │  - Origin + RP ID      - Timestamp freshness (±30s)      │      │
│  │                                                           │      │
│  │  Issues JWT with:                                         │      │
│  │  { sub: identity_id,                                     │      │
│  │    kind: "human"|"agent",                                │      │
│  │    suffix: "@alice#a3f1",                                │      │
│  │    roles: [...],                                          │      │
│  │    iat, exp }                                             │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**JWT claims:**

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | UUID | Identity ID |
| `kind` | `human` \| `agent` | Identity type — enforced at API gateway; agents cannot access human-only endpoints |
| `suffix` | string | Full suffix (e.g., `@codebot.agent#7b2c`) |
| `roles` | string[] | RBAC roles assigned to this identity |
| `iat` | number | Issued-at timestamp |
| `exp` | number | Expiration timestamp (default: 15 minutes for access tokens) |
| `jti` | UUID | Token ID for revocation checking |

### 7.3 RBAC Model

KALEN uses a role-based access control model with the following predefined roles:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RBAC Role Hierarchy                          │
│                                                                      │
│                        ┌───────────┐                                │
│                        │  system   │                                │
│                        │  admin    │                                │
│                        └─────┬─────┘                                │
│                              │                                      │
│                    ┌─────────┼─────────┐                            │
│                    │         │         │                            │
│              ┌─────▼──┐ ┌───▼────┐ ┌──▼───────┐                   │
│              │ org    │ │ agent  │ │ security │                    │
│              │ admin  │ │ admin  │ │ auditor  │                    │
│              └────┬───┘ └───┬────┘ └──────────┘                    │
│                   │         │                                       │
│             ┌─────┼────┐    │                                       │
│             │     │    │    │                                       │
│          ┌──▼─┐┌─▼──┐│┌───▼────┐                                  │
│          │team││room│││ agent  │                                    │
│          │mod ││mod │││operator│                                    │
│          └────┘└────┘│└────────┘                                   │
│                    │                                                │
│               ┌────▼─────┐                                         │
│               │  member  │                                         │
│               └──────────┘                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Role permissions matrix:**

| Permission | system_admin | org_admin | agent_admin | agent_operator | member |
|-----------|-------------|-----------|-------------|----------------|--------|
| Create organization | ✓ | — | — | — | — |
| Manage org settings | ✓ | ✓ | — | — | — |
| Register/Remove agents | ✓ | ✓ | ✓ | — | — |
| Assign agent capabilities | ✓ | ✓ | ✓ | — | — |
| Invoke MCP tools | ✓ | ✓ | ✓ | ✓ | — |
| Create A2A tasks | ✓ | ✓ | ✓ | ✓ | — |
| Send messages | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read messages | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage rooms | ✓ | ✓ | — | — | — |
| View audit logs | ✓ | — | — | — | ✓ (own) |
| Manage RBAC | ✓ | ✓ | — | — | — |

### 7.4 Audit Trail

Every state-changing action produces an audit event:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Audit Event Schema                             │
├─────────────────────────────────────────────────────────────────────┤
│  event_id:       UUID                                               │
│  trace_id:       UUID (correlates to request trace)                 │
│  actor_id:       UUID (identity that performed the action)          │
│  actor_kind:     'human' | 'agent'                                 │
│  action:         VARCHAR(128) (e.g., 'mcp.tool_invoked')           │
│  resource_type:  VARCHAR(64) (e.g., 'room', 'task', 'tool')       │
│  resource_id:    UUID                                               │
│  outcome:        'success' | 'denied' | 'error'                   │
│  details:        JSONB (action-specific context)                   │
│  source_ip:      INET                                               │
│  user_agent:     VARCHAR(512)                                       │
│  timestamp:      TIMESTAMP                                          │
└─────────────────────────────────────────────────────────────────────┘
```

Audit events are:
1. Written to PostgreSQL (durable, queryable).
2. Published to NATS (`kalen.audit.*`).
3. Consumed by Elasticsearch (full-text search, analytics).
4. Archived to MinIO (cold storage, compliance retention).

---

## 8. Data Architecture

**Status: `[DESIGN]`** — Schema designs are complete; no database instances are deployed.

### 8.1 PostgreSQL + pgvector

PostgreSQL is the primary relational store. pgvector extends it with vector similarity search for semantic retrieval.

**Schemas and Tables:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Cluster                               │
│                                                                      │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │ identity_schema   │  │ messaging_schema  │  │ a2a_schema      │ │
│  │                   │  │                   │  │                 │ │
│  │ - identities      │  │ - rooms           │  │ - tasks         │ │
│  │ - human_identities│  │ - room_members    │  │ - artifacts     │ │
│  │ - agent_identities│  │ - message_envelopes│ │ - agent_cards   │ │
│  │ - identity_roles  │  │ - mentions        │  │ - delegations   │ │
│  │ - roles           │  │ - reactions       │  │                 │ │
│  │ - webauthn_creds  │  │ - room_configs    │  │                 │ │
│  └───────────────────┘  └───────────────────┘  └─────────────────┘ │
│                                                                      │
│  ┌───────────────────┐  ┌───────────────────┐                       │
│  │ mcp_schema        │  │ audit_schema      │                       │
│  │                   │  │                   │                       │
│  │ - tool_catalog    │  │ - audit_events    │                       │
│  │ - invocations     │  │ - audit_archive   │                       │
│  │ - rate_limits     │  │                   │                       │
│  └───────────────────┘  └───────────────────┘                       │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ vector_schema (pgvector)                                     │  │
│  │                                                              │  │
│  │ - embeddings                                                 │  │
│  │   (id, source_type, source_id, embedding vector(1536),       │  │
│  │    model_name, created_at)                                   │  │
│  │                                                              │  │
│  │  Index: ivfflat on embedding                                 │  │
│  │  Supports: cosine similarity, L2 distance, inner product     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Vector use cases:**

- Semantic search across messages (find "similar discussions" not just keyword matches)
- Agent capability matching (find the best agent for a task based on semantic similarity of capability descriptions)
- Duplicate detection (identify near-duplicate tasks or artifacts)

### 8.2 Redis

Redis serves three distinct purposes:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Redis Instances                           │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ Session Store    │  │ Cache Layer     │  │ Rate Limiter    ││
│  │ (DB 0)          │  │ (DB 1)          │  │ (DB 2)          ││
│  │                 │  │                 │  │                 ││
│  │ - JWT blacklist │  │ - Agent cards   │  │ - MCP per-agent ││
│  │ - WS session    │  │ - Tool catalog  │  │ - API per-IP    ││
│  │   mapping       │  │ - Room configs  │  │ - A2A per-agent ││
│  │ - OTP tokens    │  │ - User presence │  │                 ││
│  │                 │  │ - Search results│  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 MinIO

MinIO provides S3-compatible object storage:

```
┌─────────────────────────────────────────────────────────────────┐
│                        MinIO Buckets                             │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ kalen-attachments    │  │ kalen-artifacts      │            │
│  │                      │  │                      │            │
│  │ Message attachments: │  │ A2A task artifacts:  │            │
│  │ images, documents,   │  │ source code, reports,│            │
│  │ files                │  │ data, configs        │            │
│  │                      │  │                      │            │
│  │ Retention: 90 days   │  │ Retention: 1 year    │            │
│  │ Max size: 50 MB      │  │ Max size: 500 MB     │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ kalen-audit-archive  │  │ kalen-backups        │            │
│  │                      │  │                      │            │
│  │ Compressed audit     │  │ PostgreSQL dumps,    │            │
│  │ logs (cold storage)  │  │ config snapshots     │            │
│  │                      │  │                      │            │
│  │ Retention: 7 years   │  │ Retention: 30 days   │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 NATS

NATS JetStream provides the event backbone with guaranteed delivery and replay:

```
┌─────────────────────────────────────────────────────────────────┐
│                    NATS JetStream Streams                        │
│                                                                  │
│  Stream           Subjects                       Retention      │
│  ──────────       ──────────                     ──────────     │
│  KALEN_MSG        kalen.msg.*                    7 days         │
│  KALEN_IDENTITY   kalen.identity.*               30 days        │
│  KALEN_MCP        kalen.mcp.*                    30 days        │
│  KALEN_A2A        kalen.a2a.*                    30 days        │
│  KALEN_AUDIT      kalen.audit.*                  90 days        │
│  KALEN_SYSTEM     kalen.system.*                 7 days         │
│                                                                  │
│  Consumer Groups:                                                │
│  - es-indexer-msg       (KALEN_MSG → Elasticsearch)             │
│  - es-indexer-audit     (KALEN_AUDIT → Elasticsearch)           │
│  - push-notifier        (KALEN_MSG → WebSocket/SSE push)        │
│  - audit-archiver       (KALEN_AUDIT → MinIO cold storage)      │
│  - mcp-audit-logger     (KALEN_MCP → PostgreSQL audit)          │
│  - a2a-notifier         (KALEN_A2A → WebSocket/SSE push)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Elasticsearch

Elasticsearch provides full-text search and analytics:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Elasticsearch Indices                          │
│                                                                  │
│  Index                  Source               Shards  Replicas    │
│  ──────                 ──────               ──────  ────────   │
│  kalen-messages         Messaging Service    3       1           │
│  kalen-tasks            A2A Router           2       1           │
│  kalen-audit            Audit Service        3       1           │
│  kalen-tool-invocations MCP Gateway          2       1           │
│                                                                  │
│  Search Features:                                                │
│  - Full-text with highlighting                                  │
│  - Faceted search (by room, sender, date range, kind)           │
│  - Aggregations (message volume, tool usage, agent activity)    │
│  - Fuzzy matching for typo tolerance                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.6 Data Flow Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Complete Data Flow Map                          │
│                                                                      │
│  Write Path:                                                         │
│  Client → API GW → Service → PostgreSQL (durable)                   │
│                            → NATS (event)                            │
│                            → Redis (cache update)                    │
│                                                                      │
│  Read Path (hot):                                                    │
│  Client → API GW → Service → Redis (cache hit)                      │
│                                                                      │
│  Read Path (cold):                                                   │
│  Client → API GW → Service → PostgreSQL (cache miss)                │
│                                                                      │
│  Search Path:                                                        │
│  Client → API GW → Service → Elasticsearch                          │
│                                                                      │
│  Vector Search Path:                                                 │
│  Client → API GW → Service → PostgreSQL (pgvector)                  │
│                                                                      │
│  Object Path:                                                        │
│  Client → API GW → Service → MinIO (presigned URL)                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. Scalability Design

**Status: `[DESIGN]`**

### 9.1 Horizontal Scaling Strategy

All KALEN services are designed to be horizontally scalable — they hold no local state that prevents running multiple instances behind a load balancer.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Horizontal Scaling Topology                        │
│                                                                      │
│                     ┌────────────────────┐                          │
│                     │   Load Balancer    │                          │
│                     │   (L7 / Envoy)     │                          │
│                     └─────────┬──────────┘                          │
│                               │                                      │
│            ┌──────────────────┼──────────────────┐                  │
│            │                  │                   │                  │
│     ┌──────▼─────┐   ┌──────▼─────┐    ┌──────▼─────┐            │
│     │ Identity   │   │ Messaging  │    │ MCP        │            │
│     │ Service x3 │   │ Service x5 │    │ Gateway x3 │            │
│     └────────────┘   └────────────┘    └────────────┘            │
│                                                                      │
│     ┌────────────┐   ┌────────────┐                                │
│     │ A2A Router │   │ OpenIM     │                                │
│     │ x3         │   │ Server x3  │                                │
│     └────────────┘   └────────────┘                                │
│                                                                      │
│     State is externalized to:                                        │
│     - PostgreSQL (durable)                                          │
│     - Redis (session/cache)                                         │
│     - NATS (events)                                                 │
│     - MinIO (objects)                                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Scaling triggers (auto-scale policies):**

| Service | Scale Metric | Scale Up Threshold | Scale Down Threshold |
|---------|-------------|-------------------|---------------------|
| Identity | CPU / auth RPS | > 70% CPU or > 500 RPS | < 20% CPU for 10 min |
| Messaging | WebSocket connections | > 10K connections/instance | < 2K connections for 10 min |
| MCP Gateway | Tool invocation RPS | > 1K RPS/instance | < 100 RPS for 10 min |
| A2A Router | Active tasks | > 500 active tasks/instance | < 50 tasks for 10 min |

### 9.2 Database Sharding Strategy

**Status: `[DESIGN]`** — PostgreSQL is currently single-node. Sharding is a future design.

For future scale, KALEN plans a tenant-based sharding strategy:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Sharding Strategy                                  │
│                                                                      │
│  Shard Key: organization_id (for org-scoped data)                   │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Shard 0     │  │ Shard 1     │  │ Shard 2     │                │
│  │ org_ids:    │  │ org_ids:    │  │ org_ids:    │                │
│  │ 0x00 - 0x55 │  │ 0x56 - 0xAA │  │ 0xAB - 0xFF │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                      │
│  Cross-shard data:                                                   │
│  - Global identity registry (unsharded, on a coordination shard)    │
│  - Audit events (sharded by actor_id, not org_id)                   │
│  - Agent cards (sharded by agent identity_id)                       │
│                                                                      │
│  Routing:                                                            │
│  - PgBouncer with routing rules based on org_id prefix              │
│  - Service layer resolves shard from org_id → shard mapping table   │
│                                                                      │
│  Vector search:                                                      │
│  - Each shard has its own pgvector index                            │
│  - Fan-out query: search all shards, merge top-K results            │
│  - Future: dedicated vector shard when scale demands it              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.3 NATS Clustering

```
┌──────────────────────────────────────────────────────────────────────┐
│                    NATS Cluster (3-node)                              │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  NATS Node 1 │◄──►│  NATS Node 2 │◄──►│  NATS Node 3 │          │
│  │  (Leader)    │    │  (Follower)  │    │  (Follower)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
│  JetStream: Raft consensus for stream leadership                    │
│  Stream replicas: 3 (one per node)                                  │
│  Consumer replicas: 3                                               │
│  Automatic failover on leader loss                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Deployment Design

**Status: `[DESIGN]`** — No deployment configurations exist yet.

### 10.1 Docker Compose (Development)

```yaml
# docker-compose.dev.yml — Design, not yet created

version: "3.9"

services:
  # ─── Data Plane ────────────────────────────────────────
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: kalen
      POSTGRES_USER: kalen
      POSTGRES_PASSWORD: kalen_dev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: kalen_dev
      MINIO_ROOT_PASSWORD: kalen_dev_secret
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

  elasticsearch:
    image: elasticsearch:8.12.0
    ports: ["9200:9200"]
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - esdata:/usr/share/elasticsearch/data

  nats:
    image: nats:2.10-alpine
    ports: ["4222:4222", "8222:8222"]
    command: --jetstream --store_dir /data
    volumes:
      - natsdata:/data

  # ─── OpenIM ────────────────────────────────────────────
  openim-server:
    image: openim/openim-server:latest
    ports: ["10001:10001", "10002:10002"]
    depends_on: [mongo, redis]
    # ... OpenIM configuration

  openim-chat:
    image: openim/openim-chat:latest
    depends_on: [openim-server, mysql]

  mongo:
    image: mongo:6
    volumes:
      - mongodata:/data/db

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: openim_dev
    volumes:
      - mysqldata:/var/lib/mysql

  # ─── KALEN Services ────────────────────────────────────
  identity-service:
    build: ./services/identity
    ports: ["8001:8001"]
    depends_on: [postgres, redis, nats]
    environment:
      DATABASE_URL: postgres://kalen:kalen_dev@postgres:5432/kalen
      NATS_URL: nats://nats:4222
      REDIS_URL: redis://redis:6379/0

  messaging-service:
    build: ./services/messaging
    ports: ["8002:8002"]
    depends_on: [postgres, redis, nats, openim-server]

  mcp-gateway:
    build: ./services/mcp-gateway
    ports: ["8003:8003"]
    depends_on: [postgres, redis, nats]

  a2a-router:
    build: ./services/a2a-router
    ports: ["8004:8004"]
    depends_on: [postgres, redis, nats, minio]

  # ─── Presentation ──────────────────────────────────────
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [identity-service, messaging-service, mcp-gateway, a2a-router]

volumes:
  pgdata:
  miniodata:
  esdata:
  natsdata:
  mongodata:
  mysqldata:
```

### 10.2 Kubernetes (Production)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Kubernetes Production Topology                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Ingress Controller (nginx-ingress)                            ││
│  │  - TLS termination (cert-manager + Let's Encrypt)              ││
│  │  - Rate limiting                                               ││
│  │  - WebSocket support                                           ││
│  └──────────────────────────┬──────────────────────────────────────┘│
│                              │                                       │
│  ┌──────────────────────────▼──────────────────────────────────────┐│
│  │  Namespace: kalen-production                                    ││
│  │                                                                 ││
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  ││
│  │  │ Identity Svc   │  │ Messaging Svc  │  │ MCP Gateway     │  ││
│  │  │ Deployment     │  │ Deployment     │  │ Deployment      │  ││
│  │  │ (3 replicas)   │  │ (5 replicas)   │  │ (3 replicas)    │  ││
│  │  │ HPA: CPU/RPS   │  │ HPA: Conn/RPS  │  │ HPA: RPS        │  ││
│  │  └────────────────┘  └────────────────┘  └─────────────────┘  ││
│  │                                                                 ││
│  │  ┌────────────────┐  ┌────────────────┐                       ││
│  │  │ A2A Router     │  │ OpenIM Server  │                       ││
│  │  │ Deployment     │  │ StatefulSet    │                       ││
│  │  │ (3 replicas)   │  │ (3 replicas)   │                       ││
│  │  └────────────────┘  └────────────────┘                       ││
│  │                                                                 ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ StatefulSets (data plane)                              │    ││
│  │  │                                                        │    ││
│  │  │ PostgreSQL (PgOperator)   Redis (Sentinel, 3 nodes)   │    ││
│  │  │ MinIO (4 nodes, erasure)  ES (3 data + 3 master)      │    ││
│  │  │ NATS (3-node cluster)     Mongo (replica set, 3 nodes) │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Namespace: kalen-monitoring                                    ││
│  │                                                                 ││
│  │  Prometheus  │  Grafana  │  Loki  │  Alertmanager              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Resource estimates (initial production):**

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| Identity Service (x3) | 0.5 core each | 512 MB each | — |
| Messaging Service (x5) | 1 core each | 1 GB each | — |
| MCP Gateway (x3) | 0.5 core each | 512 MB each | — |
| A2A Router (x3) | 0.5 core each | 512 MB each | — |
| PostgreSQL | 4 cores | 16 GB | 500 GB SSD |
| Redis | 2 cores | 8 GB | — |
| MinIO | 2 cores | 4 GB | 2 TB HDD |
| Elasticsearch | 4 cores | 16 GB | 500 GB SSD |
| NATS | 1 core | 2 GB | 100 GB SSD |

---

## 11. Monitoring Design

**Status: `[DESIGN]`**

### 11.1 Observability Stack

KALEN uses the Prometheus + Grafana + Loki stack for monitoring:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Observability Architecture                         │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  KALEN       │  │  KALEN       │  │  KALEN       │             │
│  │  Services    │  │  Services    │  │  Services    │             │
│  │              │  │              │  │              │             │
│  │  /metrics    │  │  log output  │  │  /trace      │             │
│  │  (Prometheus)│  │  (structured)│  │  (OTLP)      │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                  │                      │
│         ▼                 ▼                  ▼                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Prometheus  │  │    Loki      │  │    Tempo     │             │
│  │              │  │              │  │   (traces)   │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                  │                      │
│         └─────────────────┼──────────────────┘                      │
│                           │                                         │
│                    ┌──────▼───────┐                                 │
│                    │   Grafana    │                                 │
│                    │              │                                 │
│                    │  Dashboards  │                                 │
│                    │  Alerts      │                                 │
│                    │  Correlation │                                 │
│                    └──────────────┘                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 11.2 Metrics

Each KALEN service exposes Prometheus metrics at `/metrics`:

**Identity Service metrics:**
| Metric | Type | Description |
|--------|------|-------------|
| `kalen_identity_auth_total` | Counter | Total authentication attempts by kind (human/agent) and outcome |
| `kalen_identity_auth_duration_seconds` | Histogram | Authentication latency |
| `kalen_identity_registrations_total` | Counter | New identity registrations by kind |
| `kalen_identity_active_sessions` | Gauge | Currently active sessions |

**Messaging Service metrics:**
| Metric | Type | Description |
|--------|------|-------------|
| `kalen_msg_sent_total` | Counter | Messages sent by room type |
| `kalen_msg_delivery_duration_seconds` | Histogram | End-to-end message delivery latency |
| `kalen_msg_websocket_connections` | Gauge | Active WebSocket connections |
| `kalen_msg_search_duration_seconds` | Histogram | Message search query latency |

**MCP Gateway metrics:**
| Metric | Type | Description |
|--------|------|-------------|
| `kalen_mcp_invocations_total` | Counter | Tool invocations by tool_id and outcome |
| `kalen_mcp_invocation_duration_seconds` | Histogram | Tool invocation latency by tool_id |
| `kalen_mcp_rate_limit_rejections_total` | Counter | Rate limit rejections by agent and tool |
| `kalen_mcp_cache_hits_total` | Counter | Cache hits vs misses |

**A2A Router metrics:**
| Metric | Type | Description |
|--------|------|-------------|
| `kalen_a2a_tasks_total` | Counter | Tasks created by capability_id |
| `kalen_a2a_task_duration_seconds` | Histogram | Task completion time by capability_id |
| `kalen_a2a_active_tasks` | Gauge | Currently active tasks by status |
| `kalen_a2a_artifacts_produced_total` | Counter | Artifacts produced by type |

### 11.3 Dashboards

**System Overview Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  KALEN System Overview                                              │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Total Users │ │ Total Agents│ │ Active Rooms│ │ Messages/   │ │
│  │    1,247    │ │     89      │ │    342      │ │ min: 45.2   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                     │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐ │
│  │ Request Rate (by service)    │ │ Error Rate (5xx by service)  │ │
│  │ ████████████████ Messaging   │ │ ██ Identity                  │ │
│  │ ██████████ Identity          │ │ █ MCP Gateway                │ │
│  │ ██████ MCP Gateway           │ │                              │ │
│  │ ████ A2A Router              │ │                              │ │
│  └──────────────────────────────┘ └──────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐ │
│  │ MCP Tool Usage (top 10)      │ │ A2A Task Status              │ │
│  │ ██████████ github.create_iss │ │ Working: 23                  │ │
│  │ ████████ slack.send_message  │ │ Completed: 1,847             │ │
│  │ ██████ db.query              │ │ Failed: 12                   │ │
│  └──────────────────────────────┘ └──────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.4 Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| `HighErrorRate` | 5xx rate > 1% for 5 min | Critical | Page on-call |
| `MCPToolTimeout` | P99 latency > 30s for 10 min | Warning | Notify team channel |
| `A2ATaskStuck` | Task in `working` > 2x timeout | Critical | Auto-cancel + notify requester |
| `WebSocketConnDrop` | Connection count drops > 50% in 5 min | Critical | Page on-call |
| `DatabaseConnPoolExhausted` | Pool utilization > 90% | Warning | Scale up DB connections |
| `NATSStreamLag` | Consumer lag > 10K messages | Warning | Investigate consumer health |
| `DiskSpaceLow` | MinIO/ES disk > 85% | Warning | Expand storage |
| `AgentAuthFailures` | Agent auth failures > 10/min | Warning | Investigate key rotation |

### 11.5 Logging Standards

All KALEN services emit structured JSON logs with the following fields:

```json
{
  "timestamp": "2026-06-08T12:00:00.000Z",
  "level": "info",
  "service": "mcp-gateway",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Tool invocation completed",
  "context": {
    "tool_id": "github.create_issue",
    "agent_suffix": "@codebot.agent#7b2c",
    "duration_ms": 342,
    "outcome": "success"
  }
}
```

Logs are shipped to Loki via Promtail sidecar containers. Grafana provides log querying with LogQL, with trace_id-based correlation to jump between logs, metrics, and traces.

---

## 12. Implementation Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Identity Service (WebAuthn + Agent Keypair) | `[DESIGN]` | Schema defined; auth flows designed |
| Suffix Enforcement | `[DESIGN]` | Algorithm designed; PostgreSQL unique index planned |
| Messaging Service (OpenIM integration) | `[DESIGN]` | Integration points mapped; no code |
| MCP Gateway | `[DESIGN]` | Gateway pattern, tool lifecycle, and invocation flow designed |
| A2A Router | `[DESIGN]` | Task lifecycle, artifact flow, and agent card designed |
| PostgreSQL Schema | `[DESIGN]` | All schemas designed; not deployed |
| Redis Configuration | `[DESIGN]` | DB partitioning designed; not deployed |
| MinIO Buckets | `[DESIGN]` | Bucket naming and retention policies designed |
| NATS Streams | `[DESIGN]` | Stream and consumer group design complete |
| Elasticsearch Indices | `[DESIGN]` | Index design complete |
| Security (dual auth, RBAC, audit) | `[DESIGN]` | Threat model, RBAC hierarchy, audit schema designed |
| Docker Compose (dev) | `[DESIGN]` | Service composition designed; file not yet created |
| Kubernetes manifests (prod) | `[DESIGN]` | Topology and resource estimates designed |
| Monitoring (Prometheus + Grafana + Loki) | `[DESIGN]` | Metrics, dashboards, and alerts designed |

**Nothing in this document should be assumed to be running in production or even in development.** This is a design document that describes the target architecture. Implementation will proceed incrementally, and this document will be updated to reflect what is actually built.

---

*Document maintained by Mulky Malikul Dhaher (mulkymalikuldhr@mail.com). Last updated: 2026-06-08.*
