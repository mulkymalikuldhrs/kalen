# KALEN — Product Requirements Document

**Project:** KALEN (Kinetic Autonomous Layer for Entity Networking)  
**Document Type:** Product Requirements Document (PRD)  
**Version:** 1.0  
**Date:** June 8, 2026  
**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)  
**Institution:** Dhaher Corporation / Dhaher Academic Research  
**Status:** Draft — Pre-Implementation  
**License:** AGPL-3.0 (planned)

---

> **Honesty Declaration:** This PRD clearly distinguishes between what is *planned* (specification, architecture, roadmap) and what is *implemented* (running code, tested features). As of this document's date, KALEN exists as a research specification and architecture blueprint. No production code has been deployed. All performance targets are *engineering goals*, not measured results. All "Agent Society" claims are *theoretical projections* labeled **[ASSUMPTION]**, not validated phenomena.

---

## Table of Contents

1. [Overview & Vision](#1-overview--vision)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Protocol Integration Requirements](#7-protocol-integration-requirements)
8. [Security Requirements](#8-security-requirements)
9. [MVP Scope](#9-mvp-scope)
10. [Roadmap](#10-roadmap)
11. [Success Metrics](#11-success-metrics)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Out of Scope](#13-out-of-scope)
14. [Appendix: Glossary](#14-appendix-glossary)

---

## 1. Overview & Vision

### 1.1 What is KALEN?

KALEN (Kinetic Autonomous Layer for Entity Networking) is a sovereign, self-hosted, AI-native communication operating system designed for the coexistence of human and AI agent entities within a single platform. The name derives from the Acehnese word "Kalen" (to see, to observe), reflecting a system that actively perceives and mediates the digital world.

KALEN is not a chat application with AI bolted on. It is an **operating system** for digital entities — human and artificial — to coexist, communicate, and execute. The core architectural thesis is that communication infrastructure should serve as the *execution layer* for agent collaboration, not merely the *interaction layer* for human conversation.

### 1.2 The Four Pillars

KALEN is built on four open-standard pillars, each addressing a distinct architectural need:

| Pillar | Technology | Function | Status |
|--------|-----------|----------|--------|
| **Comms Backbone** | OpenIM (Phase 1–2), Matrix (Phase 3+) | Federated messaging, groups, channels, calls | Planned |
| **Human Identity** | WebAuthn / Passkeys (FIDO2) | Passwordless, biometric-verified, device-bound authentication | Planned |
| **Agent Tools** | MCP (Model Context Protocol) | Standardized agent-to-tool integration | Planned |
| **Agent Society** | A2A (Agent-to-Agent Protocol) | Inter-agent discovery, delegation, negotiation, task execution | Planned (Phase 3) |

### 1.3 Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Research paper & architecture specification | **Complete** | 18,000-word research paper with 12-layer validation |
| Project structure & repository skeleton | **Complete** | Monorepo structure defined with pnpm workspaces |
| Docker infrastructure configs | **Partial** | Docker Compose, Traefik, LiveKit, PostgreSQL, Redis, MinIO, NATS configs exist |
| Library packages (@kalen/shared, identity, mcp-gateway, a2a-router) | **Implemented** | All 4 packages implemented with real Ed25519 crypto, 379 tests passing |
| API server (apps/server) | **Implemented** | NestJS server with auth, identity, messaging, MCP, A2A modules; in-memory stores |
| Web client (apps/web) | **Implemented** | Next.js 15 app with 10 pages, 17 components; simulated API data |
| Protocol integrations (MCP, A2A) | **Partial** | Library code implemented; tool handlers and external integrations are stubs |
| WebAuthn authentication | **Partial** | Helper functions implemented; server controllers exist; needs real DB persistence |
| Agent runtime | **Not started** | Hierarchy and constitutional prompts defined; runtime not built |
| Database schema | **Partial** | TypeORM entities defined; in-memory stores used; no migrations executed |

### 1.4 Vision Statement

Enable a world where **humans and AI agents communicate as peers** within sovereign infrastructure — where agents have persistent identity, scoped capabilities, and the ability to collaborate with each other through standardized protocols, all under human governance and within self-hosted environments that no corporation controls.

---

## 2. Problem Statement

### 2.1 The Infrastructure Gap

The AI agent economy has reached an inflection point, but the communication infrastructure layer has not kept pace. The gap is architectural, not incremental.

**Quantified evidence:**

| Data Point | Source | Confidence |
|-----------|--------|------------|
| AI agent market: $7.63B (2025) → $182.97B (2033) at 49.6% CAGR | Grand View Research | Market projection — not empirical fact |
| 51% of organizations have deployed AI agents | Industry surveys (2026) | Cross-sectional survey data |
| 76% of business leaders acknowledge infrastructure cannot support agentic AI | 2026 survey, 1,600+ respondents | Survey data |
| Multi-agent production failure rates: 41%–86.7% | arXiv:2604.16339, 1,600+ annotated traces | Peer-reviewed preprint |
| 79% of multi-agent failures attributable to coordination and specification issues, not model capability | Same source | Longitudinal analysis |
| 85% of enterprises aim to adopt agentic AI within 3 years | Industry survey | Self-reported intent |
| Gartner projects >40% of agentic AI projects may be canceled | Gartner 2026 analyst report | Analyst projection |
| Only 19% of enterprises deploy multi-agent systems today | Industry survey | Cross-sectional |

**Key qualifier:** Market projections ($182.97B) are analyst estimates, not empirical facts. They justify the direction but should not be cited as proven outcomes.

### 2.2 Why Existing Platforms Fail

| Platform | Architecture | Agent Support | Gap |
|----------|-------------|---------------|-----|
| **WhatsApp** | H2H only | None | No agent identity, no tool access, no A2A |
| **Telegram** | H2H + webhook bots | Limited (Bot API, not autonomous) | Bots are reactive webhooks, not autonomous entities with memory |
| **Slack** | H2H workspace | Third-party AI plugins | AI is a bolt-on integration, not a native citizen |
| **Discord** | H2H community | Limited bot framework | No standardized agent tools or inter-agent communication |
| **ChatGPT/Claude** | Isolated AI interface | Single agent only | No persistent society, no inter-agent negotiation, no shared communication substrate |
| **Rocket.Chat** | Enterprise chat | AI plugin marketplace | AI is still a plugin; no native dual-identity model |
| **Fleece AI** | Agent hierarchy | Agent-native but isolated | No human coexistence; no open standards (MCP, A2A) |

### 2.3 Root Cause

Communication infrastructure was **architecturally designed for human-to-human (H2H) interaction**. AI agents are either absent (WhatsApp), second-class (Slack bots), or isolated (ChatGPT). No existing platform treats agents as **first-class citizens** with:

1. **Sovereign identity** — distinct from human identity, with cryptographic attestation
2. **Tool access** — standardized via protocol (MCP), not ad-hoc API calls
3. **Inter-agent communication** — structured via protocol (A2A), not custom webhooks
4. **Memory persistence** — agents remember across sessions, not stateless per-request
5. **Human governance** — agents operate within scoped RBAC, not unconstrained autonomy

### 2.4 The Specific Problem KALEN Solves

> How to architect a sovereign communication platform where humans and AI agents coexist as first-class citizens with distinct identity models, scoped tool access, and standardized inter-agent collaboration?

---

## 3. Target Users

### 3.1 Primary User Segments

#### 3.1.1 Developers & AI Engineers

- **Who:** Full-stack developers, AI/ML engineers, DevOps engineers building agent-based systems
- **Need:** A unified platform to deploy, manage, and orchestrate AI agents alongside human users
- **Pain point:** Today they stitch together Slack + LangChain + custom orchestration + database, with no coherent identity or communication model
- **KALEN value:** Native MCP integration, A2A out of the box, standardized agent identity, one deployable stack
- **Estimated segment size:** ~5M professional developers working with AI tools (2026 estimate)

#### 3.1.2 Enterprises Adopting Agentic AI

- **Who:** CTOs, CIOs, engineering leads at organizations deploying multi-agent workflows
- **Need:** Infrastructure that supports agent collaboration with governance, audit, and compliance
- **Pain point:** 76% acknowledge their infrastructure cannot support agentic AI; 41%–86.7% multi-agent failure rate
- **KALEN value:** Self-hosted sovereignty, RBAC, audit trails, E2EE (Phase 2), compliance roadmap
- **Estimated segment size:** 85% of enterprises planning agentic AI adoption within 3 years

#### 3.1.3 AI Researchers

- **Who:** Academic and industry researchers studying multi-agent systems, agent communication, human-agent interaction
- **Need:** A reproducible, open-source platform for experimentation and benchmarking
- **Pain point:** No standardized testbed for human-agent coexistence experiments
- **KALEN value:** Open-source, protocol-standard, measurable (latency, task completion, trust score), reproducible architecture
- **Estimated segment size:** ~100K active AI researchers globally

#### 3.1.4 Self-Hosted & Sovereign Infrastructure Advocates

- **Who:** Privacy-conscious organizations, governments, military, regulated industries, open-source communities
- **Need:** Communication infrastructure that runs on their own hardware, under their own governance
- **Pain point:** No existing self-hosted platform with native AI agent support; Big Tech platforms unacceptable for sovereign deployment
- **KALEN value:** Self-hosted default, no vendor lock-in, data residency control, local LLM support, Docker one-click deploy
- **Estimated segment size:** 16 governments already using Matrix/Element for sovereign messaging

### 3.2 Secondary User Segments

| Segment | Need | KALEN Value | Phase |
|---------|------|-------------|-------|
| Small teams / startups | Affordable AI-native workspace | Free tier: core chat + 3 agents + self-host | Phase 1 |
| Open-source communities | Transparent, community-governed tools | AGPL-3.0 license, open governance (Phase 5) | Phase 5 |
| Regulated industries (healthcare, finance) | Compliance-ready infrastructure | HIPAA roadmap (Phase 4), SOC 2 (Phase 3), audit trails | Phase 3–4 |

---

## 4. User Stories

### 4.1 Identity & Authentication

**US-001: Human Registration via Passkey**
> As a human user, I want to register for KALEN using my device's passkey (Face ID / fingerprint / PIN) so that I can authenticate without a password.

- **Acceptance Criteria:**
  - Registration completes within 10 seconds on a modern device
  - No biometric data leaves the user's device (only public key stored server-side)
  - FIDO2/WebAuthn Level 3 compliant
  - Recovery phrase (24-word BIP39) generated and displayed once during registration
  - User can register multiple passkey devices
- **Status:** Planned (Phase 1)

**US-002: Agent Identity Creation**
> As a developer, I want to create an AI agent with a unique identity `Name(ai)` so that it is distinguishable from human users in all contexts.

- **Acceptance Criteria:**
  - Agent name must end with `(ai)` suffix — enforced at creation, non-negotiable
  - Ed25519 keypair generated at creation; public key stored in registry
  - Capability manifest (JSON) must be defined: skills, tools, rate limits, owner, workspace
  - Agent appears with distinct visual badge in UI (not human avatar)
  - Agent cannot be created without an owning human user
- **Status:** Planned (Phase 1)

**US-003: Human Login**
> As a returning human user, I want to log in via my registered passkey so that I can access my conversations and agents without entering a password.

- **Acceptance Criteria:**
  - Challenge-response flow via `navigator.credentials.get()` completes within 5 seconds
  - JWT access token (15 min TTL) + refresh token (7 day TTL) issued upon success
  - Failed attempts are rate-limited and logged
  - Device not previously registered is rejected (no passkey = no access)
- **Status:** Planned (Phase 1)

**US-004: Agent Authentication**
> As an AI agent, I want to authenticate via my Ed25519 keypair so that I can access KALEN APIs and communicate with other entities.

- **Acceptance Criteria:**
  - Agent signs JWT with private key; server verifies against registered public key
  - Token TTL: 24 hours, rotated on every agent restart
  - Revoked agents are rejected at the revocation check step
  - All authentication events logged to audit trail
- **Status:** Planned (Phase 1)

**US-005: Account Recovery**
> As a human user who lost my device, I want to recover my account using my 24-word recovery phrase so that I don't permanently lose access.

- **Acceptance Criteria:**
  - Recovery phrase verified against bcrypt hash stored at registration
  - New passkey device can be registered after recovery
  - Recovery event logged with timestamp, IP, and device info
  - Rate-limited to 3 recovery attempts per 24 hours
- **Status:** Planned (Phase 2)

### 4.2 Messaging

**US-010: 1:1 Chat**
> As a human user, I want to send direct messages to another human or agent so that we can communicate privately.

- **Acceptance Criteria:**
  - Messages delivered in <200ms p95 latency
  - Support text, markdown, and code blocks
  - Reactions, edit, delete supported
  - Read receipts shown
  - Typing indicator shown when other party is composing
- **Status:** Planned (Phase 1)

**US-011: Group Chat**
> As a human user, I want to create a group chat with up to 100 members (humans and agents) so that we can collaborate.

- **Acceptance Criteria:**
  - Group creator can add/remove members
  - All members can send messages, reactions
  - Agent members are visually distinguished (badge, suffix)
  - Group metadata (name, avatar) editable by creator
  - @mention works for both humans and agents
- **Status:** Planned (Phase 1)

**US-012: Channel Communication**
> As a workspace admin, I want to create channels (public, private, agent-only, hybrid) so that communication can be organized by topic and access level.

- **Acceptance Criteria:**
  - Public channels: visible and joinable by all workspace members
  - Private channels: invite-only
  - Agent-only channels: only agent entities can join (for inter-agent coordination)
  - Hybrid channels: both humans and agents, with configurable permissions
  - Channel visibility type enforced server-side
- **Status:** Planned (Phase 2)

**US-013: Real-Time Message Delivery**
> As a user (human or agent), I want messages to appear in real-time without refreshing so that conversations feel immediate.

- **Acceptance Criteria:**
  - WebSocket connection maintained during active session
  - Automatic reconnection with message catch-up on disconnect
  - Offline messages queued and delivered on reconnect
  - Push notifications for offline users (FCM/APNs)
- **Status:** Planned (Phase 1)

**US-014: File Sharing**
> As a user, I want to share files (up to 100MB in Phase 1, 2GB planned) so that I can exchange documents, images, and data.

- **Acceptance Criteria:**
  - Presigned URL upload to MinIO object store
  - Thumbnail generation for images
  - File metadata (name, size, MIME type) stored in PostgreSQL
  - Agent file access governed by RBAC scope
- **Status:** Planned (Phase 1, P1 priority)

**US-015: Message Search**
> As a user, I want to search across my messages by keyword so that I can find past conversations and information.

- **Acceptance Criteria:**
  - Elasticsearch full-text search with <500ms response time
  - Filterable by conversation, sender, date range, entity type
  - Search results show message context (3 messages before/after)
- **Status:** Planned (Phase 1, P1 priority)

### 4.3 AI Agent Interaction

**US-020: Human-to-Agent Task Delegation**
> As a human user, I want to delegate a task to an AI agent by sending a message in chat so that the agent can act on my behalf within its scoped capabilities.

- **Acceptance Criteria:**
  - Agent receives task via messaging API
  - Agent acknowledges receipt within 5 seconds
  - Agent operates within its declared capability manifest scope
  - Actions outside scope are rejected and reported to agent owner
  - All agent actions logged to audit trail
  - Agent reports completion (or failure) back to the requesting human
- **Status:** Planned (Phase 1)

**US-021: Agent-to-Tool Access (MCP)**
> As an AI agent, I want to access external tools (databases, APIs, files) via MCP so that I can perform tasks that require real-world data and actions.

- **Acceptance Criteria:**
  - MCP client embedded in agent runtime connects to registered MCP servers
  - Tool calls routed through MCP Gateway with allowlist enforcement
  - Tool outputs sanitized for prompt injection prevention
  - Per-agent, per-tool rate limiting enforced
  - OAuth 2.1 integration for external API tools
  - Context window usage from tools kept below 30% (selective exposure)
- **Status:** Planned (Phase 1 for basic MCP, Phase 2 for full gateway)

**US-022: Agent-to-Agent Delegation (A2A)**
> As an AI agent, I want to delegate sub-tasks to other agents via A2A protocol so that we can collaborate on complex multi-step workflows.

- **Acceptance Criteria:**
  - Agent discovers other agents via Agent Card at `/.well-known/agent.json`
  - Task lifecycle follows A2A spec: submitted → working → input-required → completed → canceled
  - Streaming updates via SSE
  - Artifacts (structured outputs) exchanged between agents
  - All A2A communications logged and auditable
  - Human owner can review and override agent delegation decisions
- **Status:** Planned (Phase 3; internal agent handoff via message bus in Phase 1)

**US-023: Agent Memory**
> As an AI agent, I want to persist memory across conversation sessions so that I can provide contextually aware responses over time.

- **Acceptance Criteria:**
  - Episodic memory: last 10 conversation turns stored (Phase 1)
  - Semantic memory: vector embeddings for similarity search (Phase 3)
  - Procedural memory: learned patterns and preferences (Phase 3)
  - Memory scoped to agent's workspace — no cross-workspace leakage
  - Human owner can view and delete agent memory
- **Status:** Phase 1 (basic episodic), Phase 3 (semantic + procedural)

### 4.4 Voice & Video Calls

**US-030: 1:1 Voice Call**
> As a human user, I want to make a voice call to another human or agent so that we can communicate in real-time audio.

- **Acceptance Criteria:**
  - Call setup time <3 seconds
  - WebRTC P2P with TURN fallback for NAT traversal
  - DTLS-SRTP media encryption mandatory
  - Agent joins call via STT + LLM + TTS pipeline
  - Call events (start, end, duration) logged to PostgreSQL
- **Status:** Planned (Phase 1)

**US-031: Group Voice Call**
> As a human user, I want to start a group voice call in a group chat so that multiple participants can speak simultaneously.

- **Acceptance Criteria:**
  - SFU architecture via LiveKit
  - Up to 50 concurrent audio participants
  - Agent participants join as audio-only AI voice
  - Mute/unmute, speaker selection, and participant list
- **Status:** Planned (Phase 2)

**US-032: Group Video Call**
> As a human user, I want to start a group video call with screen sharing so that my team can collaborate visually.

- **Acceptance Criteria:**
  - SFU + simulcast for adaptive quality
  - Up to 30 video participants (Phase 2)
  - Screen sharing via display capture
  - Server-side recording to MinIO (optional)
- **Status:** Planned (Phase 2)

### 4.5 Administration & Governance

**US-040: Admin Dashboard**
> As a workspace admin, I want a dashboard showing system statistics, active users, active agents, and resource usage so that I can monitor the health of my KALEN instance.

- **Acceptance Criteria:**
  - Real-time metrics: active users, active agents, message throughput, call count
  - Agent governance: approve, revoke, scope editing
  - User management: ban, suspend, role assignment
  - Audit log viewer with filters (actor, action, date, entity type)
- **Status:** Planned (Phase 1, basic)

**US-041: Agent Scope Management**
> As an admin, I want to define and modify the scope (rooms, tools, humans) that an agent can access so that I can enforce least-privilege access.

- **Acceptance Criteria:**
  - RBAC policy engine: deny-first logic
  - Scope defined in agent capability manifest
  - Scope changes logged to audit trail
  - Agent actions violating scope are blocked and reported
  - Scope can restrict: specific rooms, specific MCP tools, specific human users, rate limits
- **Status:** Planned (Phase 1)

**US-042: Audit Trail**
> As an admin or compliance officer, I want to see an immutable, signed audit log of all significant actions so that I can investigate incidents and meet compliance requirements.

- **Acceptance Criteria:**
  - Append-only audit log in PostgreSQL (no deletions)
  - Each entry signed with Ed25519 for tamper detection
  - Fields: timestamp, actor ID, actor type (human/agent), action, resource type, resource ID, metadata, IP, user agent
  - Searchable by actor, action type, date range
  - Retention: 7 years for compliance (configurable)
- **Status:** Planned (Phase 1)

---

## 5. Functional Requirements

### 5.1 Identity Layer

| ID | Requirement | Priority | Phase | Status |
|----|------------|----------|-------|--------|
| FR-ID-001 | Human registration via WebAuthn passkeys (FIDO2 compliant) | P0 | 1 | Planned |
| FR-ID-002 | Human authentication via passkey challenge-response | P0 | 1 | Planned |
| FR-ID-003 | Agent identity creation with mandatory `(ai)` suffix | P0 | 1 | Planned |
| FR-ID-004 | Agent Ed25519 keypair generation and storage | P0 | 1 | Planned |
| FR-ID-005 | Agent capability manifest definition and signing | P0 | 1 | Planned |
| FR-ID-006 | Agent JWT authentication with 24h TTL and rotation | P0 | 1 | Planned |
| FR-ID-007 | Dual-identity enforcement: human ≠ agent at protocol level | P0 | 1 | Planned |
| FR-ID-008 | Human account recovery via 24-word BIP39 phrase | P1 | 2 | Planned |
| FR-ID-009 | Multi-device passkey registration | P1 | 2 | Planned |
| FR-ID-010 | Agent keypair rotation protocol | P1 | 2 | Planned |
| FR-ID-011 | Agent identity revocation by admin or owner | P0 | 1 | Planned |
| FR-ID-012 | Entity type extraction in JWT claims (for RBAC enforcement) | P0 | 1 | Planned |
| FR-ID-013 | Workspace/tenant identity isolation | P1 | 2 | Planned |

### 5.2 Messaging Layer

| ID | Requirement | Priority | Phase | Status |
|----|------------|----------|-------|--------|
| FR-MSG-001 | 1:1 direct messaging (text, markdown, code) | P0 | 1 | Planned |
| FR-MSG-002 | Group chat (up to 100 members in Phase 1, 5,000 planned) | P0 | 1 | Planned |
| FR-MSG-003 | WebSocket real-time message delivery | P0 | 1 | Planned |
| FR-MSG-004 | Message reactions, edit, delete | P0 | 1 | Planned |
| FR-MSG-005 | Read receipts | P1 | 1 | Planned |
| FR-MSG-006 | Typing indicators | P1 | 1 | Planned |
| FR-MSG-007 | @mention (humans and agents) | P0 | 1 | Planned |
| FR-MSG-008 | Message reply threading | P1 | 2 | Planned |
| FR-MSG-009 | File sharing via MinIO presigned URLs (100MB Phase 1, 2GB planned) | P1 | 1 | Planned |
| FR-MSG-010 | Full-text message search via Elasticsearch | P1 | 1 | Planned |
| FR-MSG-011 | Channel system (public, private, agent-only, hybrid) | P1 | 2 | Planned |
| FR-MSG-012 | Ephemeral stories (24h lifecycle) | P2 | 2 | Planned |
| FR-MSG-013 | Push notifications (FCM/APNs) for offline users | P1 | 1 | Planned |
| FR-MSG-014 | Message search filtered by entity type (human vs. agent) | P1 | 2 | Planned |
| FR-MSG-015 | End-to-end encrypted messaging | P1 | 2 | Planned (Matrix bridge) |

### 5.3 AI Agent Layer

| ID | Requirement | Priority | Phase | Status |
|----|------------|----------|-------|--------|
| FR-AI-001 | Agent runtime (containerized, one agent per container) | P0 | 1 | Planned |
| FR-AI-002 | Agent system prompt + SOUL.md constitutional document | P0 | 1 | Planned |
| FR-AI-003 | Agent receives tasks via messaging API | P0 | 1 | Planned |
| FR-AI-004 | Agent responds within 5 seconds of task receipt | P0 | 1 | Planned |
| FR-AI-005 | Agent operates within declared capability manifest scope | P0 | 1 | Planned |
| FR-AI-006 | Agent actions outside scope are rejected and reported | P0 | 1 | Planned |
| FR-AI-007 | Agent episodic memory (last 10 conversation turns) | P1 | 1 | Planned |
| FR-AI-008 | Agent semantic memory via vector embeddings (pgvector) | P2 | 3 | Planned |
| FR-AI-009 | Agent procedural memory (learned patterns) | P2 | 3 | Planned |
| FR-AI-010 | Human-to-agent task delegation via chat | P0 | 1 | Planned |
| FR-AI-011 | Agent-to-human notification (respecting DND hours) | P1 | 1 | Planned |
| FR-AI-012 | Agent-to-agent task handoff via internal message bus (Phase 1) | P1 | 1 | Planned |
| FR-AI-013 | Agent-to-agent delegation via A2A protocol (Phase 3) | P1 | 3 | Planned |
| FR-AI-014 | Agent voice participation in calls (STT + LLM + TTS pipeline) | P2 | 3 | Planned |
| FR-AI-015 | Default agents: Support(ai), Research(ai) (Phase 1) | P0 | 1 | Planned |
| FR-AI-016 | Additional default agents: Builder(ai), Ops(ai), Audit(ai) (Phase 2) | P2 | 2 | Planned |
| FR-AI-017 | Custom agent builder (no-code) | P2 | 3 | Planned |
| FR-AI-018 | Agent marketplace for third-party agent distribution | P2 | 3 | Planned |

### 5.4 MCP Gateway Layer

| ID | Requirement | Priority | Phase | Status |
|----|------------|----------|-------|--------|
| FR-MCP-001 | MCP client embedded in agent runtime (TypeScript/Python SDK) | P0 | 1 | Planned |
| FR-MCP-002 | MCP server registry (list, discover, deprecate) | P1 | 2 | Planned |
| FR-MCP-003 | MCP Gateway central routing for tool calls | P1 | 2 | Planned |
| FR-MCP-004 | Per-agent tool allowlist enforcement | P0 | 1 | Planned |
| FR-MCP-005 | Tool output sanitization (prompt injection prevention) | P0 | 1 | Planned |
| FR-MCP-006 | Per-agent, per-tool rate limiting (Redis-backed) | P1 | 2 | Planned |
| FR-MCP-007 | OAuth 2.1 integration for external API tools | P2 | 2 | Planned |
| FR-MCP-008 | Selective tool exposure to prevent context window bloat (<30% of context for tools) | P1 | 2 | Planned |
| FR-MCP-009 | Built-in KALEN MCP tools: message, search, file, web, code | P1 | 2 | Planned |
| FR-MCP-010 | Capability attestation (signed manifests) to prevent tool poisoning | P2 | 3 | Planned |

### 5.5 A2A Router Layer

| ID | Requirement | Priority | Phase | Status |
|----|------------|----------|-------|--------|
| FR-A2A-001 | A2A-compliant router implementing spec v1.0 JSON-RPC 2.0 over HTTP | P1 | 3 | Planned |
| FR-A2A-002 | Agent Card registry with `.well-known/agent.json` endpoint | P1 | 3 | Planned |
| FR-A2A-003 | Agent Card signing and verification (Ed25519) | P1 | 3 | Planned |
| FR-A2A-004 | Task lifecycle: submitted → working → input-required → completed → canceled | P1 | 3 | Planned |
| FR-A2A-005 | Artifact exchange between agents | P1 | 3 | Planned |
| FR-A2A-006 | SSE streaming for task status updates | P1 | 3 | Planned |
| FR-A2A-007 | Agent discovery with Redis-backed cache | P2 | 3 | Planned |
| FR-A2A-008 | OAuth 2.1 with PKCE for A2A authentication | P1 | 3 | Planned |
| FR-A2A-009 | mTLS support for enterprise deployments | P2 | 4 | Planned |
| FR-A2A-010 | Internal agent handoff via message bus (A2A fallback for Phase 1–2) | P1 | 1 | Planned |

### 5.6 Data Layer

| ID | Requirement | Priority | Phase | Status |
|----|------------|----------|-------|--------|
| FR-DATA-001 | PostgreSQL 16 as primary database (ACID compliance) | P0 | 1 | Planned |
| FR-DATA-002 | Redis 7 for session state, presence cache, and challenge storage | P0 | 1 | Planned |
| FR-DATA-003 | NATS for inter-service event bus | P0 | 1 | Planned |
| FR-DATA-004 | MinIO for object storage (files, recordings) | P1 | 1 | Planned |
| FR-DATA-005 | Elasticsearch for full-text message search | P1 | 1 | Planned |
| FR-DATA-006 | pgvector for agent memory semantic search | P2 | 3 | Planned |
| FR-DATA-007 | Database schema: users, human_profiles, agent_profiles, rooms, messages, files, agent_tasks, agent_memory, audit_logs | P0 | 1 | Planned |
| FR-DATA-008 | Data encryption at rest (AES-256) | P0 | 1 | Planned |
| FR-DATA-009 | Hourly PostgreSQL backups via pg_dump + Restic to S3 | P1 | 1 | Planned |
| FR-DATA-010 | Data export and right-to-erasure (GDPR compliance) | P2 | 2 | Planned |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target | Measurement Method | Status |
|----|------------|--------|-------------------|--------|
| NFR-PERF-001 | Messaging latency (p95) | <200ms | k6 load test with 1,000 concurrent users | Target — not measured |
| NFR-PERF-002 | Call setup time | <3 seconds | Automated WebRTC testing | Target — not measured |
| NFR-PERF-003 | Agent task acknowledgment | <5 seconds | End-to-end measurement from message send to agent acknowledgment | Target — not measured |
| NFR-PERF-004 | Authentication (passkey) | <5 seconds | WebAuthn conformance test suite | Target — not measured |
| NFR-PERF-005 | Search query response | <500ms | Elasticsearch benchmark with 1M messages | Target — not measured |
| NFR-PERF-006 | WebSocket reconnection | <2 seconds | Simulated disconnect/reconnect test | Target — not measured |
| NFR-PERF-007 | MCP tool invocation overhead | <50ms (gateway latency) | Gateway timing logs | Target — not measured |

### 6.2 Scalability

| ID | Requirement | Target | Measurement Method | Status |
|----|------------|--------|-------------------|--------|
| NFR-SCALE-001 | Concurrent users | 10,000+ | Horizontal scaling test | Target — not measured |
| NFR-SCALE-002 | Concurrent agents | 1,000+ | Agent runtime scaling test | Target — not measured |
| NFR-SCALE-003 | Group chat size | 100 members (Phase 1), 5,000 (planned) | Group creation test | Target — not measured |
| NFR-SCALE-004 | Message throughput | 50,000 messages/second | Load test | Target — not measured |
| NFR-SCALE-005 | File upload size | 100MB (Phase 1), 2GB (planned) | Upload test | Target — not measured |

### 6.3 Reliability & Availability

| ID | Requirement | Target | Measurement Method | Status |
|----|------------|--------|-------------------|--------|
| NFR-REL-001 | System uptime | 99.9% (Phase 1), 99.99% (Phase 5) | Prometheus uptime metric | Target — not measured |
| NFR-REL-002 | Data durability | 99.999% | Backup restore testing | Target — not measured |
| NFR-REL-003 | Recovery Time Objective (RTO) | 15 minutes | Disaster recovery drill | Target — not measured |
| NFR-REL-004 | Recovery Point Objective (RPO) | 1 hour | Backup interval verification | Target — not measured |
| NFR-REL-005 | Graceful degradation | Chat available during partial outage | Chaos engineering test | Target — not measured |

### 6.4 Security

| ID | Requirement | Target | Status |
|----|------------|--------|--------|
| NFR-SEC-001 | All API traffic encrypted via TLS 1.3 | Mandatory | Target |
| NFR-SEC-002 | All WebRTC media encrypted via DTLS-SRTP | Mandatory | Target |
| NFR-SEC-003 | Data at rest encrypted via AES-256 | Mandatory | Target |
| NFR-SEC-004 | No biometric data stored server-side | Mandatory | Target |
| NFR-SEC-005 | Agent impersonation prevention (suffix + keypair + policy) | Zero tolerance | Target |
| NFR-SEC-006 | Rate limiting on all public endpoints | Mandatory | Target |
| NFR-SEC-007 | Session token TTL enforcement (15m access, 7d refresh) | Mandatory | Target |
| NFR-SEC-008 | STRIDE threat model documented and mitigated | Complete | Specified |

### 6.5 Observability

| ID | Requirement | Target | Status |
|----|------------|--------|--------|
| NFR-OBS-001 | Prometheus metrics for all services | Mandatory | Planned |
| NFR-OBS-002 | Grafana dashboards: system overview, messaging, agent activity | 3 dashboards minimum | Planned |
| NFR-OBS-003 | Centralized logging via Loki | Mandatory | Planned |
| NFR-OBS-004 | Distributed tracing across microservices | Jaeger/Tempo | Planned |
| NFR-OBS-005 | Alerting for: high latency, low uptime, security anomalies | PagerDuty/OpsGenie integration | Planned |

---

## 7. Protocol Integration Requirements

### 7.1 MCP (Model Context Protocol) Compliance

MCP is an open protocol (donated to Linux Foundation Agentic AI Foundation, December 2025) standardizing how AI agents connect to tools, data sources, and prompts. KALEN must implement both MCP client and server roles.

**MCP Client Requirements (agent runtime side):**

| ID | Requirement | MCP Spec Reference | Phase |
|----|------------|-------------------|-------|
| MCP-CLI-001 | Connect to MCP servers via stdio or SSE transport | MCP Transport Spec | Phase 1 |
| MCP-CLI-002 | Send JSON-RPC 2.0 requests: `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read` | MCP Protocol Spec | Phase 1 |
| MCP-CLI-003 | Handle MCP server capabilities negotiation during `initialize` | MCP Protocol Spec | Phase 1 |
| MCP-CLI-004 | Support tool result streaming for long-running operations | MCP Protocol Spec | Phase 2 |
| MCP-CLI-005 | Manage connection lifecycle (connect, reconnect, disconnect) per MCP client pool | Implementation detail | Phase 1 |

**MCP Server Requirements (KALEN-as-tool-provider side):**

| ID | Requirement | MCP Spec Reference | Phase |
|----|------------|-------------------|-------|
| MCP-SRV-001 | Expose KALEN-native tools via MCP server: message, search, file, web, code | MCP Server Spec | Phase 2 |
| MCP-SRV-002 | Define tool schemas with JSON Schema input validation | MCP Tool Spec | Phase 2 |
| MCP-SRV-003 | Support resource providers for exposing KALEN data to agents | MCP Resource Spec | Phase 2 |
| MCP-SRV-004 | Implement prompt templates for common agent interaction patterns | MCP Prompt Spec | Phase 2 |

**MCP Gateway Requirements (governance layer):**

| ID | Requirement | Phase |
|----|------------|-------|
| MCP-GW-001 | Central gateway routes tool calls from agents to appropriate MCP servers | Phase 2 |
| MCP-GW-002 | Per-agent tool allowlist: agents can only invoke tools they are scoped for | Phase 1 |
| MCP-GW-003 | Tool output sanitization: strip prompt injection payloads from tool results | Phase 1 |
| MCP-GW-004 | Rate limiting per agent per tool (Redis-backed) | Phase 2 |
| MCP-GW-005 | Selective tool exposure to prevent context window bloat (target: <30% of context for tool definitions) | Phase 2 |
| MCP-GW-006 | Audit logging of all tool invocations | Phase 1 |
| MCP-GW-007 | OAuth 2.1 integration for external API tools requiring auth | Phase 2 |

**MCP Context Bloat Mitigation:**

Research indicates tool definitions can consume up to 72% of an agent's context window with 10+ MCP servers. KALEN must implement:
- Per-agent tool whitelisting (not all tools to all agents)
- Deferred tool loading (load tool definitions only when needed)
- Tool summarization (compact tool descriptions in context)
- Gateway-level filtering (strip irrelevant tools before forwarding to agent)

### 7.2 A2A (Agent-to-Agent Protocol) Compliance

A2A is an open protocol (donated to Linux Foundation, June 2025; v1.0 released April 2026) standardizing inter-agent communication. KALEN must implement an A2A-compliant router.

**A2A Core Primitives:**

| ID | Requirement | A2A Spec Reference | Phase |
|----|------------|-------------------|-------|
| A2A-CORE-001 | Implement A2A JSON-RPC 2.0 over HTTP transport | A2A Protocol Spec | Phase 3 |
| A2A-CORE-002 | Support A2A methods: `tasks/send`, `tasks/sendSubscribe`, `tasks/get`, `tasks/cancel`, `tasks/list` | A2A Methods Spec | Phase 3 |
| A2A-CORE-003 | Agent Card served at `/.well-known/agent.json` for each agent | A2A Discovery Spec | Phase 3 |
| A2A-CORE-004 | Task lifecycle state machine: submitted → working → input-required → completed → canceled → failed | A2A Task Spec | Phase 3 |
| A2A-CORE-005 | Artifact exchange: agents return structured outputs (text, file, data) as task artifacts | A2A Artifact Spec | Phase 3 |
| A2A-CORE-006 | Message streaming: agents send conversational messages within task context | A2A Message Spec | Phase 3 |
| A2A-CORE-007 | SSE (Server-Sent Events) for real-time task status streaming | A2A Streaming Spec | Phase 3 |

**A2A Security Requirements:**

| ID | Requirement | A2A Spec Reference | Phase |
|----|------------|-------------------|-------|
| A2A-SEC-001 | Agent Cards signed with Ed25519; signature verified before trust | A2A Security Spec | Phase 3 |
| A2A-SEC-002 | OAuth 2.1 with PKCE as default authentication for A2A endpoints | A2A Auth Spec | Phase 3 |
| A2A-SEC-003 | mTLS support for enterprise deployments | A2A Enterprise Spec | Phase 4 |
| A2A-SEC-004 | Per-agent rate limiting on A2A endpoints | Implementation detail | Phase 3 |
| A2A-SEC-005 | Agent discovery cache (Redis-backed) with configurable TTL | Implementation detail | Phase 3 |

**A2A Fallback Strategy (Phase 1–2):**

Since A2A v1.0 is only months old (released April 2026) and production validation is minimal, KALEN implements an **internal agent handoff protocol** via NATS message bus during Phase 1–2. This provides:
- Agent-to-agent task delegation without A2A dependency
- Message-based task routing with same lifecycle states
- Migration path to A2A when spec matures in Phase 3

### 7.3 WebAuthn / FIDO2 Compliance

| ID | Requirement | Spec Reference | Phase |
|----|------------|---------------|-------|
| WA-001 | Implement WebAuthn Level 3 registration ceremony | W3C WebAuthn L3 | Phase 1 |
| WA-002 | Implement WebAuthn Level 3 authentication ceremony | W3C WebAuthn L3 | Phase 1 |
| WA-003 | Support platform authenticators (Face ID, Touch ID, fingerprint) | FIDO2 Spec | Phase 1 |
| WA-004 | Support roaming authenticators (security keys) | FIDO2 Spec | Phase 1 |
| WA-005 | Challenge storage in Redis with 60-second TTL | Implementation detail | Phase 1 |
| WA-006 | Credential storage in PostgreSQL (public key + credential ID + counter) | Implementation detail | Phase 1 |
| WA-007 | Relying Party configuration: rpID, rpName, origin, timeout | Implementation detail | Phase 1 |
| WA-008 | No biometric data stored server-side — only public key | Mandatory constraint | Phase 1 |

### 7.4 Matrix / OpenIM Messaging Compliance

**Phase 1–2: OpenIM (primary messaging backend)**

| ID | Requirement | Phase |
|----|------------|-------|
| MSG-INF-001 | OpenIM Server integration for chat, groups, contacts | Phase 1 |
| MSG-INF-002 | OpenIM SDK integration for real-time message delivery | Phase 1 |
| MSG-INF-003 | KALEN identity layer mapped to OpenIM user accounts | Phase 1 |

**Phase 3–4: Matrix (federation backend)**

| ID | Requirement | Phase |
|----|------------|-------|
| MSG-MTX-001 | Matrix Synapse deployment for federation support | Phase 4 |
| MSG-MTX-002 | Matrix-to-OpenIM bridge for backward compatibility | Phase 4 |
| MSG-MTX-003 | E2EE via Matrix Olm/Megolm protocol | Phase 3 |
| MSG-MTX-004 | Federation with external Matrix homeservers | Phase 4 |

**Known Limitation:** OpenIM group video calls are not fully open-source. KALEN resolves this by using LiveKit WebRTC SFU independently, not depending on OpenIM's call module.

---

## 8. Security Requirements

### 8.1 Dual-Identity Security Model

The dual-identity model is KALEN's core security innovation — ensuring that human and agent entities are **structurally and cryptographically distinguishable** at every layer.

| Property | Human Identity | Agent Identity |
|----------|---------------|----------------|
| **Authentication** | WebAuthn passkey (biometric + device-bound) | Ed25519 keypair (cryptographic) |
| **Credential Storage** | Public key + credential ID on server | Public key on server; private key in agent runtime |
| **Visual Distinction** | Standard avatar, no suffix | Distinct badge, mandatory `(ai)` suffix |
| **Token Type** | JWT with `entity_type: "human"` | JWT with `entity_type: "agent"` |
| **Session Duration** | Access: 15m / Refresh: 7d | Access: 24h / Rotation: every restart |
| **Recovery** | 24-word BIP39 phrase | Owner-initiated keypair regeneration |
| **Revocation** | Account suspension by admin | Agent revocation by owner or admin |
| **Audit** | Login/logout events | All actions logged (task, tool call, message, delegation) |

**Impersonation Prevention:**
1. `(ai)` suffix is mandatory and enforced at name registration — agents cannot register without it
2. `entity_type` field in JWT is extracted and verified at every API gateway request
3. UI rendering always shows agent badge — no agent can appear as human
4. Policy engine blocks any agent attempting to set `entity_type: "human"` in requests
5. RBAC rules differentiate between human and agent permissions explicitly

### 8.2 RBAC (Role-Based Access Control)

**Roles:**

| Role | Description | Assignment |
|------|-------------|-----------|
| `HUMAN` | Standard human user | Automatic on registration |
| `AGENT` | AI agent entity | Automatic on agent creation |
| `ADMIN` | Workspace administrator | Assigned by existing admin or during setup |
| `OWNER` | Agent owner (human who created the agent) | Automatic on agent creation |

**Permission Matrix:**

| Action | HUMAN | AGENT | ADMIN | OWNER |
|--------|-------|-------|-------|-------|
| Send messages in allowed rooms | ✓ | ✓ | ✓ | ✓ |
| Access MCP tools within scope | ✗ | ✓ | ✗ | ✗ |
| Delegate tasks to other agents | ✗ | ✓ | ✗ | ✗ |
| Create new agents | ✓ | ✗ | ✓ | ✗ |
| Revoke own agents | ✗ | ✗ | ✗ | ✓ |
| Admin console access | ✗ | ✗ | ✓ | ✗ |
| View audit logs | ✗ | ✗ | ✓ | ✗ |
| Modify agent scope | ✗ | ✗ | ✓ | ✓ |
| Ban/suspend users | ✗ | ✗ | ✓ | ✗ |
| Access all rooms | ✗ | ✗ | ✓ | ✗ |
| Make voice calls | ✓ | ✓ (AI voice) | ✓ | ✓ |

**Scope Policy Engine:**
- Deny-first: any action not explicitly allowed is denied
- Agent scope defined in capability manifest JSON
- Scope can restrict: rooms, MCP tools, human users, rate limits, time-of-day
- Scope changes require admin or owner approval
- All scope violations logged and reported

### 8.3 Audit Trail

| Property | Specification |
|----------|-------------|
| Storage | PostgreSQL (append-only, no deletions) |
| Integrity | Ed25519 signature on each entry |
| Retention | 7 years (configurable) |
| Fields | timestamp, actor_id, actor_type, action, resource_type, resource_id, metadata (JSONB), ip_address, user_agent |
| Search | Filterable by actor, action, date, entity type |
| Access | Admin role required to view |
| Events logged | Registration, login, logout, message send, message delete, file upload, agent creation, agent revocation, scope change, MCP tool call, A2A task delegation, admin action |

### 8.4 End-to-End Encryption (E2EE)

| Phase | E2EE Status | Implementation |
|-------|-------------|----------------|
| Phase 1 | No E2EE | Messages encrypted at rest (AES-256) and in transit (TLS 1.3) |
| Phase 2 | E2EE via Matrix bridge | Olm/Megolm protocol for 1:1 and group messages |
| Phase 3 | Full E2EE | Native KALEN E2EE with Matrix protocol integration |

**Key constraint:** E2EE is deferred to Phase 2 because it requires Matrix migration. OpenIM's E2EE module is not sufficiently mature for production use. This is an acknowledged gap — Phase 1 messages are encrypted at rest and in transit but not end-to-end.

### 8.5 Threat Model (STRIDE)

| Threat | Attack Vector | Mitigation | Phase |
|--------|-------------|------------|-------|
| **Spoofing** | Agent impersonates human | Ed25519 keypair + mandatory suffix + entity_type enforcement | Phase 1 |
| **Tampering** | Message content modified in transit | TLS 1.3; AES-256 at rest | Phase 1 |
| **Tampering** | Audit log modification | Append-only + Ed25519 signature | Phase 1 |
| **Repudiation** | Agent denies action | Immutable audit trail with cryptographic proof | Phase 1 |
| **Information Disclosure** | Biometric data leaked | Passkeys: only public key stored server-side | Phase 1 |
| **Information Disclosure** | Message content exposed | TLS 1.3 in transit; AES-256 at rest; E2EE Phase 2 | Phase 1–2 |
| **Denial of Service** | Flooding messages or API calls | Rate limiting, connection quotas, circuit breakers | Phase 1 |
| **Elevation of Privilege** | Agent exceeds scope | RBAC deny-first, capability manifest enforcement | Phase 1 |
| **Prompt Injection** | Malicious MCP server output | Tool output sanitization, capability attestation | Phase 1–2 |
| **Agent Card Forgery** | Forged A2A Agent Card | Signed cards (Ed25519), signature verification | Phase 3 |

---

## 9. MVP Scope

### 9.1 Phase 1 Definition (Months 1–3)

**What "MVP" means for KALEN:**
A self-hosted, deployable system where a human user can register via passkey, chat with other humans and AI agents in real-time, delegate tasks to agents, and have agents access basic tools via MCP — all with dual-identity enforcement and audit logging.

#### P0 — MUST HAVE (MVP Blockers)

| Feature | Description | User Story |
|---------|-------------|-----------|
| Human registration & login | WebAuthn passkey FIDO2 flow | US-001, US-003 |
| Agent identity creation | `Name(ai)` suffix + Ed25519 keypair + manifest | US-002, US-004 |
| 1:1 chat | Text, markdown, code blocks | US-010 |
| Group chat | Up to 100 members | US-011 |
| WebSocket real-time messaging | Live message delivery | US-013 |
| Basic admin panel | User/agent list, ban, system stats | US-040 |
| Agent scope management | RBAC policy engine | US-041 |
| Audit trail | Append-only signed logs | US-042 |
| 1:1 voice call | WebRTC P2P + TURN | US-030 |
| 2 default agents | Support(ai), Research(ai) with basic MCP tool access | US-020, US-021 |
| Agent task delegation | Human sends task via chat; agent acts | US-020 |
| Internal agent handoff | Agents delegate via NATS message bus (A2A fallback) | US-022 (simplified) |

#### P1 — SHOULD HAVE (MVP Quality)

| Feature | Description | User Story |
|---------|-------------|-----------|
| File sharing | Up to 100MB via MinIO presigned URLs | US-014 |
| Message search | Basic full-text via Elasticsearch | US-015 |
| Presence & typing indicators | Online status, typing state | US-005, US-006 |
| Agent episodic memory | Last 10 conversation turns | US-023 |
| Push notifications | FCM/APNs for offline users | US-013 (extended) |
| Read receipts | Message read status | US-005 |

#### Explicitly DEFERRED from MVP

| Feature | Reason for Deferral | Planned Phase |
|---------|-------------------|---------------|
| Group video calls | Requires SFU scaling beyond Phase 1 scope | Phase 2 |
| Channels (public/private/hybrid) | Group chat is sufficient for MVP | Phase 2 |
| E2EE | Requires Matrix migration; OpenIM E2EE immature | Phase 2 |
| Agent marketplace | Needs critical mass of agents and users | Phase 3 |
| A2A full implementation | A2A v1.0 too new for production dependency; internal fallback used | Phase 3 |
| Advanced agent memory (vector + graph) | pgvector and graph memory require significant infrastructure | Phase 3 |
| Federation | Matrix integration is a major undertaking | Phase 4 |
| Enterprise billing | No monetization until product-market fit | Phase 4 |
| Mobile app (Flutter) | Web app is MVP; mobile follows | Phase 2 |
| Desktop app (Electron) | Web app is MVP; desktop follows | Phase 2 |
| Story system (ephemeral) | Nice-to-have, not MVP-critical | Phase 2 |
| Multi-tenant workspaces | Single workspace is sufficient for MVP | Phase 2 |
| Custom agent builder (no-code) | Agent creation via config file is sufficient for MVP | Phase 3 |

### 9.2 MVP Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Backend API** | Node.js (NestJS) or Go (Gin/Echo) | Node.js for MCP ecosystem compatibility; Go for performance-critical paths |
| **Real-time** | WebSocket + NATS | WebSocket for client; NATS for service mesh |
| **Database** | PostgreSQL 16 + Redis 7 | ACID + high-performance cache |
| **Object Store** | MinIO | S3-compatible, self-hosted |
| **Search** | Elasticsearch 8 | Full-text message search |
| **AI/LLM** | Ollama (local-first) + OpenAI API (fallback) | Local-first sovereignty; API for quality |
| **MCP** | TypeScript/Python SDK (official) | Standard integration |
| **WebRTC** | LiveKit Server (Go) | Mature SFU, clean SDKs |
| **Auth** | WebAuthn (SimpleWebAuthn library) | FIDO2 compliant |
| **Frontend** | React 19 + TailwindCSS | Modern, component-rich |
| **DevOps** | Docker + Docker Compose + Traefik | One-click self-host |
| **Monitoring** | Prometheus + Grafana + Loki | Industry standard |

### 9.3 MVP Success Criteria

The MVP is considered successful when:

1. **Functional:** All P0 features are deployed and working in a self-hosted Docker Compose environment
2. **Identity:** Human registers via passkey, agent registers with `(ai)` suffix, impersonation is impossible
3. **Messaging:** 1:1 and group chat with <200ms p95 latency
4. **Agent:** Support(ai) and Research(ai) respond to tasks within 5 seconds with basic MCP tool access
5. **Security:** Audit trail captures all significant actions; RBAC enforces scope
6. **Deployment:** `git clone && docker compose up -d` produces a running system
7. **Load:** System handles 100 concurrent users without degradation

---

## 10. Roadmap

### Phase 1 — Foundation (Months 1–3)

**Goal:** Deployable MVP with human-agent coexistence.

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M1.1: Auth system | Month 1 | WebAuthn passkey registration/login + agent identity creation |
| M1.2: Messaging core | Month 1–2 | 1:1 chat, group chat, WebSocket real-time, OpenIM integration |
| M1.3: Agent runtime | Month 2 | Support(ai) + Research(ai) with basic MCP tool access |
| M1.4: Voice calls | Month 2 | 1:1 voice call via LiveKit WebRTC |
| M1.5: Admin & security | Month 3 | Admin panel, RBAC, audit trail, scope management |
| M1.6: Deployment | Month 3 | Docker Compose one-click deploy, Traefik, monitoring |

**Key risk:** OpenIM integration complexity may delay messaging core. Fallback: custom WebSocket messaging layer.

### Phase 2 — Product (Months 4–6)

**Goal:** Complete communication platform with channels, calls, and file sharing.

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M2.1: Channels | Month 4 | Public, private, agent-only, hybrid channels |
| M2.2: Group calls | Month 4 | SFU-based group voice/video via LiveKit |
| M2.3: File sharing | Month 4 | MinIO presigned URL upload/download (up to 2GB) |
| M2.4: E2EE | Month 5 | Matrix bridge for end-to-end encryption |
| M2.5: MCP gateway | Month 5 | Full MCP Gateway with 5+ server connectors |
| M2.6: Recovery | Month 5 | Passkey recovery, multi-device management |
| M2.7: Mobile app | Month 5–6 | Flutter mobile app (iOS + Android) |
| M2.8: Search | Month 6 | Full-text + semantic search |
| M2.9: Stories | Month 6 | Ephemeral 24h story system |

### Phase 3 — AI-Native (Months 7–9)

**Goal:** Full agent ecosystem with A2A protocol and marketplace.

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M3.1: A2A router | Month 7 | A2A v1.0 compliant router, Agent Card registry |
| M3.2: Agent marketplace | Month 7–8 | Third-party agent distribution, reviews, rating |
| M3.3: Multi-agent collaboration | Month 8 | Agent-to-agent task delegation, artifact exchange |
| M3.4: Advanced memory | Month 8 | Vector DB (pgvector) + graph memory for agents |
| M3.5: AI voice calls | Month 8–9 | Agent joins call as voice participant (STT + LLM + TTS) |
| M3.6: Custom agent builder | Month 9 | No-code agent creation UI |

### Phase 4 — Federation & Scale (Months 10–12)

**Goal:** Enterprise-grade platform with federation and multi-tenancy.

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M4.1: Federation | Month 10 | Matrix protocol federation with external homeservers |
| M4.2: Multi-tenant workspaces | Month 10 | Workspace isolation, billing, admin hierarchy |
| M4.3: Enterprise SSO | Month 11 | SAML, OIDC integration |
| M4.4: White-label | Month 11 | Custom branding, theme, domain |
| M4.5: Billing | Month 11 | Stripe integration, subscription tiers |
| M4.6: Compliance | Month 12 | SOC 2 Type II audit, GDPR compliance, Indonesia PDP Law |
| M4.7: Desktop app | Month 12 | Electron desktop app |

### Phase 5 — Global (Months 13–18)

**Goal:** Open-source foundation, global scale, research program.

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M5.1: Localization | Month 13 | 20+ language support |
| M5.2: Regional data centers | Month 14 | Deploy in 3+ regions |
| M5.3: Partner ecosystem | Month 15 | SDK, API partner program |
| M5.4: Public agent registry | Month 15 | Global agent discovery |
| M5.5: Academic research | Month 16 | Research program, benchmark dataset |
| M5.6: Foundation governance | Month 18 | Open-source foundation (neutral governance) |

---

## 11. Success Metrics

### 11.1 Honest Measurement Framework

> **Critical qualifier:** These are *targets*, not current performance. No metrics have been measured yet because no code is deployed. Phase 1 targets assume a successful MVP launch.

### 11.2 Quantitative Metrics

| Metric | Phase 1 Target | Phase 3 Target | Phase 5 Target | Measurement |
|--------|---------------|---------------|---------------|-------------|
| Active Users (MAU) | 1,000 | 50,000 | 1,000,000 | Unique users with ≥1 message/week |
| Active AI Agents | 500 | 25,000 | 500,000 | Agents with ≥1 action/week |
| Message Latency (p95) | <200ms | <150ms | <100ms | k6 load test |
| Agent Task Completion Rate | 80% | 90% | 95% | Tasks completed / tasks initiated |
| System Uptime | 99.5% | 99.9% | 99.99% | Prometheus metric |
| User Retention (D30) | 40% | 60% | 75% | Users active day 30 / users registered day 0 |
| Self-Host Deployments | 100 | 5,000 | 100,000 | Unique Docker pulls with active instances |
| Marketplace Agents | 5 | 500 | 10,000 | Published third-party agents |
| Authentication Success Rate | >99.5% | >99.8% | >99.9% | Successful auth / attempted auth |
| MCP Tool Call Success | >95% | >98% | >99% | Successful tool calls / attempted |

### 11.3 Qualitative Metrics

| Metric | Measurement Method | Target |
|--------|-------------------|--------|
| Developer satisfaction | Quarterly survey (NPS) | NPS > 40 |
| Agent impersonation incidents | Security audit + incident reports | Zero tolerance |
| Audit trail completeness | Random sampling of 100 actions per month | 100% of significant actions logged |
| Code contribution velocity | PRs merged per month | >20 PRs/month by Phase 3 |
| Documentation coverage | Percentage of APIs with docs | >80% by Phase 2 |
| Research citations | Papers citing KALEN architecture | >5 by Phase 3 |

### 11.4 Monetization Targets

| Tier | Price | Features | Revenue Target (Phase 3) |
|------|-------|----------|--------------------------|
| **Free** | $0 | Core chat, 3 agents, 1 workspace, self-hosted | — |
| **Pro** | $12/user/mo | 10 agents, custom branding, advanced MCP, priority support | $50K MRR |
| **Enterprise** | Custom | Unlimited agents, SSO, compliance, white-label, dedicated infra | $200K ARR |
| **Marketplace** | 15–30% commission | Agent sales, plugin sales, template sales | $10K MRR |

**Honest assessment:** Revenue targets assume successful product-market fit and are speculative. The primary Phase 1–2 goal is user adoption, not revenue.

---

## 12. Risks & Mitigations

### 12.1 Technical Risks

| # | Risk | Severity | Probability | Impact | Mitigation |
|---|------|----------|-------------|--------|-----------|
| T1 | **A2A v1.0 immaturity** — Only released April 2026; production validation minimal. Breaking changes possible. | High | High | A2A-dependent features break or need rewrite | A2A deferred to Phase 3; internal NATS message bus as Phase 1–2 fallback; protocol abstraction layer isolates core from spec changes |
| T2 | **MCP context bloat** — Tool definitions consume up to 72% of agent context window with 10+ servers | High | High | Agents become ineffective due to reduced reasoning capacity | Selective tool exposure via MCP Gateway; per-agent whitelist; deferred loading; tool summarization |
| T3 | **OpenIM integration complexity** — OpenIM's API surface is large; documentation may be incomplete | Medium | Medium | Messaging core delayed | Fallback: custom WebSocket messaging layer; Matrix Synapse as alternative backend |
| T4 | **LLM sovereignty tension** — Self-hosted claim conflicts with external LLM API dependency (OpenAI, Anthropic) | High | High | "Sovereign" claim undermined if local LLMs are insufficient | Local LLM (Ollama, vLLM) as primary; external APIs as optional fallback; document sovereignty gradient honestly |
| T5 | **Agent keypair management at scale** — Keypair rotation, revocation, and compromise recovery not proven at >10,000 agents | Medium | Medium | Compromised agents cannot be quickly contained | Short-lived tokens (24h TTL); centralized revocation list; admin console for immediate revocation |
| T6 | **WebRTC reliability** — 15–20% of corporate/mobile networks require TURN relay; SFU scaling limits | Medium | Low | Calls fail for some users or at scale | TURN server (coturn) deployed by default; SFU horizontal scaling (LiveKit); P2P fallback for 1:1 |
| T7 | **Dual-identity model unproven at scale** — The structural distinction between human and agent identity has not been validated in production with >10,000 concurrent entities | Medium | Medium | Identity confusion or impersonation incidents at scale | Incremental scaling (100 → 1,000 → 10,000); red-team security audit; mandatory suffix enforcement at all layers |

### 12.2 Strategic Risks

| # | Risk | Severity | Probability | Impact | Mitigation |
|---|------|----------|-------------|--------|-----------|
| S1 | **Big Tech competition** — Google, Microsoft, OpenAI may build similar human-agent communication into Gmail, Teams, ChatGPT | High | Medium | Market share captured before KALEN reaches scale | Sovereign/self-hosted moat; enterprises and governments (16 already on Matrix) will not accept Big Tech control; target sovereign segment first |
| S2 | **Hidden assumption: users want to talk to agents in the same app** — This is a design hypothesis, not a validated fact | High | Medium | Product-market fit fails if users reject shared communication | MVP must include user testing to validate; if false, pivot to "agent-only workspace" model |
| S3 | **Solo founder risk** — Single founder from Lhokseumawe, Aceh, building a global OS | Medium | High | Development velocity limited; key-person dependency | Open-source community building; automated CI/CD; monorepo structure enables distributed contribution |
| S4 | **Protocol fragmentation** — MCP or A2A spec changes could break integrations | Medium | Medium | Rework required for protocol compliance | Protocol abstraction layer; adapter pattern isolates core logic from spec changes; track spec evolution actively |
| S5 | **Market projection accuracy** — $182.97B by 2033 is an analyst estimate, not a guaranteed outcome | Low | High | Market grows slower than projected; TAM is smaller | Revenue model not dependent on market projection accuracy; self-hosted free tier reduces adoption friction; build for real users, not projections |

### 12.3 Operational Risks

| # | Risk | Severity | Probability | Impact | Mitigation |
|---|------|----------|-------------|--------|-----------|
| O1 | **Self-hosted ops burden** — Users unfamiliar with Docker Compose, PostgreSQL, NATS | Medium | High | Users cannot deploy; adoption blocked | One-click `docker compose up`; managed cloud option; detailed deployment docs; setup script with validation |
| O2 | **Security incidents** — Agent compromise, data breach, prompt injection | High | Medium | Trust loss, legal liability, media damage | STRIDE threat model; mandatory audit trail; rate limiting; tool output sanitization; incident response plan |
| O3 | **Infrastructure cost** — Running 10+ Docker containers (PostgreSQL, Redis, NATS, MinIO, Elasticsearch, LiveKit, etc.) requires significant resources | Medium | High | Minimum 8GB RAM is high for individual self-hosters | Lightweight mode for development (SQLite, embedded Redis); cloud-managed option; progressive feature enablement |
| O4 | **E2EE gap in Phase 1** — Messages encrypted at rest and in transit but not end-to-end | Medium | High | Privacy-conscious users reject Phase 1 | Clearly document encryption status; E2EE is Phase 2 priority; Matrix bridge is the implementation path |

---

## 13. Out of Scope

The following are **explicitly NOT part of KALEN** — not deferred, but architecturally excluded.

### 13.1 KALEN is NOT a General-Purpose AI Platform

- KALEN is not a ChatGPT competitor. It does not provide standalone AI inference.
- KALEN is not a model training framework. It does not train or fine-tune LLMs.
- KALEN is not a vector database. It uses pgvector/Qdrant but does not expose vector DB as a standalone service.
- KALEN is not a LangChain/CrewAI alternative. It uses A2A for agent orchestration, not proprietary frameworks.

### 13.2 KALEN is NOT a Blockchain/Web3 Project

- KALEN does not use blockchain for identity, messaging, or payments.
- KALEN does not issue tokens, NFTs, or cryptocurrency.
- "Sovereign" in KALEN means self-hosted infrastructure, not decentralized ledger.

### 13.3 KALEN is NOT a Social Media Platform

- KALEN does not target consumer social networking (feeds, following, influencer models).
- The "Agent Society" concept refers to structured agent collaboration, not social media dynamics.
- Stories are ephemeral communication tools, not content monetization features.

### 13.4 KALEN is NOT an Operating System Kernel

- "OS" in KALEN means "operating system" in the metaphorical sense of a platform that manages entities, resources, and communication.
- KALEN does not manage hardware, memory, or processes at the kernel level.
- KALEN runs as application-layer software on standard operating systems (Linux, macOS, Windows).

### 13.5 KALEN is NOT a Replacement for Existing Messaging Protocols

- KALEN does not invent a new messaging protocol. It uses OpenIM (Phase 1–2) and Matrix (Phase 3+).
- KALEN does not replace XMPP, MQTT, or AMQP.
- KALEN bridges to existing platforms (Slack, Discord) via integration, not replacement.

### 13.6 KALEN is NOT Guaranteed to Achieve "Agent Society"

- The "Agent Society" concept — where agents form persistent social structures, economies, and hierarchies — is a **[ASSUMPTION]**. It is a theoretical projection, not a validated phenomenon.
- KALEN *architecturally enables* agent collaboration via A2A. Whether agents spontaneously form "societies" requires 3+ years of deployment study.
- KALEN's value proposition does not depend on Agent Society emerging. The core value is: standardized agent identity + tool access + inter-agent communication in self-hosted infrastructure.

### 13.7 Explicitly Excluded Features (Not Deferred — Excluded)

| Feature | Reason |
|---------|--------|
| Deepfake detection | Out of domain — use specialized security tools |
| Content recommendation algorithm | KALEN is not a feed-based platform |
| Advertising platform | KALEN is sovereign/privacy-first; no ad model |
| Voice assistant (standalone) | KALEN agents are communication participants, not always-listening devices |
| Autonomous financial trading | Compliance and legal risk; agents can access finance tools but cannot execute trades autonomously |
| Kernel-level system management | KALEN is application-layer software |
| Real-time translation (built-in) | Use external MCP tool integration; not core platform feature |
| Agent consciousness/sentience claims | KALEN makes no claims about AI consciousness; agents are computational entities |

---

## 14. Appendix: Glossary

| Term | Definition |
|------|-----------|
| **A2A** | Agent-to-Agent Protocol — open protocol standardized by Google (donated to Linux Foundation) for inter-agent communication, task delegation, and artifact exchange. Uses JSON-RPC 2.0 over HTTP with SSE streaming. |
| **Agent Card** | A JSON document served at `/.well-known/agent.json` describing an agent's identity, capabilities, authentication method, and endpoint. Part of the A2A specification. Analogous to a business card for AI agents. |
| **Agent Society** | **[ASSUMPTION]** — The theoretical concept that AI agents will form persistent social structures (channels, hierarchies, markets) within communication infrastructure when given standardized identity, tools, and communication protocols. Not yet validated by empirical deployment. |
| **BDI** | Belief-Desire-Intention — a theoretical model from multi-agent systems. In KALEN, used as an *architectural metaphor*: belief = memory vector, desire = goal vector, intention = task queue. Not a cognitive claim. |
| **Capability Manifest** | A JSON document declaring an agent's skills, tools, rate limits, owner, and workspace scope. Used for RBAC enforcement and MCP tool access control. |
| **Coturn** | Open-source TURN/STUN server for WebRTC NAT traversal. Required when direct P2P connections fail due to firewalls or symmetric NAT. |
| **DSR** | Design Science Research — methodology for building and evaluating IT artifacts (Hevner et al., 2004). KALEN's research methodology. |
| **DTLS-SRTP** | Datagram Transport Layer Security over Secure Real-time Transport Protocol — mandatory encryption for WebRTC media streams. |
| **Dual-Identity Model** | KALEN's core security model: human identity (WebAuthn passkey, biometric, device-bound) vs. agent identity (Ed25519 keypair, capability manifest, `(ai)` suffix). Structurally and cryptographically distinct at every layer. |
| **E2EE** | End-to-End Encryption — only communicating parties can read messages; server cannot decrypt. Planned via Matrix Olm/Megolm protocol in Phase 2. |
| **Ed25519** | Elliptic curve signature algorithm used for agent keypairs. Chosen for small key size, fast verification, and strong security. |
| **FIDO2** | Fast Identity Online — standard for passwordless authentication. WebAuthn is the FIDO2 web API. |
| **H2H** | Human-to-Human communication — the model used by existing platforms (WhatsApp, Telegram, Slack, Discord). |
| **H2A** | Human-to-Agent communication — a human delegates a task or sends a message to an AI agent. |
| **JSON-RPC 2.0** | Remote procedure call protocol used by both MCP and A2A for structured request-response communication. |
| **LiveKit** | Open-source WebRTC SFU platform used for KALEN's voice/video call infrastructure. |
| **MCP** | Model Context Protocol — open protocol standardized by Anthropic (donated to Linux Foundation Agentic AI Foundation) for agent-to-tool integration. Defines how agents connect to databases, APIs, files, and other tools via standardized client-server architecture. |
| **MinIO** | S3-compatible object storage server, self-hosted. Used for file uploads, recordings, and artifact storage. |
| **NATS** | High-performance messaging system used as KALEN's inter-service event bus. |
| **Passkey** | A FIDO2 credential stored on a user's device, enabling passwordless authentication via biometric (Face ID, fingerprint) or PIN. |
| **RBAC** | Role-Based Access Control — permission system where access decisions are based on assigned roles (HUMAN, AGENT, ADMIN, OWNER). |
| **SFU** | Selective Forwarding Unit — WebRTC architecture where the server forwards media packets without transcoding. Scales better than MCU, lower quality than P2P, chosen for group calls. |
| **SSE** | Server-Sent Events — HTTP-based protocol for server-to-client streaming. Used by A2A for real-time task status updates. |
| **STRIDE** | Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege — Microsoft's threat modeling framework. Used for KALEN's security architecture. |
| **WebAuthn** | W3C Web Authentication API — browser API for FIDO2 passwordless authentication. Level 3 is the current specification. |
| **WebRTC** | Web Real-Time Communication — browser API and protocol for peer-to-peer audio, video, and data communication. |
| **Zero Trust** | Security architecture principle: "never trust, always verify." Every request is authenticated and authorized regardless of network location. |

---

**Document End**

*This PRD is a living document. It will be updated as implementation progresses and assumptions are validated or invalidated. The author commits to honest reporting: what is built will be documented as built; what is planned will remain labeled as planned.*

*Contact: Mulky Malikul Dhaher — mulkymalikuldhr@mail.com*
