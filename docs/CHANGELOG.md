# Changelog

All notable changes to KALEN will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0-alpha.1]: https://github.com/mulkymalikuldhr/kalen/releases/tag/v0.1.0-alpha.1
