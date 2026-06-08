# KALEN Architecture Decision Records (ADRs)

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)  
**Version:** 0.1.0-draft  
**Date:** 2026-06-08  

---

## Table of Contents

1. [ADR-001: Monorepo Structure](#adr-001-monorepo-structure)
2. [ADR-002: OpenIM over Matrix Synapse for Messaging](#adr-002-openim-over-matrix-synapse-for-messaging)
3. [ADR-003: WebAuthn over OAuth2 for Human Authentication](#adr-003-webauthn-over-oauth2-for-human-authentication)
4. [ADR-004: MCP (Model Context Protocol) for Tool Integration](#adr-004-mcp-model-context-protocol-for-tool-integration)
5. [ADR-005: A2A (Agent-to-Agent Protocol) for Agent Coordination](#adr-005-a2a-agent-to-agent-protocol-for-agent-coordination)
6. [ADR-006: Go for Backend Services, TypeScript for Frontend and Edge](#adr-006-go-for-backend-services-typescript-for-frontend-and-edge)
7. [ADR-007: PostgreSQL with pgvector for Relational and Vector Data](#adr-007-postgresql-with-pgvector-for-relational-and-vector-data)
8. [ADR-008: NATS JetStream for Event Backbone](#adr-008-nats-jetstream-for-event-backbone)
9. [ADR-009: Ed25519 Keypairs for Agent Authentication](#adr-009-ed25519-keypairs-for-agent-authentication)
10. [ADR-010: Dual Authentication Convergence on JWT](#adr-010-dual-authentication-convergence-on-jwt)

---

## ADR-001: Monorepo Structure

### Status

**Accepted** — 2026-06-08

### Context

KALEN comprises multiple services (Identity, Messaging, MCP Gateway, A2A Router), a web frontend, shared libraries, and infrastructure configurations. We need to decide how to organize this code across version control repositories.

The options considered were:

1. **Polyrepo** — Each service, the frontend, and shared libraries in separate repositories.
2. **Monorepo** — All code in a single repository with directory-based project separation.
3. **Hybrid** — Core services in one monorepo; peripheral tools and integrations in separate repos.

### Decision

We choose **monorepo** — all KALEN code lives in a single repository with the following top-level directory structure:

```
kalen/
├── services/
│   ├── identity/          # Go service
│   ├── messaging/         # Go service
│   ├── mcp-gateway/       # Go service
│   └── a2a-router/        # Go service
├── apps/
│   ├── web/               # Next.js frontend
│   ├── cli/               # TypeScript CLI (kln)
│   └── mobile/            # React Native (future)
├── libs/
│   ├── go-kalen/          # Shared Go libraries (proto definitions, auth, errors)
│   ├── ts-kalen/          # Shared TypeScript libraries (API client, types)
│   └── proto/             # Protobuf definitions and generated code
├── infra/
│   ├── docker/            # Dockerfiles and Docker Compose
│   ├── k8s/               # Kubernetes manifests
│   └── terraform/         # Infrastructure as code (future)
├── docs/                  # Documentation
├── scripts/               # Build, CI, and utility scripts
└── tools/                 # Development tooling (linters, generators)
```

### Rationale

1. **Atomic cross-service changes.** When a protobuf definition changes, the service, the API client, and the frontend can be updated in a single commit. In a polyrepo, this requires coordinated PRs across repositories with dependency version bumps — a process that is error-prone and slow.

2. **Shared type safety.** The `libs/` directory provides shared libraries that are consumed by services and apps. In a monorepo, these are always in sync because they are built from the same source tree. In a polyrepo, shared libraries must be versioned, published, and consumed through package registries, introducing version skew.

3. **Simplified refactoring.** Renaming a function across service boundaries (e.g., changing a gRPC method signature) is a single find-and-replace operation in a monorepo. In a polyrepo, it requires changes in multiple repositories with careful versioning.

4. **Unified CI/CD.** A single CI pipeline can build, test, and deploy affected projects based on change detection. This is simpler to configure and maintain than N independent pipelines with cross-repository triggers.

5. **Onboarding friction.** A new developer clones one repository and has the entire system. No need to discover, clone, and configure multiple repositories with their own build tooling.

### Consequences

**Positive:**

- Cross-service changes are atomic and easy to review.
- Shared libraries are always in sync.
- Single source of truth for the entire system.
- Simplified onboarding for new contributors.
- Easier to enforce consistent code style, linting, and testing standards.

**Negative:**

- Repository size will grow over time. Mitigated by Git's efficient object storage and the fact that KALEN is not a large organization with hundreds of developers.
- Build times can increase if not managed carefully. Mitigated by using build tools that support incremental builds and change detection (e.g., Turborepo for TypeScript, Go's built-in caching).
- Access control is repository-level, not directory-level. If a contributor has write access to the repository, they have write access to all projects. Mitigated by CODEOWNERS files and branch protection rules.
- CI complexity increases — the pipeline must detect which projects are affected by a change and only build/test those. This requires investment in build tooling but pays off quickly.

**Risks:**

- If the monorepo grows very large (100K+ files), Git operations may slow down. This is unlikely for KALEN's scope but would be addressed by sparse checkout or repository splitting if it becomes a problem.
- Secret management must be handled carefully — secrets for one service should not be accessible to another. Mitigated by using environment-specific secret injection at deploy time, not committed secrets.

---

## ADR-002: OpenIM over Matrix Synapse for Messaging

### Status

**Accepted** — 2026-06-08

### Context

KALEN requires a messaging system that supports real-time communication between humans and agents. The messaging system must provide:

- 1:1 and group chat
- WebSocket-based real-time delivery
- Message persistence and search
- File attachments
- Extensible message types (for MCP tool results, A2A task references)
- Pluggable authentication (KALEN needs to use its own identity system, not the messaging platform's)
- Self-hostable (no SaaS dependency for core messaging)
- Production-grade reliability

The options considered were:

1. **OpenIM** — Open-source instant messaging server, written in Go, designed for integration.
2. **Matrix Synapse** — Open-source Matrix protocol server, written in Python.
3. **Custom messaging** — Build a messaging server from scratch using WebSocket + PostgreSQL.
4. **LiveKit** — Real-time audio/video SDK with chat features.

### Decision

We choose **OpenIM** as the messaging platform for KALEN.

### Rationale

1. **Integration-first design.** OpenIM was built to be embedded into applications, not to be a standalone chat app. It provides:
   - gRPC and HTTP APIs for all operations (not just a client SDK).
   - Webhook/callback system for receiving events (message sent, group member changed).
   - Pluggable authentication via auth hooks — OpenIM can delegate authentication to KALEN's Identity Service.
   
   Matrix Synapse, by contrast, is designed as a standalone homeserver. Integrating a custom auth system requires implementing a Synapse auth provider module in Python, which is less straightforward and less documented.

2. **Performance characteristics.** OpenIM is written in Go and handles 100K+ concurrent WebSocket connections per instance. Synapse is written in Python and is known for performance limitations at scale — the Matrix ecosystem recommends Synapse only for small deployments, suggesting Dendrite (Go) or Conduit (Rust) for larger ones, but both are less mature.

   Benchmark comparison (from community reports, not our own testing):

   | Metric | OpenIM | Synapse |
   |--------|--------|---------|
   | Concurrent WS connections/instance | ~100K | ~10K |
   | Message delivery latency (P50) | ~5ms | ~50ms |
   | Memory usage per 10K connections | ~2 GB | ~8 GB |
   | Language | Go | Python |

3. **Simpler protocol.** OpenIM uses a straightforward REST + WebSocket API. Matrix uses the Matrix protocol, which is powerful but complex — it includes federation (which KALEN doesn't need), end-to-end encryption (which KALEN will handle at a different layer), and a decentralized identity system (which conflicts with KALEN's centralized identity model).

   KALEN does not need Matrix federation because all participants (humans and agents) are within the KALEN system. Federation adds complexity without benefit in this use case.

4. **Agent-friendly message types.** OpenIM supports custom message types through its message extension mechanism. This allows KALEN to define message types for MCP tool results, A2A task references, and agent status updates without forking the server. Synapse supports custom event types through Matrix's event schema, but the validation and rendering pipeline is more complex.

5. **Production track record.** OpenIM is used in production by organizations serving millions of users. It has a commercial backing company (OpenIMSDK) that provides enterprise support. Synapse is also production-proven (used by Element, the French government), but its strengths (federation, E2EE) are not KALEN's priorities.

### Consequences

**Positive:**

- High-performance messaging with low-latency WebSocket delivery.
- Clean integration APIs (gRPC + HTTP) that fit KALEN's service architecture.
- Pluggable authentication that allows KALEN's Identity Service to own auth.
- No unnecessary complexity from federation or E2EE that KALEN doesn't use.
- Go-based — consistent with KALEN's backend language choice (ADR-006).

**Negative:**

- OpenIM has a smaller community than Matrix. Fewer third-party integrations, fewer Stack Overflow answers, fewer blog posts.
- OpenIM's documentation, while improving, is less comprehensive than Matrix's spec documentation.
- OpenIM uses MongoDB for message storage and MySQL for its own metadata. This introduces two additional databases that KALEN would not otherwise need. However, these are internal to OpenIM — KALEN does not query them directly.
- OpenIM is less extensible than Matrix at the protocol level. If KALEN needs a messaging feature that OpenIM doesn't support, it must either contribute upstream or fork.
- Vendor risk: OpenIMSDK is the primary maintainer. If they change direction or licensing, KALEN would need to fork. Mitigated by the Apache 2.0 license, which guarantees the right to fork.

**Rejected alternatives:**

- **Matrix Synapse:** Rejected because of performance concerns (Python), unnecessary federation complexity, and a decentralized identity model that conflicts with KALEN's centralized identity design.
- **Custom messaging:** Rejected because building a production-grade messaging server is 6-12 months of engineering for features that OpenIM already provides (message ordering, delivery receipts, offline push, read tracking).
- **LiveKit:** Rejected because it is primarily a real-time audio/video platform, not a persistent messaging system. Chat is a secondary feature.

---

## ADR-003: WebAuthn over OAuth2 for Human Authentication

### Status

**Accepted** — 2026-06-08

### Context

KALEN needs an authentication mechanism for human users. The requirements are:

- **Phishing resistance** — Users should not be able to be tricked into authenticating to a fake KALEN instance.
- **No passwords** — Passwords are the #1 attack vector (reuse, phishing, brute force). KALEN should eliminate them entirely.
- **Hardware-backed** — Authentication should require possession of a physical device (phone, security key).
- **Privacy-preserving** — The authentication system should not require sharing credentials with third-party identity providers.
- **Self-contained** — KALEN should own the authentication flow, not delegate to Google/GitHub/Microsoft.

The options considered were:

1. **WebAuthn (FIDO2)** — W3C standard for passwordless authentication using public-key cryptography.
2. **OAuth2 / OIDC with social providers** — Delegate authentication to Google, GitHub, Microsoft, etc.
3. **Traditional email + password** — The familiar approach with known weaknesses.
4. **Magic link (email-based passwordless)** — One-time login links sent via email.
5. **Passkeys via platform authenticator** — Build on top of WebAuthn with platform-managed passkeys (Apple, Google, Windows Hello).

### Decision

We choose **WebAuthn (FIDO2)** as the primary authentication mechanism for human users. Passkeys are a supported authenticator type within WebAuthn — this is not an either/or choice.

### Rationale

1. **Phishing resistance by design.** WebAuthn binds authentication to a specific Relying Party (RP) origin. A user's credential for `kalen.example.com` cannot be used on `kalen-evil.example.com` — the authenticator rejects the request because the origin doesn't match. This is a cryptographic guarantee, not a user education problem.

   OAuth2 with social providers does not provide this. A user who clicks a phishing link and authenticates via Google on the fake site has just given the attacker their Google session. OAuth2 protects the identity provider, not the relying party.

2. **No passwords to steal, reuse, or forget.** WebAuthn eliminates the entire class of password-related attacks:
   - No credential stuffing (there are no passwords to stuff).
   - No password reuse across sites.
   - No weak passwords.
   - No password reset flows (which are themselves attack vectors).

3. **Cryptographic proof of possession.** Each WebAuthn credential is a public-private keypair. The private key never leaves the authenticator. Authentication is a signature over a server challenge — proof that the user possesses the authenticator without revealing the private key. This is strictly stronger than a shared secret (password).

4. **Self-contained identity.** KALEN does not depend on Google, GitHub, or any other identity provider for user authentication. This means:
   - No provider outages can lock users out.
   - No terms-of-service changes can disrupt authentication.
   - No user data is shared with third parties.
   - No vendor lock-in to a specific social provider's API.

5. **Privacy-preserving.** WebAuthn credentials are site-specific. A credential registered on KALEN cannot be used to track the user across other sites. Additionally, the FIDO2 protocol supports resident keys and non-resident keys — KALEN can choose the privacy level appropriate for its use case.

6. **Broad device support.** WebAuthn is supported by all modern browsers and operating systems:
   - Apple: Touch ID, Face ID, and security keys via Safari/iOS.
   - Google: Android fingerprint, face unlock, and security keys via Chrome.
   - Microsoft: Windows Hello and security keys via Edge.
   - Cross-platform: USB/NFC/Bluetooth security keys (YubiKey, etc.) work everywhere.

### Consequences

**Positive:**

- Strongest possible phishing resistance — cryptographically bound to origin.
- No passwords — eliminates the #1 attack vector.
- Self-contained — no third-party identity provider dependency.
- Privacy-preserving — credentials are site-specific.
- Standards-based — W3C recommendation, not a proprietary protocol.

**Negative:**

- **Account recovery complexity.** If a user loses all their authenticators (e.g., phone is lost and backup security key is lost), they cannot authenticate. KALEN must implement a recovery flow, which will likely involve:
  - Backup authenticator registration (encourage users to register 2+ authenticators).
  - Recovery codes (printed and stored offline, similar to TOTP backup codes).
  - Admin-assisted recovery for enterprise deployments (verified via out-of-band identity proofing).
  
  This is a significant UX consideration. However, it is strictly better than the password recovery status quo (email-based resets that are themselves phishing targets).

- **First-time user friction.** Users unfamiliar with WebAuthn may be confused by the browser's authenticator prompt. This can be mitigated with:
  - Clear onboarding UI that explains what is happening.
  - Progressive enhancement — start with platform authenticators (Face ID, Windows Hello) that users already understand.
  - Fallback recovery codes for users who cannot use any authenticator.

- **No social login convenience.** Users cannot click "Sign in with Google." For users who expect this, KALEN can add OAuth2 as a secondary authentication method in the future, but it will not be the primary method.

- **Server-side complexity.** WebAuthn registration and authentication ceremonies require careful implementation (challenge generation, attestation verification, signature verification, counter tracking). This is more complex than OAuth2 redirect flows. However, well-audited libraries exist for Go (e.g., `go-webauthn/webauthn`).

**Rejected alternatives:**

- **OAuth2 / OIDC:** Rejected as primary auth because it delegates identity to third parties (violating self-contained requirement), does not provide phishing resistance for KALEN specifically (only for the IdP), and creates a dependency on external services. May be added as a secondary auth method in the future.
- **Email + password:** Rejected because passwords are the #1 attack vector and KALEN's threat model prioritizes phishing resistance.
- **Magic link:** Rejected because email-based authentication is vulnerable to email account compromise, email interception, and does not provide cryptographic proof of possession.
- **Passkeys-only:** Passkeys are a subset of WebAuthn — they are supported as authenticator type within the WebAuthn framework. Choosing "WebAuthn" includes passkeys.

---

## ADR-004: MCP (Model Context Protocol) for Tool Integration

### Status

**Accepted** — 2026-06-08

### Context

KALEN agents need to invoke external tools — APIs, databases, file systems, code execution environments. The tool integration layer must support:

- **Diverse tool types** — REST APIs, CLI tools, database queries, code execution sandboxes.
- **Dynamic discovery** — Agents should be able to discover available tools at runtime, not rely on a static list.
- **Structured I/O** — Tool inputs and outputs should be typed and validated, not ad-hoc strings.
- **Streaming results** — Long-running tools should stream partial results.
- **Permission enforcement** — Not all agents should be able to invoke all tools.
- **Multiple tool servers** — Tools may be provided by independent servers, not a monolithic tool registry.

The options considered were:

1. **MCP (Model Context Protocol)** — Anthropic's open protocol for connecting AI models to external tools and data sources.
2. **OpenAI Function Calling** — OpenAI's proprietary function calling API.
3. **Custom RPC framework** — Build a bespoke tool invocation protocol using gRPC.
4. **LangChain Tools** — Use LangChain's tool abstraction layer.
5. **REST API gateway** — Each tool exposes a REST endpoint; KALEN calls them directly.

### Decision

We choose **MCP (Model Context Protocol)** as the tool integration protocol for KALEN.

### Rationale

1. **Protocol-level standardization.** MCP is an open protocol (specification published at modelcontextprotocol.io) that defines:

   - **Transport:** stdio, HTTP+SSE, and WebSocket — tools can choose the transport that fits their deployment model.
   - **Message format:** JSON-RPC 2.0 — well-specified, widely implemented, with built-in error handling.
   - **Capability negotiation:** Client and server exchange capabilities on connection, enabling forward-compatible evolution.
   - **Tool schema:** Tools are described with JSON Schema for input validation and output typing.

   This level of standardization means that any MCP-compatible tool server can be plugged into KALEN's MCP Gateway without writing KALEN-specific integration code.

2. **Ecosystem momentum.** MCP has rapidly become the de facto standard for AI agent tool use:

   - Anthropic (Claude) natively supports MCP.
   - OpenAI has announced MCP support.
   - Major platforms (Cursor, Windsurf, Replit) have adopted MCP.
   - Hundreds of community-built MCP servers exist for popular services (GitHub, Slack, Google Drive, PostgreSQL, etc.).

   By choosing MCP, KALEN gains access to this growing ecosystem. A tool built for Claude or Cursor will work with KALEN agents without modification.

3. **Separation of tool definition from agent logic.** MCP enforces a clean separation:

   - **Tool servers** define what tools exist and how to invoke them. They are independent processes that know nothing about the agents calling them.
   - **MCP clients** (KALEN's Gateway) discover tools, route invocations, and handle errors. They know nothing about tool internals.
   - **Agents** express intent ("I need to create a GitHub issue") without knowing which tool server handles it.

   This three-way separation means tools can be added, updated, and removed without changing agent code.

4. **Built-in streaming.** MCP supports streaming results via SSE (Server-Sent Events). This is critical for long-running tools (code execution, data analysis) where the agent needs partial results before completion.

5. **Composability.** MCP servers can expose not just tools, but also **resources** (read-only data like file contents) and **prompts** (reusable prompt templates). While KALEN primarily uses the tools capability, the resource and prompt capabilities may be useful for future features (e.g., giving agents access to document repositories).

6. **Gateway pattern.** MCP's client-server model naturally fits KALEN's gateway pattern. The MCP Gateway acts as a multiplexing client — it connects to multiple MCP tool servers and presents a unified tool catalog to agents. This is the intended architecture; MCP was designed for this use case.

### Consequences

**Positive:**

- Access to the rapidly growing MCP tool ecosystem.
- Clean separation between tool definition, routing, and agent logic.
- Standardized schema validation for tool I/O.
- Built-in streaming support for long-running tools.
- Forward-compatible via capability negotiation.
- No vendor lock-in — MCP is an open specification, not tied to Anthropic's products.

**Negative:**

- **MCP is young.** The specification is still evolving (as of 2026, MCP is at version 2025-03-26 of the spec). Breaking changes are possible. Mitigated by KALEN's MCP Gateway, which can absorb spec changes without affecting agent code.
- **No built-in auth.** The MCP specification does not define authentication between client and server. KALEN must implement its own auth at the gateway level (which it does — see ADR-003 and Security Design). This is acceptable because auth is a deployment concern, not a protocol concern.
- **JSON-RPC overhead.** MCP uses JSON-RPC 2.0, which is human-readable but less efficient than a binary protocol like gRPC/protobuf. For KALEN's use case (tool invocations that typically take 100ms-10s), the JSON serialization overhead (~1ms) is negligible.
- **Server management burden.** Each MCP tool server is an independent process that must be deployed, monitored, and updated. KALEN's MCP Gateway must implement health checking, retry logic, and circuit breaking for each server. This is inherent to the distributed tool model and is not specific to MCP.

**Rejected alternatives:**

- **OpenAI Function Calling:** Rejected because it is a proprietary API, not a protocol. It ties KALEN to OpenAI's tool schema format and does not define a server-side runtime. There is no way to run an "OpenAI Function Calling server" — it's purely a client-side specification.
- **Custom RPC framework:** Rejected because building a tool protocol from scratch would duplicate MCP's work and lack ecosystem compatibility. MCP already solves the problems KALEN faces (discovery, schema validation, streaming).
- **LangChain Tools:** Rejected because LangChain is a Python/TypeScript library, not a protocol. It defines tool abstractions in code, not on the wire. KALEN needs a protocol that works across languages and processes.
- **REST API gateway:** Rejected because a collection of REST endpoints does not provide tool discovery, schema validation, or streaming. Each tool would need KALEN-specific integration code, defeating the goal of a plug-and-play tool ecosystem.

---

## ADR-005: A2A (Agent-to-Agent Protocol) for Agent Coordination

### Status

**Accepted** — 2026-06-08

### Context

KALEN agents must coordinate with each other to accomplish complex tasks. This requires:

- **Agent discovery** — An agent must be able to find other agents with specific capabilities.
- **Task delegation** — Agent A must be able to ask Agent B to perform a task.
- **Asynchronous communication** — Tasks may take seconds or hours; agents must not block.
- **Structured artifacts** — Task results must be typed, not unstructured text.
- **Task lifecycle management** — Track task state (created, working, completed, failed).
- **Multi-agent orchestration** — A parent agent must be able to decompose a task into subtasks assigned to multiple child agents.

The options considered were:

1. **A2A (Agent-to-Agent Protocol)** — Google's open protocol for inter-agent communication and task delegation.
2. **Custom message-based coordination** — Agents coordinate via OpenIM messages with structured payloads.
3. **gRPC service mesh** — Each agent exposes a gRPC service; agents call each other directly.
4. **LangGraph / CrewAI** — Use an existing multi-agent orchestration framework.

### Decision

We choose **A2A (Agent-to-Agent Protocol)** for agent-to-agent coordination in KALEN.

### Rationale

1. **Protocol-level standardization for agent interaction.** A2A defines a standard protocol for:
   - **Agent Cards** — Machine-readable descriptions of agent capabilities, authentication requirements, and interaction protocols. This enables automatic agent discovery.
   - **Task lifecycle** — Standard states (submitted, working, completed, failed, cancelled) and state transitions. This enables interoperable task management.
   - **Artifact exchange** — Structured output format for task results. This enables type-safe result handling.
   - **Message streaming** — Real-time updates during task execution. This enables progress tracking.

   Without A2A, KALEN would need to define all of these from scratch — a significant specification effort with no ecosystem benefit.

2. **Decoupled architecture.** A2A is fundamentally a protocol, not a library. Agents communicate over HTTP (REST + SSE), not in-process function calls. This means:

   - Agents can be written in any language.
   - Agents can run on different machines.
   - Agents can be developed, deployed, and updated independently.
   - There is no shared memory, shared code, or shared runtime.

   This aligns with KALEN's microservice architecture and avoids the tight coupling of in-process orchestration frameworks.

3. **Agent Card as a contract.** The Agent Card is the most valuable concept in A2A. It serves as a machine-readable contract between agents:

   ```json
   {
     "capabilities": [
       {
         "id": "code.write",
         "name": "Write Code",
         "input_schema": { /* JSON Schema */ },
         "output_artifact_types": ["source_code", "diff"]
       }
     ],
     "interaction_protocols": {
       "synchronous": false,
       "streaming": true,
       "max_concurrent_tasks": 5
     }
   }
   ```

   This allows KALEN's A2A Router to:
   - Match task requests to capable agents (capability-based routing).
   - Enforce per-agent concurrency limits (respecting `max_concurrent_tasks`).
   - Choose the appropriate interaction mode (sync vs. async vs. streaming).

4. **Ecosystem potential.** A2A is backed by Google and has been adopted by multiple AI platforms. As the ecosystem grows, KALEN agents will be able to interoperate with external A2A-compatible agents (from other platforms, organizations, or open-source projects) without custom integration.

5. **Complementary to MCP.** A2A and MCP solve different problems:

   | Aspect | MCP | A2A |
   |--------|-----|-----|
   | What it connects | Agent → Tool | Agent → Agent |
   | Interaction model | Request-Response / Streaming | Task lifecycle with artifacts |
   | Discovery | Tool catalog | Agent cards |
   | State | Stateless (tools don't maintain state) | Stateful (tasks have lifecycle) |
   | Output | Tool result | Artifact |

   KALEN uses both: MCP for tools, A2A for agents. They are complementary, not competing.

6. **Router pattern.** A2A's client-server model fits KALEN's router pattern. The A2A Router acts as a central coordinator that:
   - Maintains the agent card registry.
   - Routes task requests to appropriate agents.
   - Tracks task state.
   - Relays artifacts.
   - Handles timeouts and failures.

   This avoids the N² connectivity problem of direct agent-to-agent communication.

### Consequences

**Positive:**

- Standardized agent discovery via Agent Cards.
- Clean task lifecycle with well-defined state transitions.
- Structured artifact exchange for type-safe results.
- Language-agnostic protocol (HTTP-based).
- Ecosystem compatibility with other A2A implementations.
- Complementary to MCP (tools) — no overlap.

**Negative:**

- **A2A is very young.** As of 2026, A2A is a relatively new specification with limited production deployment. Breaking changes are likely. KALEN's A2A Router must absorb spec changes.
- **HTTP overhead for high-frequency coordination.** A2A uses HTTP for task management, which introduces latency for high-frequency agent interactions. For KALEN's use case (tasks that take seconds to minutes), this is acceptable. Sub-millisecond agent coordination would require a different approach (shared memory, in-process scheduling), but that is not KALEN's use case.
- **No built-in message bus.** A2A does not define an event bus for task state changes. KALEN must use NATS (per ADR-008) to publish task lifecycle events. This is by design — A2A is a protocol, not infrastructure.
- **Router as a single point of coordination.** All agent coordination flows through the A2A Router. If the router is down, agents cannot delegate tasks. Mitigated by running multiple router instances behind a load balancer (horizontal scaling), with task state persisted in PostgreSQL (no lost tasks on router failure).

**Rejected alternatives:**

- **Custom message-based coordination:** Rejected because it would require defining a task lifecycle, artifact format, and discovery mechanism from scratch. This is exactly what A2A already specifies. Additionally, message-based coordination (via OpenIM) conflates human-readable conversation with machine-readable task state, making it difficult to query, monitor, and audit task progress.
- **gRPC service mesh:** Rejected because it requires direct agent-to-agent connectivity (N² connections), no standard for agent discovery, no standard for task lifecycle, and tight coupling between agent implementations. The gRPC approach works for a small, known set of agents but does not scale to dynamic agent ecosystems.
- **LangGraph / CrewAI:** Rejected because these are in-process orchestration frameworks, not protocols. They require all agents to run in the same Python process, share the same runtime, and be written in Python. This conflicts with KALEN's multi-language, multi-process architecture.

---

## ADR-006: Go for Backend Services, TypeScript for Frontend and Edge

### Status

**Accepted** — 2026-06-08

### Context

KALEN needs to choose programming languages for:

1. Backend services (Identity, Messaging, MCP Gateway, A2A Router)
2. Frontend web application
3. CLI tool
4. Shared libraries

The options for backend were: Go, Rust, Python, Java, Node.js/TypeScript.  
The options for frontend were: TypeScript (React/Next.js), Python (HTMX), Go (templ).

### Decision

- **Backend services:** Go
- **Frontend web app:** TypeScript with Next.js
- **CLI tool:** TypeScript (for consistency with the frontend; the CLI shares API client code)
- **Shared Go libraries:** Go (in `libs/go-kalen/`)
- **Shared TypeScript libraries:** TypeScript (in `libs/ts-kalen/`)
- **Protocol definitions:** Protobuf (in `libs/proto/`), with generated code for both Go and TypeScript

### Rationale for Go (Backend)

1. **Concurrency model.** KALEN services are I/O-heavy — they make many concurrent database queries, NATS publishes, gRPC calls, and HTTP requests. Go's goroutine model (lightweight, multiplexed onto OS threads) is purpose-built for this. Writing a concurrent HTTP handler in Go is trivial:

   ```go
   func (s *Server) HandleInvoke(w http.ResponseWriter, r *http.Request) {
       go func() {
           result, err := s.toolServer.Call(ctx, input)
           s.publishAuditEvent(result, err)
       }()
       // respond immediately with task_id
   }
   ```

   The equivalent in Python requires asyncio expertise and still has GIL limitations. In Java, it requires thread pool management. In Rust, it requires async runtime understanding and more complex lifetimes.

2. **Performance profile.** Go provides:
   - Sub-millisecond cold start (critical for serverless-like scaling).
   - Low memory footprint (50-100 MB for a typical KALEN service, vs. 500 MB+ for Java, 200 MB+ for Node.js).
   - Predictable GC pauses (< 1ms for KALEN's allocation patterns).
   
   Rust would be faster and use less memory, but the development velocity tradeoff is significant (see below).

3. **gRPC and protobuf support.** Go has first-class gRPC and protobuf support via `google.golang.org/grpc` and `google.golang.org/protobuf`. These are the same libraries used by the gRPC project itself. Protocol buffer code generation is seamless and well-documented.

4. **Alignment with OpenIM.** OpenIM is written in Go. By using Go for KALEN's backend services, we can:
   - Read and understand OpenIM's source code when debugging integration issues.
   - Contribute fixes upstream if needed.
   - Use the same gRPC client libraries that OpenIM provides.
   - Avoid language boundary friction (no Go↔Python FFI, no Go↔Java serialization mismatch).

5. **Development velocity.** Go's simplicity (small language spec, no generics complexity until recently, no macros, no borrow checker) means:
   - Faster onboarding for new contributors.
   - Less time spent on language-level bugs and more on business logic.
   - Easier code review — Go code tends to be explicit and readable.
   
   Rust would provide better performance and memory safety guarantees, but at a significant development velocity cost. KALEN is not a system where microsecond-level latency matters — the bottleneck is I/O (database, network), not CPU.

6. **Single binary deployment.** Go compiles to a single static binary. No runtime, no virtual machine, no dependency installation. This simplifies Docker images (FROM scratch) and deployment.

### Rationale for TypeScript (Frontend)

1. **Next.js ecosystem.** Next.js is the most full-featured React framework for production web applications. It provides:
   - Server-side rendering (SSR) for SEO and initial load performance.
   - Static site generation (SSG) for documentation and marketing pages.
   - API routes for backend-for-frontend (BFF) patterns.
   - Built-in image optimization, font optimization, and script management.
   - Strong TypeScript integration.

2. **Type safety end-to-end.** By using TypeScript on both the frontend and the CLI, and by generating TypeScript API clients from protobuf definitions, KALEN achieves type safety from the database to the DOM:

   ```
   Protobuf → Go (backend) → JSON API → TypeScript (frontend)
   ```

   Changes to the protobuf definition propagate to both Go and TypeScript, catching breaking changes at compile time.

3. **Shared libraries.** The TypeScript API client (`libs/ts-kalen/`) is shared between the web app and the CLI. This ensures consistent API usage across all client-facing code.

4. **React ecosystem.** React's component model and hooks API provide a productive UI development experience. The shadcn/ui component library (used by KALEN) is built on Radix UI primitives with Tailwind CSS styling — it is TypeScript-first and React-native.

### Consequences

**Positive:**

- Go's concurrency model is ideal for KALEN's I/O-heavy backend services.
- Single binary deployment simplifies operations.
- Alignment with OpenIM (Go) reduces integration friction.
- TypeScript provides type safety on the frontend and CLI.
- Shared TypeScript libraries reduce code duplication.
- Protobuf generates code for both Go and TypeScript, maintaining type consistency.

**Negative:**

- **Two languages.** The team must be proficient in both Go and TypeScript. This is a common tradeoff for full-stack projects and is manageable because the boundary is clean: Go is backend-only, TypeScript is frontend/CLI-only. No polyglot services.
- **Go's error handling verbosity.** Go's explicit error handling (`if err != nil`) is more verbose than exceptions. This is a style preference, not a correctness issue. The Go community considers explicit error handling a feature, not a bug.
- **Go's lack of expressive type system.** Go does not have sum types (algebraic data types), pattern matching, or advanced generics. This makes some domain modeling (e.g., the A2A task state machine) more verbose than in Rust or TypeScript. Mitigated by using interfaces and type switches.
- **TypeScript runtime overhead.** TypeScript compiles to JavaScript, which has higher runtime overhead than Go for CPU-intensive tasks. This is not a concern for KALEN's frontend, which is I/O-bound (API calls, DOM updates).

**Rejected alternatives:**

- **Rust (backend):** Rejected because of development velocity concerns. Rust's borrow checker and lifetime system add significant cognitive overhead for backend service development where the performance benefit is marginal (I/O-bound, not CPU-bound). Rust would be reconsidered for performance-critical components (e.g., a custom WebSocket server handling millions of connections), but that is not KALEN's current scale.
- **Python (backend):** Rejected because of GIL limitations for concurrent I/O, higher memory footprint, slower cold start, and lack of alignment with OpenIM (Go).
- **Java (backend):** Rejected because of higher memory footprint, slower cold start, GC pause concerns, and framework complexity (Spring Boot is powerful but heavy). Java is a good choice for enterprise systems with established Java teams, but KALEN does not have that constraint.
- **Node.js/TypeScript (backend):** Rejected because JavaScript's single-threaded model requires careful async programming for concurrent I/O, and Node.js has higher memory usage than Go for equivalent workloads. TypeScript is reserved for frontend/CLI where its strengths (DOM API, React ecosystem) are relevant.

---

## ADR-007: PostgreSQL with pgvector for Relational and Vector Data

### Status

**Accepted** — 2026-06-08

### Context

KALEN needs a primary database that supports:

1. **Relational data** — Identities, rooms, tasks, artifacts, audit logs. These require ACID transactions, foreign keys, and joins.
2. **Vector similarity search** — Semantic search across messages, agent capabilities, and tasks. This requires approximate nearest neighbor (ANN) search on high-dimensional vectors.
3. **JSONB** — Flexible schema for tool configurations, agent cards, and message enrichment data.
4. **Full-text search** — Basic text search as a fallback when Elasticsearch is not available.

The options considered were:

1. **PostgreSQL + pgvector** — PostgreSQL with the pgvector extension for vector similarity search.
2. **PostgreSQL + separate vector DB (Pinecone/Weaviate/Milvus)** — PostgreSQL for relational data; a dedicated vector database for similarity search.
3. **MongoDB + Atlas Vector Search** — MongoDB for all data; Atlas Vector Search for similarity.
4. **MySQL + separate vector DB** — MySQL for relational; dedicated vector DB for similarity.
5. **SQLite + separate vector DB** — SQLite for relational (simpler ops); dedicated vector DB for similarity.

### Decision

We choose **PostgreSQL + pgvector** as the unified data store for both relational and vector data.

### Rationale

1. **Single system to operate.** By using pgvector within PostgreSQL, KALEN avoids operating a separate vector database. This means:

   - One backup strategy (pg_dump).
   - One replication setup (streaming replication).
   - One monitoring stack (PostgreSQL metrics).
   - One access control model (PostgreSQL roles and RLS).
   - One connection pooler (PgBouncer).
   
   A separate vector database would double the operational surface area — two systems to deploy, monitor, backup, upgrade, and secure.

2. **Transactional consistency.** Vector embeddings are stored alongside the data they represent. When a message is inserted, its embedding can be inserted in the same transaction:

   ```sql
   BEGIN;
   INSERT INTO messaging_schema.message_envelopes (message_id, room_id, sender_suffix, ...)
   VALUES ('uuid-1', 'room-1', '@alice#a3f1', ...);
   
   INSERT INTO vector_schema.embeddings (source_type, source_id, embedding, model_name)
   VALUES ('message', 'uuid-1', '[0.1, 0.2, ...]', 'text-embedding-3-small');
   
   COMMIT;
   ```

   With a separate vector database, this would require a dual-write pattern (write to PostgreSQL, then write to the vector DB) with no transactional guarantee. If the vector DB write fails, the embedding is lost until a reconciliation job detects and fixes it.

3. **pgvector performance is sufficient for KALEN's scale.** pgvector supports:

   - **Exact search** (brute-force) for small datasets (< 100K vectors).
   - **IVFFlat index** for approximate search on datasets up to ~10M vectors.
   - **HNSW index** (as of pgvector 0.5.0) for approximate search with better recall-latency tradeoff on datasets up to ~100M vectors.

   KALEN's projected vector scale:
   - Messages: ~1M/month → ~12M/year
   - Agent capabilities: ~10K
   - Tasks: ~100K/month → ~1.2M/year

   Even at 10x projected scale, pgvector with HNSW can handle the vector search workload. Dedicated vector databases (Pinecone, Weaviate) are designed for billions of vectors — overkill for KALEN's needs.

4. **Query composability.** Because vector data lives in PostgreSQL, KALEN can combine vector similarity with relational filters in a single query:

   ```sql
   SELECT m.message_id, m.content, e.embedding <=> $1 AS distance
   FROM vector_schema.embeddings e
   JOIN messaging_schema.message_envelopes m ON m.message_id = e.source_id
   WHERE e.source_type = 'message'
     AND m.room_id = $2                    -- filter by room
     AND m.created_at > NOW() - INTERVAL '7 days'  -- filter by time
     AND m.sender_kind = 'human'           -- filter by sender kind
   ORDER BY e.embedding <=> $1
   LIMIT 20;
   ```

   With a separate vector database, this would require:
   1. Query the vector DB for the top-100 results by similarity.
   2. Filter the results by relational criteria in the application layer (or make a second query to PostgreSQL).
   3. Re-rank and take the top-20.

   This "fetch then filter" pattern is both slower and less accurate (relevant results may be filtered out if they weren't in the initial top-100).

5. **Cost efficiency.** PostgreSQL + pgvector is free and self-hosted. Pinecone charges per vector and per query at scale. For KALEN's projected workload, the cost difference is significant:

   - pgvector: $0 (included with PostgreSQL, runs on existing infrastructure).
   - Pinecone: ~$70-300/month for a pod supporting 1M vectors with ~10 QPS.
   - Weaviate: Self-hosted is free, but adds operational complexity; managed is ~$25-100/month.

6. **Maturity and community.** PostgreSQL is the most mature open-source relational database (30+ years). pgvector is the most popular PostgreSQL extension for vector search (15K+ GitHub stars). The combination is well-documented and widely deployed in production.

### Consequences

**Positive:**

- Single database system to operate, monitor, and backup.
- Transactional consistency between relational data and vector embeddings.
- Composable queries combining vector similarity with relational filters.
- Sufficient performance for KALEN's projected scale.
- Cost-efficient (no separate vector database licensing or hosting).
- pgvector's HNSW index provides production-grade ANN search.

**Negative:**

- **pgvector's ANN search is not state-of-the-art.** For extremely large-scale vector search (100M+ vectors, sub-10ms latency), dedicated systems like Milvus or Qdrant outperform pgvector. If KALEN reaches this scale, a migration to a dedicated vector database may be necessary. However, this is a future problem — KALEN should not over-engineer for scale it hasn't reached.
- **Index build time.** HNSW index builds are slower than IVFFlat for large datasets. For KALEN's scale, this is manageable (minutes, not hours). For 100M+ vectors, index builds could take hours and would need to be planned during maintenance windows.
- **Memory requirements.** HNSW indexes are loaded into PostgreSQL's shared_buffers for optimal performance. For large vector datasets, this can require significant RAM (e.g., 1M vectors at 1536 dimensions = ~6 GB of index data). KALEN must provision PostgreSQL instances with sufficient memory.
- **No built-in embedding generation.** pgvector stores and searches vectors, but it does not generate them. KALEN must call an embedding API (e.g., OpenAI's `text-embedding-3-small`) and store the result. This is the expected pattern — embedding generation is a separate concern from vector storage.

**Rejected alternatives:**

- **PostgreSQL + separate vector DB:** Rejected because the operational cost of running two database systems outweighs the performance benefit for KALEN's scale. The dual-write pattern for embedding insertion also introduces consistency risks.
- **MongoDB + Atlas Vector Search:** Rejected because MongoDB does not provide the same level of ACID transaction support and relational query capabilities as PostgreSQL for KALEN's identity, messaging, and task data. Additionally, Atlas Vector Search is a managed service, conflicting with KALEN's self-hosting requirement.
- **MySQL + separate vector DB:** Rejected because MySQL's JSON support and extension ecosystem are less mature than PostgreSQL's. pgvector has no MySQL equivalent.
- **SQLite + separate vector DB:** Rejected because SQLite does not support concurrent writes, which is required for KALEN's multi-service architecture. SQLite is appropriate for embedded or single-process applications, not for a microservice backend.

---

## ADR-008: NATS JetStream for Event Backbone

### Status

**Accepted** — 2026-06-08

### Context

KALEN needs an event backbone that connects its services asynchronously. The requirements are:

- **At-least-once delivery** — Events must not be lost if a consumer is temporarily unavailable.
- **Event replay** — Consumers must be able to replay events from a point in time (for recovery, reindexing, debugging).
- **Pub/sub with subject hierarchy** — Events should be organized by domain (e.g., `kalen.msg.*`, `kalen.a2a.*`) with wildcard subscriptions.
- **Low latency** — Event delivery should add minimal overhead (< 5ms) to the critical path.
- **Lightweight operation** — The event system should be easy to deploy, configure, and monitor.
- **Self-hostable** — No dependency on a managed streaming service (AWS Kinesis, Confluent Cloud).
- **Horizontal scalability** — The event system must scale as KALEN's event volume grows.

The options considered were:

1. **NATS JetStream** — Persistent streaming layer built into NATS.
2. **Apache Kafka** — Industry-standard distributed event streaming platform.
3. **RabbitMQ** — Message broker with pub/sub and queue patterns.
4. **Redis Streams** — Lightweight streaming built into Redis.
5. **Apache Pulsar** — Distributed pub/sub messaging system with built-in multi-tenancy.

### Decision

We choose **NATS JetStream** as the event backbone for KALEN.

### Rationale

1. **Simplicity of deployment and operation.** NATS is a single binary with no external dependencies (no ZooKeeper, no JVM, no external coordination service). A production NATS cluster is three instances of the same binary with a configuration file.

   Compare with Kafka:
   - Kafka requires ZooKeeper (or KRaft, which is still maturing).
   - Kafka requires JVM tuning (heap size, GC, broker configuration).
   - Kafka has 50+ configuration parameters per broker.
   - Kafka's operational complexity is well-documented and significant.

   For KALEN's team size (small, initially), NATS's operational simplicity is a decisive advantage.

2. **JetStream provides Kafka-equivalent guarantees.** NATS JetStream provides:

   | Feature | NATS JetStream | Apache Kafka |
   |---------|---------------|-------------|
   | At-least-once delivery | ✓ | ✓ |
   | Exactly-once semantics | ✓ (via dedup window) | ✓ (via idempotent producer + transactions) |
   | Event replay | ✓ | ✓ |
   | Subject-based routing | ✓ (native) | ✓ (via topic partitions) |
   | Consumer groups | ✓ (durable consumers) | ✓ (consumer groups) |
   | Retention policies | ✓ (time, size, interest) | ✓ (time, size) |
   | Wildcard subscriptions | ✓ (native `*` and `>` wildcards) | ✗ (no wildcard support) |

   The wildcard subscription capability is particularly valuable for KALEN. A monitoring consumer can subscribe to `kalen.>` to receive all events, or to `kalen.mcp.*` to receive only MCP events. Kafka does not support wildcard topic subscriptions — each topic must be explicitly listed.

3. **Low latency.** NATS is designed for sub-millisecond message delivery. Benchmarks consistently show:

   - NATS core: ~100μs latency at 10M messages/second.
   - NATS JetStream: ~1ms latency at 1M messages/second (with persistence).
   - Kafka: ~5-10ms latency at 1M messages/second (with replication factor 3).

   For KALEN's use case (event notification, async indexing, audit logging), sub-millisecond latency is not strictly necessary, but lower latency means less overall system delay.

4. **Lightweight footprint.** A NATS JetStream instance uses:

   - ~50 MB RAM (vs. ~2-6 GB for Kafka with JVM).
   - Single binary, ~15 MB (vs. Kafka's ~70 MB plus JVM).
   - No JVM, no GC tuning, no heap size configuration.

   This matters for development environments (Docker Compose) where resource usage should be minimal.

5. **Go-native.** NATS is written in Go. The official Go client (`github.com/nats-io/nats.go`) is first-class and well-maintained. This aligns with KALEN's backend language choice (ADR-006).

6. **Subject hierarchy aligns with KALEN's domain model.** KALEN's event naming convention maps naturally to NATS subjects:

   ```
   kalen.msg.created         → Message created
   kalen.msg.updated         → Message updated
   kalen.identity.created    → Identity created
   kalen.mcp.tool_invoked    → MCP tool invoked
   kalen.a2a.task_completed  → A2A task completed
   kalen.audit.*             → All audit events
   ```

   Consumers can subscribe at any level of granularity:
   - `kalen.msg.created` — specific event
   - `kalen.msg.*` — all message events
   - `kalen.>` — all KALEN events
   - `>` — everything (debugging only)

7. **Built-in monitoring.** NATS provides a monitoring endpoint (`/streamz`, `/consumerz`) that exposes stream and consumer metrics. This integrates naturally with Prometheus scraping.

### Consequences

**Positive:**

- Simple deployment and operation (single binary, no JVM, no ZooKeeper).
- Kafka-equivalent delivery guarantees with lower latency.
- Native wildcard subscriptions align with KALEN's domain model.
- Low resource footprint — ideal for development and small production deployments.
- Go-native client aligns with KALEN's backend language.
- Built-in monitoring endpoints.

**Negative:**

- **Smaller ecosystem than Kafka.** Kafka has a much larger ecosystem of connectors (Kafka Connect), stream processing frameworks (Kafka Streams, Flink), and management tools (Confluent Control Center). NATS has a smaller but growing ecosystem. For KALEN's use case (internal event backbone, not a data lake), the ecosystem gap is not significant.
- **No exactly-once in the distributed sense.** NATS JetStream provides at-least-once delivery and supports deduplication within a time window. It does not provide Kafka's exactly-once semantics (idempotent producer + transactional consumer). For KALEN's use case (events are idempotent or consumers are idempotent), at-least-once with deduplication is sufficient.
- **Less battle-tested at extreme scale.** Kafka is deployed at petabyte scale at LinkedIn, Netflix, and Uber. NATS JetStream is used at large scale (Cloudflare, Siemens, Comcast) but has fewer public case studies at the petabyte level. KALEN's projected event volume (millions, not billions, of events per day) is well within NATS JetStream's proven capacity.
- **No schema registry.** Kafka has Confluent Schema Registry for enforcing message schemas. NATS does not have an equivalent. KALEN will handle schema validation at the service level (using Protobuf definitions as the schema contract), not at the event backbone level. This is acceptable because KALEN controls both producers and consumers.

**Rejected alternatives:**

- **Apache Kafka:** Rejected because of operational complexity (JVM, ZooKeeper/KRaft, broker configuration) that is disproportionate to KALEN's needs. Kafka is the right choice for organizations with dedicated infrastructure teams and petabyte-scale streaming, but KALEN does not have those requirements.
- **RabbitMQ:** Rejected because it is primarily a message broker (work queues, routing) rather than an event streaming platform (event replay, persistent streams). RabbitMQ's streaming plugin exists but is less mature than JetStream or Kafka. Additionally, RabbitMQ is written in Erlang, which adds operational complexity for a Go-centric team.
- **Redis Streams:** Rejected because it lacks consumer group support on par with NATS/Kafka, has limited retention policies, and is not designed for long-term event storage. Redis Streams is suitable for short-lived queues, not durable event streams. KALEN already uses Redis for caching (ADR-007) and does not want to overload it with streaming responsibilities.
- **Apache Pulsar:** Rejected because it has similar operational complexity to Kafka (requires ZooKeeper, BookKeeper, JVM) with a smaller community and fewer production deployments. Pulsar's multi-tenancy feature is valuable for SaaS platforms but is not needed for KALEN's single-tenant deployment model.

---

## ADR-009: Ed25519 Keypairs for Agent Authentication

### Status

**Accepted** — 2026-06-08

### Context

KALEN agents need an authentication mechanism that is:

- **Programmatic** — Agents are software, not humans. They cannot tap a security key or respond to a browser prompt.
- **Cryptographic** — Authentication must be based on proof of possession, not shared secrets.
- **Lightweight** — Agent authentication happens on every API call (unlike human auth, which happens once per session). The signing and verification overhead must be minimal.
- **Key rotation friendly** — Agent keys must be rotatable without service disruption.
- **Standard** — Use a well-known algorithm with broad library support.

The options considered were:

1. **Ed25519** — Twisted Edwards Curve Digital Signature Algorithm (EdDSA) using Curve25519.
2. **ECDSA P-256** — Elliptic Curve Digital Signature Algorithm using the NIST P-256 curve.
3. **RSA-2048** — RSA signature algorithm with 2048-bit keys.
4. **HMAC-SHA256** — Symmetric key authentication (shared secret between agent and server).
5. **mTLS** — Mutual TLS with client certificates.

### Decision

We choose **Ed25519** as the signature algorithm for agent authentication.

### Rationale

1. **Performance.** Ed25519 is significantly faster than ECDSA and RSA for both signing and verification:

   | Algorithm | Sign ops/sec | Verify ops/sec | Key size | Signature size |
   |-----------|-------------|---------------|----------|---------------|
   | Ed25519 | ~70,000 | ~25,000 | 32 bytes | 64 bytes |
   | ECDSA P-256 | ~25,000 | ~10,000 | 32 bytes | 64 bytes |
   | RSA-2048 | ~500 | ~25,000 | 256 bytes | 256 bytes |
   | HMAC-SHA256 | N/A (symmetric) | N/A | 32 bytes | 32 bytes |

   For KALEN's use case, where every API call requires a signature verification, Ed25519's verification throughput is important. At 25K verifications/second, a single core can handle ~2 billion API calls per day — more than sufficient.

2. **Security properties.** Ed25519 has several security advantages over ECDSA P-256:

   - **Deterministic signatures.** Ed25519 produces deterministic signatures (no random nonce). ECDSA requires a random nonce per signature, and nonce reuse or bias has led to catastrophic private key recovery attacks (e.g., the PlayStation 3 hack, the Bitcoin nonce reuse attacks). Ed25519 eliminates this class of vulnerability entirely.
   - **Side-channel resistance.** Ed25519's verification formula is designed to be side-channel resistant. ECDSA's scalar multiplication is more susceptible to timing attacks.
   - **No NIST dependency.** Ed25519 uses Curve25519, which was designed by Daniel Bernstein independently of NIST. NIST curves (P-256) have been subject to speculation about potential backdoors (no evidence, but the perception exists). Curve25519's design process is fully transparent.

3. **Compact keys and signatures.** Ed25519 keys are 32 bytes and signatures are 64 bytes. This minimizes:
   - Storage in the `agent_identities` table.
   - Network overhead in authentication requests.
   - JWT payload size (the public key thumbprint is included in the JWT header).

4. **Broad library support.** Ed25519 is supported by every major cryptographic library:

   - Go: `crypto/ed25519` (standard library).
   - TypeScript: `@noble/ed25519`, `tweetnacl`.
   - Python: `cryptography`, `PyNaCl`.
   - Rust: `ed25519-dalek`.
   - Java: `Bouncy Castle`.

5. **Alignment with A2A.** The A2A protocol specification recommends Ed25519 for agent authentication. By using Ed25519, KALEN agents are compatible with A2A's authentication model without a key format translation layer.

6. **Not HMAC.** HMAC-SHA256 was considered for its simplicity and performance. However, HMAC requires a shared secret between the agent and the Identity Service. This means:

   - The Identity Service must store a copy of every agent's secret.
   - If the Identity Service's database is compromised, all agent secrets are exposed.
   - Key rotation requires coordination between the agent and the Identity Service (both must update simultaneously).

   Ed25519 avoids these issues because the Identity Service only stores public keys. A database compromise reveals no signing capability.

### Consequences

**Positive:**

- Fast signing and verification — minimal overhead per API call.
- Deterministic signatures — no nonce-related vulnerabilities.
- Compact keys (32 bytes) and signatures (64 bytes).
- No shared secrets — server stores only public keys.
- Broad library support across all KALEN languages.
- Alignment with A2A protocol recommendations.

**Negative:**

- **Not FIPS 140-2 approved.** Ed25519 is not included in NIST FIPS 140-2, which some regulated industries (government, healthcare, finance) require for cryptographic operations. If KALEN is deployed in a FIPS-regulated environment, ECDSA P-256 would be the required alternative. KALEN's `key_algorithm` field in `agent_identities` supports algorithm agility — the system can be extended to support ECDSA P-256 in the future without architecture changes.
- **No hardware security module (HSM) support.** Ed25519 is less widely supported by HSMs than RSA and ECDSA. If agents need to store their private keys in HSMs (e.g., for compliance), ECDSA P-256 or RSA may be required. For KALEN's use case (software agents running in containers), HSM support is not a current requirement.
- **Quantum vulnerability.** Like all elliptic curve and RSA algorithms, Ed25519 is vulnerable to quantum computing attacks (Shor's algorithm). Post-quantum alternatives (e.g., CRYSTALS-Dilithium) are being standardized. KALEN's `key_algorithm` field allows migration to post-quantum algorithms when they are production-ready.

**Rejected alternatives:**

- **ECDSA P-256:** Rejected because of nonce-related vulnerabilities (deterministic ECDSA exists but is less widely implemented), NIST curve concerns, and slower performance compared to Ed25519.
- **RSA-2048:** Rejected because of large key and signature sizes, slow signing (500 ops/sec), and the fact that RSA is increasingly deprecated in favor of elliptic curve algorithms.
- **HMAC-SHA256:** Rejected because it requires shared secrets, which create a single point of compromise and complicate key rotation.
- **mTLS:** Rejected because mTLS operates at the transport layer (TLS handshake), not the application layer. It cannot carry KALEN-specific claims (identity_id, suffix, roles) and requires X.509 certificate management ( issuance, renewal, revocation) which is operationally heavy. mTLS may be used for service-to-service TLS within the K8s cluster, but not for agent authentication.

---

## ADR-010: Dual Authentication Convergence on JWT

### Status

**Accepted** — 2026-06-08

### Context

KALEN has two authentication mechanisms:

1. **WebAuthn** for humans (ADR-003).
2. **Ed25519 keypairs** for agents (ADR-009).

After authentication, the Identity Service issues a credential that downstream services (Messaging, MCP Gateway, A2A Router) use to authorize requests. This credential must:

- Encode the identity (who), the kind (human or agent), and the permissions (roles).
- Be verifiable by any service without calling back to the Identity Service (stateless verification).
- Support expiration and revocation.
- Be compact enough to include in HTTP headers and WebSocket handshake parameters.

The options considered were:

1. **JWT (JSON Web Token)** — Industry-standard, stateless, signed token.
2. **Opaque token + introspection** — Random token stored in Redis; services call Identity Service to validate.
3. **Paseto (Platform-Agnostic Security Tokens)** — Improved token format with stronger security guarantees.
4. **Macaroons** —bearer credentials with caveats (delegation, attenuation).

### Decision

We choose **JWT** as the unified credential format for both human and agent authentication.

### Rationale

1. **Stateless verification.** JWTs are signed by the Identity Service using a private key. Any service with the corresponding public key can verify a JWT without calling the Identity Service. This means:

   - No network call per request for token verification.
   - No Identity Service availability dependency for request authorization.
   - Sub-microsecond verification time (cryptographic signature check).

   Opaque tokens require a Redis lookup or an Identity Service API call on every request, adding latency and a dependency.

2. **Standard claims for KALEN's needs.** JWT's registered claims cover most of KALEN's needs:

   | Claim | KALEN Usage |
   |-------|------------|
   | `sub` | Identity ID (UUID) |
   | `iat` | Token issued-at timestamp |
   | `exp` | Token expiration (15 minutes for access tokens) |
   | `jti` | Token ID for revocation checking |

   KALEN adds custom claims for domain-specific data:

   | Custom Claim | Type | Description |
   |-------------|------|-------------|
   | `kind` | `human` \| `agent` | Identity type — critical for authorization decisions |
   | `suffix` | string | Full suffix (e.g., `@codebot.agent#7b2c`) |
   | `roles` | string[] | RBAC roles |

3. **Kind claim enforcement.** The `kind` claim is the most important custom claim. It allows downstream services and the API gateway to enforce the human-agent boundary:

   - Agents (`kind: "agent"`) cannot access human-only endpoints (e.g., WebAuthn registration).
   - Humans (`kind: "human"`) cannot access agent-only endpoints (e.g., A2A task worker acceptance).
   - The API gateway rejects requests where the `kind` claim doesn't match the endpoint's required kind.

   This enforcement happens at the gateway level, before the request reaches any service. It is a defense-in-depth measure — even if a service has a bug that doesn't check `kind`, the gateway blocks the request.

4. **Revocation support.** JWTs are stateless, which makes revocation challenging. KALEN handles this with a **JWT blacklist** stored in Redis:

   - When an identity is deactivated, its JWT's `jti` is added to the blacklist.
   - When a token is explicitly revoked (e.g., user logs out), its `jti` is added to the blacklist.
   - The blacklist is checked by the API gateway on every request (a Redis GET is ~0.1ms).
   - Blacklist entries have a TTL equal to the JWT's remaining lifetime — they auto-expire when the JWT would have expired anyway.

   This hybrid approach (stateless JWT + stateful blacklist) provides the best of both worlds: sub-millisecond verification for the common case (99.99% of tokens are not revoked) with immediate revocation capability.

5. **Ecosystem support.** JWT is supported by every web framework, API gateway, and identity library:

   - Go: `golang-jwt/jwt`, `go-jose/go-jose`.
   - TypeScript: `jose`, `jsonwebtoken`.
   - Kong/Envoy: Native JWT plugin.
   - OpenIM: JWT-based auth hook.

   This means KALEN can use off-the-shelf middleware for JWT verification instead of implementing it from scratch.

6. **Refresh token flow.** KALEN uses short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days). The refresh token is an opaque string stored in Redis and the Identity Service's database. Refresh token rotation is enforced — each refresh generates a new refresh token, and the old one is invalidated.

### Consequences

**Positive:**

- Stateless verification — no Identity Service call per request.
- Sub-millisecond verification latency.
- Standard format with broad ecosystem support.
- Custom claims carry KALEN-specific data (`kind`, `suffix`, `roles`).
- `kind` claim enables defense-in-depth at the API gateway.
- Revocation via Redis blacklist with automatic TTL expiration.
- Refresh token flow with rotation for long-lived sessions.

**Negative:**

- **JWT size.** A KALEN JWT with all claims is approximately 500-800 bytes (Base64URL-encoded). This is larger than an opaque token (32-64 bytes) but still fits comfortably in HTTP headers (most servers accept headers up to 8 KB).
- **Revocation is not instant.** There is a theoretical window between token revocation (adding `jti` to the Redis blacklist) and the API gateway checking the blacklist. In practice, this window is sub-millisecond (Redis replication is near-instant within a data center). For KALEN's threat model, this is acceptable.
- **No encryption.** JWTs are signed but not encrypted. Anyone with the token can read its claims. This is by design — JWT is a bearer token, and encryption would not add security (the bearer can decode it anyway). Sensitive data must not be put in JWT claims; it should be fetched from the service on demand.
- **Algorithm confusion attacks.** JWT's `alg` header can be manipulated to exploit algorithm confusion (e.g., switching from RS256 to none). KALEN mitigates this by:
  - Using Ed25519 (EdDSA) for JWT signing, which has no algorithm confusion vector with RSA or HMAC.
  - Hardcoding the expected algorithm in the verification code — the `alg` header is ignored.
  - Using the `go-jose` library, which does not allow algorithm downgrade.

**Rejected alternatives:**

- **Opaque token + introspection:** Rejected because it requires a network call (Redis or Identity Service) on every request, adding latency and a dependency. It also does not carry claims — services must fetch identity data separately.
- **Paseto:** Rejected because it has significantly less ecosystem support than JWT. While Paseto's security design is arguably better (no algorithm confusion, built-in versioning), the practical difference is minimal when JWT is implemented correctly (hardcoded algorithm, no `none` algorithm). The ecosystem gap (fewer libraries, less gateway support, less developer familiarity) outweighs the marginal security benefit.
- **Macaroons:** Rejected because they are a powerful but niche technology with very limited ecosystem support. Macaroons' primary advantage (delegation and attenuation via caveats) is useful for distributed systems with complex authorization chains, but KALEN's RBAC model does not require delegation at the token level — delegation is handled by the A2A Router at the application level.

---

## Appendix: ADR Summary Table

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Monorepo Structure | Accepted | 2026-06-08 |
| ADR-002 | OpenIM over Matrix Synapse for Messaging | Accepted | 2026-06-08 |
| ADR-003 | WebAuthn over OAuth2 for Human Authentication | Accepted | 2026-06-08 |
| ADR-004 | MCP for Tool Integration | Accepted | 2026-06-08 |
| ADR-005 | A2A for Agent Coordination | Accepted | 2026-06-08 |
| ADR-006 | Go for Backend, TypeScript for Frontend | Accepted | 2026-06-08 |
| ADR-007 | PostgreSQL + pgvector for Data | Accepted | 2026-06-08 |
| ADR-008 | NATS JetStream for Events | Accepted | 2026-06-08 |
| ADR-009 | Ed25519 Keypairs for Agent Auth | Accepted | 2026-06-08 |
| ADR-010 | Dual Authentication Convergence on JWT | Accepted | 2026-06-08 |

---

*Document maintained by Mulky Malikul Dhaher (mulkymalikuldhr@mail.com). Last updated: 2026-06-08.*
