# KALEN Security Policy

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)
**Last Updated:** 2026-06-10

> **Honesty notice:** KALEN is pre-alpha software. Core cryptographic operations (Ed25519, JWT, RBAC) are now implemented and tested, but the system is not yet production-ready. Many security features remain as stubs. See the "Current Security Status" section for what actually exists today.

---

## Current Security Status

**As of 2026-06-10, KALEN has implemented core cryptographic operations but is not yet a secure production system.** The following are facts, not aspirations:

| Item | Status | Notes |
|------|--------|-------|
| Ed25519 agent authentication | ✅ Implemented | Real Ed25519 via @noble/ed25519 — sign, verify, fromPrivateKey all functional |
| A2A agent card signing/verification | ✅ Implemented | Uses @kalen/identity Ed25519Signer — real cryptographic signatures |
| JWT token issuance and validation | ✅ Implemented | Human and agent tokens with entity type embedding, refresh support |
| RBAC with deny-first policy engine | ✅ Implemented | Role/Permission enums, checkPermission, evaluateAccess, checkScope |
| WebAuthn helper functions | ✅ Implemented | generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse |
| Agent (ai) suffix enforcement | ✅ Implemented | validateAgentName enforces suffix; checkSuffixEnforcement in verification |
| MCP tool allowlists | ✅ Implemented | AllowList with permissive/restrictive modes, global deny list |
| MCP tool output sanitization | ❌ Not implemented | Tool outputs not yet sanitized for prompt injection |
| Audit logging | ⚠️ In-memory only | Audit events logged but stored in-memory, not PostgreSQL |
| Challenge store | ⚠️ In-memory only | InMemoryChallengeStore — needs Redis backing |
| Rate limiting | ⚠️ In-memory only | In-memory per-IP rate limiting — needs Redis for production |
| TLS termination at Traefik | ⚠️ Config exists but not verified in production |
| Data encryption at rest | ❌ Not implemented | |
| OAuth 2.1 / PKCE for A2A | ❌ Not implemented | |
| mTLS for inter-service | ❌ Not implemented | |
| End-to-end encryption | ❌ Not implemented | |

**Do not deploy KALEN in any environment where security matters.** While core cryptographic primitives are real and tested, the system lacks production-grade persistence, rate limiting, and external service integration.

---

## Supported Versions

| Version | Supported | Notes |
| ------- | --------- | ----- |
| 0.2.0-alpha.1 | ⚠️ Best effort | Core crypto implemented; persistence and integration are stubs |
| 0.1.0-alpha.1 | ❌ No | Pre-alpha scaffold — fake crypto (simpleHash) |
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

## Security Architecture (Planned + Implemented)

The following describes the security architecture. Items marked ✅ are implemented and tested; items marked ⚠️ are partially implemented; items marked ❌ are not yet implemented.

### 1. Dual-Identity Model

KALEN's security model is built on the principle that humans and agents are fundamentally different entities with different authentication mechanisms:

#### Human Identity (WebAuthn / FIDO2)

| Property | Value | Status |
|----------|-------|--------|
| Authentication | WebAuthn passkeys (biometric + device-bound) | ✅ Helper functions implemented |
| Credential storage | Public key + credential ID + counter + transports only | ⚠️ In-memory in server; TypeORM entity defined |
| Private key location | Never leaves the authenticator device | ✅ By design |
| Session token | JWT, 15 min access / 7 day refresh | ✅ Implemented |
| Recovery | 24-word BIP39 phrase, rate-limited to 3 attempts per 24h | ❌ Not implemented |
| Phishing resistance | Cryptographic binding to Relying Party origin | ✅ By design (WebAuthn spec) |

**Why no passwords?** Passwords are the #1 attack vector (credential stuffing, phishing, reuse). WebAuthn eliminates this entire class of attacks by replacing shared secrets with public-key cryptography.

#### Agent Identity (Ed25519 Keypair)

| Property | Value | Status |
|----------|-------|--------|
| Authentication | Ed25519 signature over timestamped challenge | ✅ **Real Ed25519** via @noble/ed25519 |
| Credential storage | Public key + manifest in PostgreSQL | ⚠️ TypeORM entity defined; in-memory in services |
| Private key location | Encrypted at rest in agent runtime; never transmitted | ✅ By design |
| Session token | JWT, 24h TTL, entity type embedded | ✅ Implemented |
| Mandatory suffix | Display name must end with `(ai)` — enforced at application level | ✅ Implemented and tested |
| Scope | Manifest-defined capabilities + RBAC permissions | ✅ Implemented (manifest + RBAC) |

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
- Access token: 15 minutes (humans), 24 hours (agents) — ✅ Implemented
- Refresh token: 7 days (humans only; agents re-authenticate with keypair) — ✅ Implemented
- Token revocation: ⚠️ In-memory deny-list only (needs Redis)
- Entity type in JWT enables server-side enforcement — ✅ Implemented

