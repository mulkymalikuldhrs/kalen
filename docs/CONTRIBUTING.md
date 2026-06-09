# Contributing to KALEN

First of all, thank you for considering a contribution to KALEN. This document describes how to contribute, what standards we follow, and what to expect during the review process.

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)

---

## Important: Project Status

KALEN is in **pre-alpha**. This means:

- **The architecture is being actively shaped.** A PR that introduces a fundamental change to package boundaries or the identity model may be rejected even if the code is correct, because it conflicts with an in-progress design.
- **Breaking changes happen.** We are not yet at a point where we guarantee API stability. If you build something on top of KALEN, expect breaking changes.
- **Documentation is ahead of code in some areas.** Many features described in `docs/PRD.md` and `docs/design.md` are specified but not implemented. Do not assume something works just because it is documented.
- **Core libraries are implemented and tested.** The `@kalen/shared`, `@kalen/identity`, `@kalen/mcp-gateway`, and `@kalen/a2a-router` packages have 379 passing tests. The NestJS server and Next.js web client exist but use in-memory stores and simulated data.

If this is acceptable to you, read on.

---

## Code of Conduct

We are committed to providing a welcoming and respectful experience for everyone. We expect all contributors to:

- Be respectful of differing viewpoints and experiences
- Use welcoming and inclusive language
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy toward other community members

Harassment, trolling, personal attacks, and exclusionary behavior are not tolerated. Report incidents to mulkymalikuldhr@mail.com.

---

## How to Contribute

### 1. Check Existing Issues

Before writing any code, check [existing issues](https://github.com/mulkymalikuldhr/kalen/issues) for:

- Issues labeled `good first issue` — suitable for new contributors
- Issues labeled `help wanted` — contributions we are actively seeking
- Duplicate or related issues that may affect your approach

### 2. Open an Issue First

For any feature or significant change, **open an issue before writing code.** This allows us to:

- Validate that the change aligns with the architecture
- Discuss the approach before you invest time in implementation
- Identify potential conflicts with in-progress work
- Ensure the change fits within the phased roadmap (see `docs/todo.md`)

Include in your issue:

- **What** you want to add or change
- **Why** it is needed (problem statement, not solution statement)
- **How** you plan to implement it (if you have a specific approach)
- **Which phase** of the roadmap it falls under

### 3. Fork and Branch

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/kalen.git
cd kalen

# Create a feature branch from develop
git checkout develop
git checkout -b feat/your-feature-name
```

**Branch naming conventions:**

| Prefix | Use For |
|--------|---------|
| `feat/` | New features (e.g., `feat/webauthn-registration`) |
| `fix/` | Bug fixes (e.g., `fix/jwt-expiry-check`) |
| `docs/` | Documentation changes (e.g., `docs/api-auth-endpoints`) |
| `refactor/` | Code refactoring (e.g., `refactor/extract-auth-module`) |
| `test/` | Adding or improving tests (e.g., `test/webauthn-integration`) |
| `chore/` | Tooling, CI, dependencies (e.g., `chore/update-eslint-config`) |

### 4. Write Code

Follow the code style guidelines below. Key principles:

- **TypeScript strict mode** — enabled across all packages; no `any` types without justification
- **No shortcuts** — do not leave TODO comments in production code; do not stub implementations
- **Tests required** — unit tests for new logic; integration tests for new endpoints
- **Documentation** — JSDoc on all public APIs; README updates if user-facing

### 5. Commit

We follow [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | Meaning |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no code change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling, dependencies |
| `perf` | Performance improvement |

**Examples:**

```
feat(identity): implement WebAuthn registration ceremony
fix(auth): correct JWT expiry validation for refresh tokens
docs(api): document POST /auth/register-begin endpoint
refactor(shared): extract entity helpers to separate module
test(identity): add integration tests for suffix enforcement
chore(deps): update TypeScript to 5.7.3
```

**Commitlint configuration** is in `commitlint.config.js` (or `package.json`). Pre-commit hooks enforce this automatically.

### 6. Open a Pull Request

When your code is ready:

1. Push your branch to your fork
2. Open a PR against the `develop` branch of `mulkymalikuldhr/kalen`
3. Fill out the PR template completely
4. Link to the issue your PR addresses
5. Ensure CI passes (lint, typecheck, test, build)

**PR template checklist:**

```markdown
## Description
[What does this PR do and why?]

## Related Issue
Closes #[issue number]

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] docs: Documentation
- [ ] refactor: Code refactoring
- [ ] test: Tests
- [ ] chore: Tooling/CI

