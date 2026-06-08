# KALEN Security Policy

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)
**Last Updated:** 2026-06-09

> **Honesty notice:** KALEN is pre-alpha software. None of the security features described in this document are implemented yet. This policy describes our security goals and architecture, not current capabilities. See the "Current Security Status" section for what actually exists today.

---

## Current Security Status

**As of 2026-06-09, KALEN has no implemented security features.** The following are facts, not aspirations:

| Item | Status |
|------|--------|
| WebAuthn authentication | ❌ Not implemented |
| Ed25519 agent authentication | ❌ Not implemented |
| JWT token issuance and validation | ❌ Not implemented |
| RBAC with deny-first policy engine | ❌ Not implemented |
| MCP tool allowlists | ❌ Not implemented |
| MCP output sanitization | ❌ Not implemented |
| A2A agent card signing | ❌ Not implemented |
| Audit logging | ❌ Not implemented |
| TLS termination at Traefik | ⚠️ Config exists but not verified in production |
| Rate limiting | ❌ Not implemented |
| Data encryption at rest | ❌ Not implemented |
| Docker Compose default passwords | ⚠️ Uses `kalen_dev` — development only |

**Do not deploy KALEN in any environment where security matters.** This is scaffolding code with infrastructure configs. There is no application to secure yet.

---

## Supported Versions

| Version | Supported | Notes |
| ------- | --------- | ----- |
| 0.1.0-alpha.1 | ❌ No | Pre-alpha scaffold — no security features |
| < 1.0.0 (any alpha/beta) | ⚠️ Best effort | Security patches applied, but no SLA |
| ≥ 1.0.0 | ✅ Yes | Full security support per this policy |

We will provide security patches for the latest stable release (≥1.0.0). Pre-release versions receive best-effort patches with no SLA guarantee.

---

## Reporting a Vulnerability

### Do NOT report security vulnerabilities through:

- Public GitHub issues
- Public discussions
- Social media
- Public chat channels

### DO report security vulnerabilities through:

**Preferred method — GitHub Security Advisories:**