### 3. MCP Gateway Security

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **Authentication** | Agent JWT validation | ✅ Implemented |
| **Authorization** | Per-agent tool allowlist | ✅ Implemented (AllowList with permissive/restrictive modes) |
| **Scope validation** | Capability validator | ⚠️ RBAC check exists; capability-validator not separate |
| **Rate limiting** | In-memory, per-agent per-tool | ⚠️ In-memory only (needs Redis) |
| **Output sanitization** | Prompt injection detection | ❌ Not implemented |
| **Audit logging** | In-memory audit events | ⚠️ Events logged but not persisted |
| **Caching** | Not yet implemented | ❌ Not implemented |

### 4. A2A Router Security

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **Agent Card signing** | Ed25519 signature on Agent Card | ✅ **Real Ed25519** via @kalen/identity |
| **Card verification** | Signature check against registered public key | ✅ **Real Ed25519** verification |
| **Task authorization** | Requester permission check | ✅ Implemented |
| **OAuth 2.1 + PKCE** | For inter-deployment A2A | ❌ Not implemented |
| **mTLS** | Enterprise deployment option | ❌ Not implemented |
| **Rate limiting** | Per-agent on A2A endpoints | ⚠️ In-memory only |

### 5. Audit Trail

| Property | Status |
|----------|--------|
| Append-only, no DELETE/UPDATE | ⚠️ By design, but only in-memory currently |
| Signed entries (Ed25519) | ❌ Not yet implemented |
| Searchable | ❌ Not yet implemented (needs PostgreSQL) |
| 7-year retention | ❌ Not yet implemented |

### 6. Transport Security

| Layer | Status |
|-------|--------|
| TLS termination at Traefik | ⚠️ Config exists but not verified in production |
| WebRTC media (DTLS-SRTP) | ❌ Not implemented (no LiveKit integration) |
| WebSocket (WSS) | ⚠️ Config exists, not verified |
| Internal service communication | ⚠️ Docker network isolation only |

### 7. Data Security

| Data Type | Protection | Status |
|-----------|-----------|--------|
| WebAuthn public keys | PostgreSQL (entity defined, in-memory currently) | ⚠️ |
| Agent private keys | Should be encrypted at rest | ❌ |
| JWT secrets | Server-side environment variables | ✅ By design |
| User messages | PostgreSQL (entity defined, in-memory currently) | ⚠️ |
| Files | MinIO via presigned URLs | ❌ Not implemented |
| Audit logs | PostgreSQL append-only (entity defined, in-memory) | ⚠️ |
| Session state | Redis (needs wiring) | ❌ |

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

- **Use well-audited libraries** — `@simplewebauthn/server` for WebAuthn, `@noble/ed25519` for Ed25519
- **Never implement custom crypto** — do not write your own encryption, hashing, or signing
- **Use constant-time comparison** — for signature verification and token comparison
- **Use secure random** — `crypto.randomBytes()` for challenges, tokens, and salts

---

## Security Roadmap

| Phase | Security Feature | Status |
|-------|-----------------|--------|
| Phase 0 | ~~Ed25519 agent keypair~~ (was fake) | ✅ Fixed — now real @noble/ed25519 |
| Phase 1 | Ed25519 agent keypair and JWT | ✅ Implemented |
| Phase 1 | WebAuthn registration and authentication | ✅ Helper functions implemented |
| Phase 1 | `(ai)` suffix enforcement | ✅ Implemented |
| Phase 1 | RBAC deny-first policy engine | ✅ Implemented |
| Phase 1 | Audit logging (identity events) | ⚠️ In-memory only |
| Phase 1 | Wire challenge store to Redis | ❌ Not implemented |
| Phase 2 | MCP tool allowlists | ✅ Implemented |
| Phase 2 | MCP output sanitization | ❌ Not implemented |
| Phase 2 | Rate limiting (Redis-backed API endpoints) | ❌ Not implemented (in-memory) |
| Phase 2 | Account recovery (BIP39) | ❌ Not implemented |
| Phase 3 | A2A agent card signing/verification | ✅ Implemented |
| Phase 3 | OAuth 2.1 with PKCE | ❌ Not implemented |
| Phase 3 | SSE streaming security | ❌ Not implemented |
| Phase 4 | mTLS for enterprise deployment | ❌ Not implemented |
| Phase 4 | End-to-end encryption (Matrix bridge) | ❌ Not implemented |
| Phase 5 | Penetration testing | ❌ Not implemented |
| Phase 5 | Security audit (external) | ❌ Not implemented |
| Phase 7 | SOC 2 Type I compliance roadmap | ❌ Not implemented |

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