## Checklist
- [ ] TypeScript strict mode — no `any` without justification
- [ ] Unit tests added/updated for new logic
- [ ] Integration tests added/updated for new endpoints
- [ ] JSDoc added on public APIs
- [ ] README/docs updated if user-facing
- [ ] Conventional commit messages used
- [ ] No secrets, credentials, or .env files committed
```

---

## Code Style

### TypeScript

- **Strict mode** is enabled. `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all `true`.
- **No `any`** — use `unknown` with type narrowing. If you must use `any`, add a `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment with a justification.
- **Prefer `interface` over `type`** for object shapes; use `type` for unions, intersections, and utility types.
- **Use `@kalen/*` path aliases** for internal package references, not relative paths that cross package boundaries.
- **ES modules** — use `import`/`export` syntax, not `require`/`module.exports`.
- **Naming:**
  - Files: `kebab-case.ts` (e.g., `agent-token.service.ts`)
  - Classes: `PascalCase` (e.g., `McpGatewayService`)
  - Functions: `camelCase` (e.g., `generateRegistrationOptions`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `AGENT_SUFFIX`)
  - Interfaces: `PascalCase` without `I` prefix (e.g., `AgentManifest`, not `IAgentManifest`)

### React / Next.js

- **Functional components only** — no class components
- **Hooks** — use custom hooks for reusable logic (`useAuth`, `useMessages`)
- **shadcn/ui components** — use existing components from `src/components/ui/` instead of building from scratch
- **Tailwind CSS** — utility classes only; no custom CSS unless absolutely necessary
- **Zustand** for client-side state; **TanStack Query** for server state

### NestJS

- **Module-based architecture** — one module per feature domain
- **Dependency injection** — use constructor injection, not property injection
- **DTOs** — define request/response DTOs with class-validator decorators
- **Guards** — use JWT guard for authentication, role guard for authorization
- **Interceptors** — use for cross-cutting concerns (logging, transform)

### Package Boundaries

KALEN's monorepo has strict dependency rules:

```
apps/web       → depends on packages/* (via @kalen/* aliases)
apps/server    → depends on packages/* (via @kalen/* aliases)
packages/shared   → no dependencies on other @kalen/* packages
packages/identity → depends on @kalen/shared
packages/mcp-gateway → depends on @kalen/shared, @kalen/identity
packages/a2a-router → depends on @kalen/shared, @kalen/identity
```

**Never** introduce a circular dependency between packages. If two packages need to share code, the shared code belongs in `packages/shared`.

---

## Development Setup

### Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Node.js | 20 LTS |
| pnpm | 9.15+ |
| Docker | 24+ |
| Docker Compose | v2+ |
| Git | 2.40+ |

### Setup Steps

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhr/kalen.git
cd kalen

# Run the one-command setup script
bash infra/scripts/setup-local.sh

# Or manually:
cp .env.example .env           # Copy environment template
pnpm install                   # Install dependencies
docker compose -f infra/docker/docker-compose.yml up -d  # Start infrastructure
pnpm db:migrate                # Run database migrations
```

### Development Commands

```bash
# Start all apps in watch mode
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type-check all packages
pnpm typecheck

# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Clean build artifacts
pnpm clean

# Run for a specific package
pnpm --filter @kalen/shared build
pnpm --filter @kalen/server dev
pnpm --filter @kalen/web test
```

### Infrastructure Management

```bash
pnpm infra:up      # Start all Docker services
pnpm infra:down    # Stop all Docker services
pnpm infra:logs    # Follow infrastructure logs
```

### Local Service URLs

| Service | URL |
|---------|-----|
| Web Client | http://localhost:3000 |
| API Server | http://localhost:4000 |
| Traefik Dashboard | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| NATS Monitor | http://localhost:8222 |
| Elasticsearch | http://localhost:9200 |

---

## Code Review Criteria

Every PR is reviewed against these criteria:

### Must-Have (PR will not merge without these)

- [ ] **TypeScript strict mode** — no `any`, no type assertions without justification
- [ ] **Tests** — unit tests for new logic, integration tests for new endpoints
- [ ] **No secrets** — no passwords, API keys, tokens, or .env files committed
- [ ] **Conventional commits** — all commit messages follow the convention
- [ ] **CI passes** — lint, typecheck, test, build all green

### Should-Have (PR may be delayed without these)

- [ ] **JSDoc on public APIs** — all exported functions, classes, and interfaces
- [ ] **Documentation updated** — README, docs/ files if user-facing change
- [ ] **Architecture alignment** — fits the five-layer model, respects package boundaries
- [ ] **Security implications** — does this change affect authentication, authorization, or data exposure?

### Nice-to-Have (reviewers will suggest but not block)

- [ ] **Performance considerations** — is this efficient for the expected scale?
- [ ] **Error messages** — are error messages clear and actionable?
- [ ] **Accessibility** — does the UI change meet accessibility standards?

---

## Reporting Bugs

When reporting bugs, please include:

1. **Environment** — OS, Node.js version, Docker version, browser
2. **Steps to reproduce** — numbered, specific steps
3. **Expected behavior** — what should happen
4. **Actual behavior** — what actually happens (include error messages, stack traces)
5. **Logs** — relevant logs from `pnpm infra:logs` or browser console

Use the bug report issue template if available.

---

## Suggesting Features

Feature suggestions should include:

1. **Problem** — what problem does this solve?
2. **Proposed solution** — how would you solve it?
3. **Alternatives considered** — what other approaches did you consider?
4. **Phase alignment** — which phase of the roadmap does this belong to?
5. **Willingness to implement** — are you willing to submit a PR?

Use the feature request issue template if available.

---

## Communication

- **Issues:** [github.com/mulkymalikuldhr/kalen/issues](https://github.com/mulkymalikuldhr/kalen/issues)
- **Email:** mulkymalikuldhr@mail.com
- **Security vulnerabilities:** See `docs/SECURITY.md` — do not report via public issues

---

## License

By contributing to KALEN, you agree that your contributions will be licensed under the AGPL-3.0 license, the same license that covers the project. You retain copyright to your own contributions, but grant the project the right to distribute them under AGPL-3.0.