1. Go to [github.com/mulkymalikuldhr/kalen/security/advisories/new](https://github.com/mulkymalikuldhr/kalen/security/advisories/new)
2. Fill in the vulnerability details
3. Submit as a private security advisory

**Alternative method — Email:**

Send an email to **mulkymalikuldhr@mail.com** with the subject line: `[KALEN Security] Brief description of the vulnerability`

If you have PGP, encrypt the email. (PGP key to be published when the project reaches beta.)

### What to include in your report

1. **Vulnerability type** — e.g., authentication bypass, injection, privilege escalation, data exposure
2. **Affected component** — which package, endpoint, or service
3. **Attack vector** — how the vulnerability can be exploited
4. **Impact** — what an attacker can achieve (data access, privilege escalation, DoS)
5. **Reproduction steps** — specific, numbered steps to reproduce the issue
6. **Proof of concept** — code, curl commands, or screenshots demonstrating the vulnerability
7. **Suggested fix** — if you have one (optional but appreciated)
8. **Your contact information** — for follow-up questions

### What we commit to

1. **Acknowledgment within 48 hours** — we will confirm receipt of your report
2. **Initial assessment within 7 days** — we will evaluate the severity and validity of the report
3. **Regular updates** — we will keep you informed of remediation progress (at minimum weekly)
4. **Coordinated disclosure** — we will not publicly disclose the vulnerability until a fix is available, or until 90 days have passed since your report (whichever comes first)
5. **Credit** — we will credit you in the security advisory and CHANGELOG unless you request anonymity

### What we ask of you

1. **Do not exploit** the vulnerability beyond what is necessary to demonstrate it
2. **Do not access** data that does not belong to you
3. **Do not degrade** system performance or availability
4. **Do not disclose** the vulnerability publicly until we have published a fix or the 90-day disclosure deadline has passed
5. **Provide reasonable time** for remediation before public disclosure

### Severity Classification

We use the [Common Vulnerability Scoring System (CVSS) v3.1](https://www.first.org/cvss/v3.1/specification-document) for severity assessment:

| Severity | CVSS Range | Response Time | Example |
|----------|-----------|---------------|---------|
| **Critical** | 9.0 – 10.0 | 24 hours to acknowledge, 7 days to patch | Remote code execution, authentication bypass |
| **High** | 7.0 – 8.9 | 48 hours to acknowledge, 14 days to patch | Privilege escalation, data exposure |
| **Medium** | 4.0 – 6.9 | 7 days to acknowledge, 30 days to patch | Stored XSS, CSRF |
| **Low** | 0.1 – 3.9 | 14 days to acknowledge, 90 days to patch | Information disclosure, minor misconfiguration |

---

## Security Architecture (Planned)

The following describes the security architecture that will be implemented as the project progresses. **None of this is currently running code.**

### 1. Dual-Identity Model

KALEN's security model is built on the principle that humans and agents are fundamentally different entities with different authentication mechanisms:

#### Human Identity (WebAuthn / FIDO2)

| Property | Value |
|----------|-------|
| Authentication | WebAuthn passkeys (biometric + device-bound) |
| Credential storage | Public key + credential ID + counter + transports only |
| Private key location | Never leaves the authenticator device |
| Session token | JWT, 15 min access / 7 day refresh |
| Recovery | 24-word BIP39 phrase, rate-limited to 3 attempts per 24h |
| Phishing resistance | Cryptographic binding to Relying Party origin |

**Why no passwords?** Passwords are the #1 attack vector (credential stuffing, phishing, reuse). WebAuthn eliminates this entire class of attacks by replacing shared secrets with public-key cryptography.

#### Agent Identity (Ed25519 Keypair)

| Property | Value |
|----------|-------|
| Authentication | Ed25519 signature over timestamped challenge |
| Credential storage | Public key + manifest in PostgreSQL |
| Private key location | Encrypted at rest in agent runtime; never transmitted |
| Session token | JWT, 24h TTL, entity type embedded |
| Mandatory suffix | Display name must end with `(ai)` — enforced at application level |
| Scope | Manifest-defined capabilities + RBAC permissions |

**Why `(ai)` suffix?** Without mandatory, enforced visual distinction, agents can impersonate humans. The suffix is a non-negotiable, application-enforced requirement that makes agent participation transparent in any context.

### 2. JWT Token Architecture

```
┌─────────────────────────────────────────────┐
│               JWT Claims                     │
├─────────────────────────────────────────────┤
│  sub:         "uuid" (identity ID)           │
│  entityType:  "human" | "agent"              │
│  suffix:      "@alice#a3f1" or "@bot.agent#7b2c" │
│  roles:       ["user"] or ["agent", "admin"] │
│  scope:       {} (for agents: manifest ref)  │
│  iat:         issued-at timestamp            │
│  exp:         expiration timestamp           │
│  iss:         "kalen"                         │
│  jti:         unique token ID                │
└─────────────────────────────────────────────┘
```

**Token lifecycle:**
- Access token: 15 minutes (humans), 24 hours (agents)
- Refresh token: 7 days (humans only; agents re-authenticate with keypair)
- Token revocation: supported via Redis deny-list
- Entity type in JWT enables server-side enforcement: an agent token cannot access human-only endpoints, and vice versa

### 3. MCP Gateway Security

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Authentication** | Agent JWT validation | Only authenticated agents can invoke tools |
| **Authorization** | Per-agent tool allowlist | Agents can only invoke tools they are scoped for |
| **Scope validation** | Capability validator | Tool calls checked against agent manifest |
| **Rate limiting** | Redis-backed, per-agent per-tool | Prevent tool abuse |
| **Output sanitization** | Prompt injection detection | Strip or redact tool outputs containing prompt injection patterns |
| **Audit logging** | NATS event → PostgreSQL | Every invocation logged with agent ID, tool, input hash, output hash, latency |
| **Caching** | Redis, idempotent results only | Reduce redundant tool calls |

### 4. A2A Router Security

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Agent Card signing** | Ed25519 signature on Agent Card | Verify card authenticity and integrity |
| **Card verification** | Signature check against registered public key | Reject tampered or forged cards |
| **Task authorization** | Requester permission check | Only authorized agents can delegate tasks |
| **OAuth 2.1 + PKCE** | For inter-deployment A2A | Secure authorization between KALEN instances |
| **mTLS** | Enterprise deployment option | Mutual TLS for agent-to-agent communication in controlled environments |
| **Rate limiting** | Per-agent on A2A endpoints | Prevent task flooding |

### 5. Audit Trail

Every significant security event is logged to an append-only, signed audit trail:

| Event Category | Examples |
|---------------|---------|
| Identity | Registration, authentication, key rotation, revocation |
| Agent | Creation, scope change, manifest update, key rotation |
| Access | Permission grant, permission deny, RBAC policy change |
| MCP | Tool invocation, allowlist change, rate limit hit |
| A2A | Task delegation, task completion, card verification failure |
| Admin | User ban, agent revocation, configuration change |

**Audit log properties:**
- **Append-only** — no DELETE or UPDATE operations permitted
- **Signed** — each entry signed with Ed25519 for tamper detection
- **Searchable** — by actor, action type, date range, entity type
- **Retained** — 7-year retention for compliance (configurable)

### 6. Transport Security

| Layer | Mechanism |
|-------|-----------|
| **TLS termination** | Traefik v3 handles TLS 1.3; internal services communicate over plain HTTP within Docker network |
| **WebRTC media** | DTLS-SRTP mandatory encryption for all audio/video |
| **WebSocket** | WSS via Traefik TLS termination |
| **Internal service communication** | Docker network isolation; no TLS between services (same host) |

### 7. Data Security

| Data Type | Protection |
|-----------|-----------|
| WebAuthn public keys | Stored in PostgreSQL; public keys only, no secrets |
| Agent private keys | Encrypted at rest (AES-256); decrypted in agent runtime memory only |
| JWT secrets | Server-side only, injected via environment variables |
| User messages | Stored in PostgreSQL (KALEN envelope) + MongoDB (OpenIM) |
| Files | Stored in MinIO; access via presigned URLs with TTL |
| Audit logs | PostgreSQL, append-only, signed |
| Session state | Redis, TTL-enforced |

---

## Security Best Practices for Developers

When contributing to KALEN, follow these security practices:

### Secrets Management

- **Never commit secrets** — passwords, API keys, tokens, private keys, .env files
- **Use .env for local development** — `.env` is gitignored by default
- **Use sealed secrets for Kubernetes** — never put plaintext secrets in manifests
- **Generate strong secrets** — use `openssl rand -base64 64 | tr -d '\n'` for JWT_SECRET and similar

### Input Validation

- **Validate all inputs** — use Zod schemas for request validation
- **Sanitize user content** — strip HTML, allow markdown only in message content
- **Parameterize queries** — use TypeORM query builder, never string concatenation
- **Validate entity types** — always check `entityType` from JWT before authorization decisions

### Agent Security

- **Always enforce `(ai)` suffix** — the `suffix-enforcer` module must be used in all agent creation paths
- **Always validate manifest scope** — never allow an agent to access a tool or room not in its manifest
- **Always sanitize MCP tool outputs** — prompt injection via tool output is a known attack vector
- **Always rate-limit agent actions** — agents are autonomous and can make requests faster than humans

### Cryptography

- **Use well-audited libraries** — `@simplewebauthn/server` for WebAuthn, `tweetnacl` for Ed25519
- **Never implement custom crypto** — do not write your own encryption, hashing, or signing
- **Use constant-time comparison** — for signature verification and token comparison
- **Use secure random** — `crypto.randomBytes()` for challenges, tokens, and salts

---

## Security Roadmap

| Phase | Security Feature | Status |
|-------|-----------------|--------|
| Phase 1 | WebAuthn registration and authentication | Planned |
| Phase 1 | Ed25519 agent keypair and JWT | Planned |
| Phase 1 | `(ai)` suffix enforcement | Planned |
| Phase 1 | RBAC deny-first policy engine | Planned |
| Phase 1 | Audit logging (identity events) | Planned |
| Phase 2 | MCP tool allowlists | Planned |
| Phase 2 | MCP output sanitization | Planned |
| Phase 2 | Rate limiting (API endpoints) | Planned |
| Phase 2 | Account recovery (BIP39) | Planned |
| Phase 3 | A2A agent card signing/verification | Planned |
| Phase 3 | OAuth 2.1 with PKCE | Planned |
| Phase 3 | SSE streaming security | Planned |
| Phase 4 | mTLS for enterprise deployment | Planned |
| Phase 4 | End-to-end encryption (Matrix bridge) | Planned |
| Phase 5 | Penetration testing | Planned |
| Phase 5 | Security audit (external) | Planned |
| Phase 7 | SOC 2 Type I compliance roadmap | Planned |

---

## Incident Response

When a security vulnerability is discovered in a released version:

1. **Triage** — Assess severity using CVSS v3.1 within 24 hours
2. **Patch** — Develop and test a fix within the SLA for the severity level
3. **Release** — Publish a patched release with a security advisory
4. **Notify** — Update CHANGELOG.md, publish GitHub Security Advisory, notify known deployers
5. **Post-mortem** — Document root cause, timeline, and prevention measures

For critical vulnerabilities (CVSS ≥ 9.0), we will:
- Patch and release within 7 days
- Publish a security advisory before the 90-day disclosure deadline
- Credit the reporter unless they request anonymity

---

## Contact

For security-related questions or concerns:

- **Security advisories:** [github.com/mulkymalikuldhr/kalen/security/advisories/new](https://github.com/mulkymalikuldhr/kalen/security/advisories/new)
- **Email:** mulkymalikuldhr@mail.com
- **General questions:** Open a GitHub issue with the `security` label (for non-sensitive questions only)
