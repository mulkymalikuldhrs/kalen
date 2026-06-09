KALEN — Kinetic Autonomous Layer for Entity Networking
Complete Project Directory Structure
═══════════════════════════════════════════════════════════════════

> **Legend:** ✅ = Implemented | ⚠️ = Stub/Simulated | 📋 = Planned

kalen/
├── .github/                                    # 📋 GitHub-specific config
│   ├── workflows/
│   │   ├── ci.yml                              # 📋 CI: lint, typecheck, test, build on PR
│   │   ├── cd-staging.yml                      # 📋 CD: deploy staging on merge to develop
│   │   ├── cd-production.yml                   # 📋 CD: deploy production on merge to main
│   │   ├── security-scan.yml                   # 📋 Snyk/Trivy vulnerability scanning
│   │   └── release.yml                         # 📋 Semantic versioning + changelog generation
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml                      # 📋 Structured bug report form
│   │   ├── feature_request.yml                 # 📋 Feature request form
│   │   └── security_vulnerability.yml          # 📋 Private security disclosure form
│   ├── PULL_REQUEST_TEMPLATE.md                # 📋 PR checklist with architecture impact
│   ├── CODEOWNERS                              # 📋 Per-package code ownership
│   └── dependabot.yml                          # 📋 Automated dependency updates
│
├── .husky/                                     # Git hooks
│   ├── pre-commit                              # lint-staged: prettier + eslint
│   └── commit-msg                              # commitlint: conventional commits
│
├── .vscode/                                    # Shared VS Code config
│   ├── settings.json                           # Workspace settings (format on save)
│   ├── extensions.json                         # Recommended extensions
│   └── launch.json                             # Debug configs for all packages
│
├── apps/                                       # ═══ APPLICATIONS ═══
│   ├── web/                                    # ✅ Next.js 15 web client (App Router)
│   │   ├── package.json                        # Dependencies: next, react, @kalen/*
│   │   ├── next.config.ts                      # Next.js config: transpilePackages, rewrites
│   │   ├── tsconfig.json                       # Extends root tsconfig
│   │   ├── tailwind.config.ts                  # Design tokens: colors, spacing, typography
│   │   ├── postcss.config.js                   # PostCSS with Tailwind + autoprefixer
│   │   ├── .env.example                        # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, etc.
│   │   ├── middleware.ts                        # Auth guard: validate session tokens
│   │   │
│   │   ├── public/                             # Static assets served as-is
│   │   │   ├── favicon.ico
│   │   │   ├── manifest.json                   # PWA manifest
│   │   │   └── .well-known/
│   │   │       └── assetlinks.json             # Android app link verification
│   │   │
│   │   ├── src/
│   │   │   ├── app/                            # Next.js App Router pages
│   │   │   │   ├── layout.tsx                  # Root layout: providers, fonts, metadata
│   │   │   │   ├── page.tsx                    # Landing / redirect to /chat
│   │   │   │   ├── globals.css                 # Tailwind directives + CSS custom properties
│   │   │   │   │
│   │   │   │   ├── (auth)/                     # Auth route group (no layout inheritance)
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx            # WebAuthn passkey login page
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx            # Passkey registration + recovery setup
│   │   │   │   │   └── recovery/
│   │   │   │   │       └── page.tsx            # Account recovery via 24-word phrase
│   │   │   │   │
│   │   │   │   ├── (main)/                     # Main app route group (requires auth)
│   │   │   │   │   ├── layout.tsx              # Sidebar + header + presence indicator
│   │   │   │   │   ├── chat/
│   │   │   │   │   │   ├── page.tsx            # Chat list view
│   │   │   │   │   │   └── [conversationId]/
│   │   │   │   │   │       └── page.tsx        # Conversation view with message feed
│   │   │   │   │   ├── channels/
│   │   │   │   │   │   ├── page.tsx            # Channel directory (public/private/hybrid)
│   │   │   │   │   │   └── [channelId]/
│   │   │   │   │   │       └── page.tsx        # Channel view
│   │   │   │   │   ├── agents/
│   │   │   │   │   │   ├── page.tsx            # Agent directory: browse, create, manage
│   │   │   │   │   │   └── [agentId]/
│   │   │   │   │   │       └── page.tsx        # Agent profile: manifest, tools, activity
│   │   │   │   │   ├── calls/
│   │   │   │   │   │   └── page.tsx            # Active calls view with WebRTC UI
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx            # User settings: keys, devices, preferences
│   │   │   │   │   └── admin/
│   │   │   │   │       ├── page.tsx            # Admin dashboard
│   │   │   │   │       ├── agents/
│   │   │   │   │       │   └── page.tsx        # Agent governance: approve, revoke, scope
│   │   │   │   │       └── audit/
│   │   │   │   │           └── page.tsx        # Audit log viewer with filters
│   │   │   │   │
│   │   │   │   └── not-found.tsx               # 404 page
│   │   │   │
│   │   │   ├── components/                     # React components
│   │   │   │   ├── ui/                         # Primitives (shadcn/ui base)
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── avatar.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── tooltip.tsx
│   │   │   │   │   ├── scroll-area.tsx
│   │   │   │   │   ├── separator.tsx
│   │   │   │   │   └── sheet.tsx
│   │   │   │   │
│   │   │   │   ├── chat/                       # Chat-specific components
│   │   │   │   │   ├── message-list.tsx        # Virtualized message list
│   │   │   │   │   ├── message-item.tsx        # Single message: text, markdown, code
│   │   │   │   │   ├── message-input.tsx       # Rich input: text, emoji, file attach
│   │   │   │   │   ├── reaction-bar.tsx        # Message reactions UI
│   │   │   │   │   ├── typing-indicator.tsx    # Shows who is typing
│   │   │   │   │   ├── read-receipt.tsx        # Read receipt indicators
│   │   │   │   │   ├── file-upload.tsx         # File upload to MinIO via presigned URL
│   │   │   │   │   └── conversation-list.tsx   # Sidebar conversation list
│   │   │   │   │
│   │   │   │   ├── agents/                     # Agent UI components
│   │   │   │   │   ├── agent-card.tsx          # Agent card with name(ai), status, skills
│   │   │   │   │   ├── agent-manifest.tsx      # Render agent capability manifest
│   │   │   │   │   ├── agent-create-form.tsx   # Form: name, system prompt, tools, scope
│   │   │   │   │   ├── agent-activity-feed.tsx # Real-time agent action log
│   │   │   │   │   └── agent-scope-editor.tsx  # RBAC scope editor for agent permissions
│   │   │   │   │
│   │   │   │   ├── calls/                      # WebRTC call components
│   │   │   │   │   ├── call-view.tsx           # Main call UI with video/audio tiles
│   │   │   │   │   ├── call-controls.tsx       # Mute, camera, screen share, hangup
│   │   │   │   │   ├── call-participant.tsx    # Single participant tile
│   │   │   │   │   └── call-incoming.tsx       # Incoming call notification
│   │   │   │   │
│   │   │   │   ├── identity/                   # Identity/auth components
│   │   │   │   │   ├── passkey-register.tsx    # WebAuthn registration flow
│   │   │   │   │   ├── passkey-login.tsx       # WebAuthn authentication flow
│   │   │   │   │   ├── recovery-phrase.tsx     # 24-word recovery phrase display/verify
│   │   │   │   │   ├── device-manager.tsx      # List/manage registered passkey devices
│   │   │   │   │   └── entity-badge.tsx        # Human/Agent visual distinction badge
│   │   │   │   │
│   │   │   │   └── layout/                     # App shell components
│   │   │   │       ├── sidebar.tsx             # Navigation sidebar
│   │   │   │       ├── header.tsx              # Top bar: search, presence, user menu
│   │   │   │       ├── presence-dot.tsx        # Online/offline/away indicator
│   │   │   │       └── command-palette.tsx     # Cmd+K search and action palette
│   │   │   │
│   │   │   ├── hooks/                          # Custom React hooks
│   │   │   │   ├── use-auth.ts                 # Auth state: user, isAuthenticated, login, logout
│   │   │   │   ├── use-websocket.ts            # WebSocket connection with reconnect
│   │   │   │   ├── use-messages.ts             # Message CRUD with optimistic updates
│   │   │   │   ├── use-conversations.ts        # Conversation list and management
│   │   │   │   ├── use-webrtc.ts               # LiveKit room connection
│   │   │   │   ├── use-agents.ts               # Agent directory and management
│   │   │   │   ├── use-presence.ts             # Online status subscription
│   │   │   │   ├── use-file-upload.ts           # Presigned URL upload to MinIO
│   │   │   │   └── use-search.ts               # Full-text message search (Elasticsearch)
│   │   │   │
│   │   │   ├── lib/                            # Client-side utilities
│   │   │   │   ├── api-client.ts               # Typed fetch wrapper with auth headers
│   │   │   │   ├── ws-client.ts                # WebSocket manager: connect, subscribe, reconnect
│   │   │   │   ├── livekit-client.ts           # LiveKit room helpers
│   │   │   │   ├── webauthn-client.ts          # navigator.credentials helpers (register/auth)
│   │   │   │   ├── query-client.ts             # TanStack Query client config
│   │   │   │   └── utils.ts                    # cn(), formatDate(), etc.
│   │   │   │
│   │   │   ├── stores/                         # Zustand state stores
│   │   │   │   ├── auth-store.ts               # User session, token, entity type
│   │   │   │   ├── chat-store.ts               # Active conversation, drafts, filters
│   │   │   │   ├── presence-store.ts           # Online users and agents map
│   │   │   │   └── ui-store.ts                 # Sidebar collapsed, theme, modals
│   │   │   │
│   │   │   └── styles/                         # Global styles
│   │   │       ├── fonts.ts                    # Next.js font loading (Inter, JetBrains Mono)
│   │   │       └── theme.css                   # CSS custom properties for dark/light
│   │   │
│   │   ├── tests/                              # Web app tests
│   │   │   ├── e2e/
│   │   │   │   ├── auth.spec.ts                # Playwright: passkey register/login flow
│   │   │   │   ├── chat.spec.ts                # Playwright: send message, receive, react
│   │   │   │   └── agents.spec.ts              # Playwright: create agent, view manifest
│   │   │   └── setup.ts                        # Test environment setup
│   │   │
│   │   └── Dockerfile                           # Multi-stage: deps → build → node:alpine
│   │
│   └── server/                                 # API server (Node.js + NestJS)
│       ├── package.json                        # Dependencies: @nestjs/core, @kalen/*
│       ├── nest-cli.json                       # NestJS CLI config
│       ├── tsconfig.json                       # Extends root tsconfig
│       ├── .env.example                        # DB_URL, REDIS_URL, NATS_URL, JWT_SECRET, etc.
│       │
│       ├── src/
│       │   ├── main.ts                         # Bootstrap: NestFactory, CORS, validation pipe
│       │   ├── app.module.ts                   # Root module: imports all feature modules
│       │   │
│       │   ├── config/                         # Configuration module
│       │   │   ├── config.module.ts            # ConfigModule.forRoot with validation schema
│       │   │   ├── config.service.ts           # Typed config accessor
│       │   │   └── config.schema.ts            # Joi/zod validation schema for env vars
│       │   │
│       │   ├── auth/                           # Authentication module
│       │   │   ├── auth.module.ts              # Imports IdentityModule, JwtModule
│       │   │   ├── auth.controller.ts          # POST /auth/register, /auth/login, /auth/verify
│       │   │   ├── auth.service.ts             # Orchestrates WebAuthn + JWT token issuance
│       │   │   ├── auth.dto.ts                 # RegistrationOptions, AuthenticationOptions DTOs
│       │   │   ├── jwt.strategy.ts             # Passport JWT strategy with entity type extraction
│       │   │   ├── jwt.guard.ts                # Guard: validates JWT, injects req.user
│       │   │   └── ws.guard.ts                 # WebSocket authentication guard
│       │   │
│       │   ├── conversations/                  # Messaging module
│       │   │   ├── conversations.module.ts     # Imports TypeOrmModule, EventsModule
│       │   │   ├── conversations.controller.ts # CRUD /conversations, /conversations/:id/messages
│       │   │   ├── conversations.service.ts    # Business logic: create, list, members
│       │   │   ├── messages.service.ts         # Send, edit, delete, react, search
│       │   │   ├── conversations.entity.ts     # TypeORM entity: id, type, name, members
│       │   │   ├── message.entity.ts           # TypeORM entity: id, content, sender, reactions
│       │   │   ├── conversations.dto.ts        # CreateConversation, SendMessage DTOs
│       │   │   └── conversations.gateway.ts    # WebSocket gateway: real-time message relay
│       │   │
│       │   ├── channels/                       # Channels module
│       │   │   ├── channels.module.ts
│       │   │   ├── channels.controller.ts      # CRUD /channels with visibility filter
│       │   │   ├── channels.service.ts         # Public/private/agent-only/hybrid logic
│       │   │   ├── channels.entity.ts          # TypeORM entity: visibility, allowedEntityTypes
│       │   │   └── channels.dto.ts
│       │   │
│       │   ├── agents/                         # Agent management module
│       │   │   ├── agents.module.ts            # Imports IdentityModule, McpModule
│       │   │   ├── agents.controller.ts        # CRUD /agents, /agents/:id/manifest
│       │   │   ├── agents.service.ts           # Agent lifecycle: create, scope, revoke
│       │   │   ├── agent-identity.service.ts   # Agent keypair generation, manifest signing
│       │   │   ├── agent-scope.service.ts      # RBAC enforcement: rooms, tools, humans
│       │   │   ├── agents.entity.ts            # TypeORM: name(ai), publicKey, manifest, status
│       │   │   └── agents.dto.ts               # CreateAgent, UpdateAgentScope DTOs
│       │   │
│       │   ├── calls/                          # WebRTC/LiveKit module
│       │   │   ├── calls.module.ts
│       │   │   ├── calls.controller.ts         # POST /calls/create, /calls/:id/join, /calls/token
│       │   │   ├── calls.service.ts            # LiveKit room management, token generation
│       │   │   ├── calls.gateway.ts            # WebSocket: signaling, ICE candidate exchange
│       │   │   └── calls.dto.ts                # CreateCall, JoinCall DTOs
│       │   │
│       │   ├── files/                          # File storage module
│       │   │   ├── files.module.ts
│       │   │   ├── files.controller.ts         # POST /files/presign, GET /files/:id
│       │   │   ├── files.service.ts            # MinIO presigned URL generation, metadata
│       │   │   ├── files.entity.ts             # TypeORM: key, size, mimeType, conversationId
│       │   │   └── files.dto.ts
│       │   │
│       │   ├── search/                         # Full-text search module
│       │   │   ├── search.module.ts
│       │   │   ├── search.controller.ts        # GET /search?q=&type=&conversationId=
│       │   │   ├── search.service.ts           # Elasticsearch query builder
│       │   │   └── search.dto.ts               # SearchQuery, SearchResult DTOs
│       │   │
│       │   ├── presence/                       # Presence module
│       │   │   ├── presence.module.ts
│       │   │   ├── presence.service.ts         # Track online/offline via Redis + NATS
│       │   │   └── presence.gateway.ts         # WebSocket: subscribe to presence updates
│       │   │
│       │   ├── audit/                          # Audit logging module
│       │   │   ├── audit.module.ts
│       │   │   ├── audit.service.ts            # Append-only signed audit log to PostgreSQL
│       │   │   ├── audit.entity.ts             # TypeORM: timestamp, entityType, action, target
│       │   │   └── audit.interceptor.ts        # Auto-capture request-level audit events
│       │   │
│       │   ├── admin/                          # Admin module
│       │   │   ├── admin.module.ts
│       │   │   ├── admin.controller.ts         # GET /admin/stats, /admin/agents, /admin/audit
│       │   │   ├── admin.guard.ts              # Role guard: admin only
│       │   │   └── admin.service.ts            # Dashboard data aggregation
│       │   │
│       │   ├── events/                         # Event bus module
│       │   │   ├── events.module.ts            # NATS connection module
│       │   │   ├── events.service.ts           # publish(subject, payload), subscribe(subject, handler)
│       │   │   └── event-subjects.ts           # Constants: MESSAGE.CREATED, AGENT.ACTION, etc.
│       │   │
│       │   └── database/                       # Database module
│       │       ├── database.module.ts          # TypeORM config with migrations
│       │       └── migrations/                 # TypeORM migration files
│       │           ├── 1700000000000-InitialSchema.ts
│       │           └── 1700000000001-AgentIdentity.ts
│       │
│       ├── tests/
│       │   ├── auth.e2e-spec.ts                # E2E: register → login → verify cycle
│       │   ├── conversations.e2e-spec.ts       # E2E: create conversation, send messages
│       │   ├── agents.e2e-spec.ts              # E2E: create agent, validate suffix, scope
│       │   └── jest-e2e.json                   # E2E test config
│       │
│       └── Dockerfile                           # Multi-stage: build → production node:alpine
│
├── packages/                                   # ═══ SHARED PACKAGES ═══
│   ├── shared/                                 # Shared types, protocols, utilities
│   │   ├── package.json                        # @kalen/shared
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                        # Barrel export
│   │   │   │
│   │   │   ├── types/                          # Core type definitions
│   │   │   │   ├── entity.ts                   # EntityType enum: HUMAN | AGENT
│   │   │   │   ├── user.ts                     # HumanUser: id, username, credentialIds
│   │   │   │   ├── agent.ts                    # Agent: id, name(ai), publicKey, manifestUrl
│   │   │   │   ├── conversation.ts             # Conversation: id, type, members, lastMessage
│   │   │   │   ├── message.ts                  # Message: id, content, sender, reactions, readBy
│   │   │   │   ├── channel.ts                  # Channel: id, visibility, allowedEntityTypes
│   │   │   │   ├── call.ts                     # Call: id, type, participants, livekitRoom
│   │   │   │   ├── file.ts                     # FileAttachment: id, key, size, mimeType
│   │   │   │   ├── presence.ts                 # PresenceStatus: userId, status, lastSeen
│   │   │   │   ├── audit.ts                    # AuditEntry: timestamp, entityType, action, target
│   │   │   │   └── api.ts                      # API response wrappers: ApiResponse<T>, Paginated<T>
│   │   │   │
│   │   │   ├── protocols/                      # Protocol message schemas
│   │   │   │   ├── ws-events.ts                # WebSocket event type definitions
│   │   │   │   ├── nats-events.ts              # NATS subject/payload type definitions
│   │   │   │   ├── mcp-types.ts                # MCP JSON-RPC type definitions (client→server)
│   │   │   │   └── a2a-types.ts                # A2A JSON-RPC 2.0 type definitions
│   │   │   │
│   │   │   ├── schemas/                        # Runtime validation schemas (zod)
│   │   │   │   ├── auth.schema.ts              # RegisterRequest, LoginRequest validation
│   │   │   │   ├── conversation.schema.ts      # CreateConversation, SendMessage validation
│   │   │   │   ├── agent.schema.ts             # CreateAgent, AgentManifest validation
│   │   │   │   ├── mcp.schema.ts               # MCP request/response validation
│   │   │   │   └── a2a.schema.ts               # A2A Task, Message, Artifact validation
│   │   │   │
│   │   │   ├── constants/                      # Shared constants
│   │   │   │   ├── entity-rules.ts             # AGENT_SUFFIX = "(ai)", naming regex
│   │   │   │   ├── permissions.ts              # Permission enum: READ, WRITE, CALL, ADMIN
│   │   │   │   ├── channel-visibility.ts       # PUBLIC, PRIVATE, AGENT_ONLY, HYBRID
│   │   │   │   └── limits.ts                   # MAX_FILE_SIZE, MAX_GROUP_SIZE, etc.
│   │   │   │
│   │   │   └── utils/                          # Pure utility functions
│   │   │       ├── entity-helpers.ts           # isAgent(), isHuman(), parseEntityName()
│   │   │       ├── validation.ts               # validateAgentName(), validateSuffix()
│   │   │       ├── crypto.ts                   # base64url encode/decode, hash helpers
│   │   │       └── id.ts                       # nanoid-based ID generation
│   │   │
│   │   └── tsup.config.ts                      # Build config: dual CJS + ESM output
│   │
│   ├── identity/                               # Identity service (WebAuthn + Agent identity)
│   │   ├── package.json                        # @kalen/identity
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                        # Barrel export
│   │   │   │
│   │   │   ├── webauthn/                       # WebAuthn/Passkey implementation
│   │   │   │   ├── registration.service.ts     # generateRegistrationOptions(), verifyRegistration()
│   │   │   │   ├── authentication.service.ts   # generateAuthenticationOptions(), verifyAuthentication()
│   │   │   │   ├── challenge-store.ts          # Redis-backed challenge storage with TTL
│   │   │   │   ├── credential-store.ts         # PostgreSQL credential storage: publicKey, counter
│   │   │   │   └── webauthn.config.ts          # rpID, rpName, origin, timeout, attestation
│   │   │   │
│   │   │   ├── agent-identity/                 # Agent identity implementation
│   │   │   │   ├── keypair.service.ts          # Ed25519 keypair generation, storage, rotation
│   │   │   │   ├── manifest.service.ts         # Agent manifest CRUD: skills, tools, rate, owner
│   │   │   │   ├── manifest-signer.ts          # Sign manifest with agent Ed25519 private key
│   │   │   │   ├── manifest-verifier.ts        # Verify manifest signature against public key
│   │   │   │   ├── agent-token.service.ts      # Short-lived token (24h TTL) creation, validation
│   │   │   │   └── suffix-enforcer.ts          # Enforce (ai) suffix on agent names, prevent spoofing
│   │   │   │
│   │   │   ├── recovery/                       # Account recovery
│   │   │   │   ├── recovery.service.ts         # Generate/verify 24-word recovery phrase
│   │   │   │   ├── recovery-phrase.ts          # BIP39 wordlist + generation + validation
│   │   │   │   └── device-binding.ts           # Bind recovery to device credentials
│   │   │   │
│   │   │   ├── rbac/                           # Role-based access control
│   │   │   │   ├── role.service.ts             # Role assignment: HUMAN, AGENT, ADMIN
│   │   │   │   ├── permission.service.ts       # Permission check: canAccess(room, tool, entity)
│   │   │   │   ├── scope-resolver.ts           # Resolve agent scope from manifest capabilities
│   │   │   │   └── policy-engine.ts            # Evaluate access policies with deny-first logic
│   │   │   │
│   │   │   └── audit/                          # Identity audit trail
│   │   │       ├── identity-audit.service.ts   # Log identity events: register, auth, rotate, revoke
│   │   │       └── identity-audit.entity.ts    # Audit record type definition
│   │   │
│   │   └── tsup.config.ts
│   │
│   ├── mcp-gateway/                            # MCP protocol integration
│   │   ├── package.json                        # @kalen/mcp-gateway
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                        # Barrel export
│   │   │   │
│   │   │   ├── gateway/                        # MCP Gateway core
│   │   │   │   ├── mcp-gateway.service.ts      # Central gateway: route tool calls to servers
│   │   │   │   ├── mcp-gateway.controller.ts   # HTTP endpoints for MCP operations
│   │   │   │   ├── mcp-gateway.module.ts       # NestJS module definition
│   │   │   │   └── gateway.config.ts           # Gateway config: timeouts, maxConcurrent, retries
│   │   │   │
│   │   │   ├── client/                         # MCP Client (embedded in agent runtime)
│   │   │   │   ├── mcp-client.ts               # MCP client: connect to MCP servers via stdio/SSE
│   │   │   │   ├── client-transport.ts         # Transport layer: stdio, SSE, WebSocket
│   │   │   │   ├── client-pool.ts              # Pool of MCP clients per agent, with lifecycle
│   │   │   │   └── client.config.ts            # Client config: requestTimeout, maxRetries
│   │   │   │
│   │   │   ├── server/                         # MCP Server (tool provider)
│   │   │   │   ├── mcp-server.ts               # MCP server: expose tools, resources, prompts
│   │   │   │   ├── server-transport.ts         # Transport: stdio, SSE
│   │   │   │   ├── tool-registry.ts            # Register tool definitions with input schemas
│   │   │   │   └── resource-provider.ts        # Expose data resources to MCP clients
│   │   │   │
│   │   │   ├── registry/                       # MCP Server marketplace registry
│   │   │   │   ├── server-registry.service.ts  # CRUD: register, discover, deprecate MCP servers
│   │   │   │   ├── server-registry.entity.ts   # TypeORM: name, version, tools, status, owner
│   │   │   │   └── server-card.ts              # MCP server metadata card (analog to A2A Agent Card)
│   │   │   │
│   │   │   ├── governance/                     # Tool access governance
│   │   │   │   ├── allowlist.service.ts        # Per-agent tool allowlist enforcement
│   │   │   │   ├── tool-sanitizer.ts           # Sanitize tool outputs: strip prompt injection
│   │   │   │   ├── capability-validator.ts     # Validate tool calls against agent manifest scope
│   │   │   │   ├── rate-limiter.ts             # Per-agent, per-tool rate limiting (Redis)
│   │   │   │   └── oauth.service.ts            # OAuth 2.1 integration for external API tools
│   │   │   │
│   │   │   ├── tools/                          # Built-in MCP tools
│   │   │   │   ├── kalen-message.tool.ts       # Tool: send/receive messages in KALEN
│   │   │   │   ├── kalen-search.tool.ts        # Tool: search messages and conversations
│   │   │   │   ├── kalen-file.tool.ts          # Tool: upload/download files from MinIO
│   │   │   │   ├── kalen-web.tool.ts           # Tool: web search and fetch (via API)
│   │   │   │   └── kalen-code.tool.ts          # Tool: code execution in sandboxed env
│   │   │   │
│   │   │   └── protocol/                       # MCP protocol implementation
│   │   │       ├── json-rpc.ts                 # JSON-RPC 2.0 base: request, response, error
│   │   │       ├── mcp-messages.ts             # MCP-specific messages: initialize, tools/list, etc.
│   │   │       └── mcp-errors.ts               # MCP error codes and factories
│   │   │
│   │   └── tsup.config.ts
│   │
│   └── a2a-router/                             # A2A protocol integration
│       ├── package.json                        # @kalen/a2a-router
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts                        # Barrel export
│       │   │
│       │   ├── router/                         # A2A Router core
│       │   │   ├── a2a-router.service.ts       # Central router: route tasks to agents
│       │   │   ├── a2a-router.controller.ts    # HTTP endpoints: A2A JSON-RPC 2.0 over HTTP
│       │   │   ├── a2a-router.module.ts        # NestJS module definition
│       │   │   └── router.config.ts            # Router config: discovery cache TTL, maxTasks
│       │   │
│       │   ├── agent-card/                     # Agent Card management
│       │   │   ├── agent-card.service.ts       # Generate, sign, verify, cache Agent Cards
│       │   │   ├── agent-card.entity.ts        # TypeORM: url, name, description, capabilities
│       │   │   ├── agent-card.schema.ts        # Zod schema for Agent Card validation
│       │   │   └── well-known.controller.ts    # GET /.well-known/agent.json endpoint
│       │   │
│       │   ├── task/                           # A2A Task lifecycle
│       │   │   ├── task.service.ts             # Task CRUD: create, update, cancel, complete
│       │   │   ├── task.entity.ts              # TypeORM: id, status, history, artifacts
│       │   │   ├── task-lifecycle.ts           # State machine: submitted→working→completed/failed
│       │   │   ├── task-delegator.ts           # Delegate tasks to appropriate agents
│       │   │   └── task-events.gateway.ts      # SSE: stream task status updates to clients
│       │   │
│       │   ├── artifact/                       # A2A Artifact management
│       │   │   ├── artifact.service.ts         # Create, store, retrieve artifacts
│       │   │   ├── artifact.entity.ts          # TypeORM: id, taskId, type, content, parts
│       │   │   └── artifact.schema.ts          # Zod schema for artifact validation
│       │   │
│       │   ├── message/                        # A2A Message (conversation within tasks)
│       │   │   ├── a2a-message.service.ts      # Send/receive task-scoped messages
│       │   │   ├── a2a-message.entity.ts       # TypeORM: id, taskId, role, content, parts
│       │   │   └── a2a-message.schema.ts       # Zod schema for message validation
│       │   │
│       │   ├── discovery/                      # Agent discovery service
│       │   │   ├── discovery.service.ts        # Discover agents via Agent Cards, cache in Redis
│       │   │   ├── discovery-cache.ts          # Redis-backed Agent Card cache with TTL
│       │   │   └── discovery-events.ts         # NATS events for new/updated/deprecated agents
│       │   │
│       │   ├── security/                       # A2A security layer
│       │   │   ├── card-signer.ts              # Sign Agent Cards with Ed25519
│       │   │   ├── card-verifier.ts            # Verify Agent Card signatures
│       │   │   ├── oauth-pkce.ts               # OAuth 2.1 with PKCE for A2A auth
│       │   │   ├── mtls.config.ts              # mTLS configuration for enterprise deployment
│       │   │   └── a2a-rate-limiter.ts         # Per-agent rate limiting for A2A endpoints
│       │   │
│       │   └── protocol/                       # A2A protocol implementation
│       │       ├── json-rpc.ts                 # JSON-RPC 2.0: parse, validate, respond
│       │       ├── a2a-methods.ts              # A2A methods: tasks/send, tasks/get, etc.
│       │       ├── a2a-errors.ts               # A2A error codes: -32600, -32601, etc.
│       │       └── a2a-sse.ts                  # SSE stream handler for task updates
│       │
│       └── tsup.config.ts
│
├── infra/                                      # ═══ INFRASTRUCTURE ═══
│   ├── docker/                                 # Docker configurations
│   │   ├── docker-compose.yml                  # Local dev: all services (server, web, postgres, etc.)
│   │   ├── docker-compose.prod.yml             # Production overrides: resource limits, replicas
│   │   ├── docker-compose.test.yml             # Test environment: isolated database, fixtures
│   │   │
│   │   ├── traefik/                            # API Gateway / Reverse Proxy
│   │   │   ├── traefik.yml                     # Static config: entryPoints, providers, log
│   │   │   ├── traefik-dynamic.yml             # Dynamic config: routers, services, middlewares
│   │   │   ├── acme.json                       # Let's Encrypt cert storage (gitignored)
│   │   │   └── middleware/
│   │   │       ├── rate-limit.yml              # Rate limiting middleware config
│   │   │       ├── security-headers.yml        # Security headers (HSTS, CSP, X-Frame)
│   │   │       └── cors.yml                    # CORS configuration
│   │   │
│   │   ├── openim/                             # OpenIM Server config
│   │   │   ├── config.yaml                     # OpenIM server configuration
│   │   │   └── notification.yaml               # Push notification configuration
│   │   │
│   │   ├── livekit/                            # LiveKit WebRTC SFU config
│   │   │   ├── livekit.yaml                    # Room settings, RTC config, recording
│   │   │   └── egress.yaml                     # Recording/egress template config
│   │   │
│   │   ├── postgres/                           # PostgreSQL initialization
│   │   │   ├── init.sql                        # Create databases, extensions (pgvector, uuid-ossp)
│   │   │   └── pg_hba.conf                     # Host-based auth config
│   │   │
│   │   ├── redis/                              # Redis configuration
│   │   │   └── redis.conf                      # maxmemory, eviction policy, ACLs
│   │   │
│   │   ├── minio/                              # MinIO object storage
│   │   │   └── policy.json                     # Bucket access policy
│   │   │
│   │   ├── nats/                               # NATS event bus
│   │   │   └── nats.conf                       # Cluster, jetstream, auth config
│   │   │
│   │   ├── elasticsearch/                      # Elasticsearch config
│   │   │   └── elasticsearch.yml               # Index settings, shard config
│   │   │
│   │   ├── coturn/                             # TURN server for WebRTC NAT traversal
│   │   │   └── turnserver.conf                 # Realm, credentials, TLS cert paths
│   │   │
│   │   └── monitoring/                         # Observability stack
│   │       ├── prometheus/
│   │       │   ├── prometheus.yml              # Scrape configs for all services
│   │       │   └── alert.rules.yml             # Alert rules: high latency, low uptime
│   │       ├── grafana/
│   │       │   ├── datasources.yml             # Prometheus + Loki datasources
│   │       │   ├── dashboards/
│   │       │   │   ├── kalen-overview.json     # System health dashboard
│   │       │   │   ├── messaging-metrics.json  # Message throughput, latency
│   │       │   │   └── agent-activity.json     # Agent actions, MCP calls, A2A tasks
│   │       │   └── dashboard-providers.yml     # Dashboard provisioning config
│   │       └── loki/
│   │           └── loki-config.yml             # Log aggregation config
│   │
│   ├── k8s/                                    # Kubernetes production manifests
│   │   ├── base/                               # Base Kustomize resources
│   │   │   ├── namespace.yaml                  # kalen-system namespace
│   │   │   ├── kustomization.yaml              # Base resource references
│   │   │   │
│   │   │   ├── server/                         # API server deployment
│   │   │   │   ├── deployment.yaml             # 2 replicas, resource limits, probes
│   │   │   │   ├── service.yaml                # ClusterIP on port 3000
│   │   │   │   ├── configmap.yaml              # Non-secret env vars
│   │   │   │   └── hpa.yaml                    # Autoscale: 2-10 replicas by CPU
│   │   │   │
│   │   │   ├── web/                            # Web client deployment
│   │   │   │   ├── deployment.yaml             # 2 replicas, nginx serving
│   │   │   │   └── service.yaml                # ClusterIP on port 80
│   │   │   │
│   │   │   ├── identity/                       # Identity service (if split from server)
│   │   │   │   ├── deployment.yaml
│   │   │   │   └── service.yaml
│   │   │   │
│   │   │   ├── postgres/                       # PostgreSQL StatefulSet
│   │   │   │   ├── statefulset.yaml            # 1 replica, PVC, pgvector init
│   │   │   │   ├── service.yaml                # ClusterIP on port 5432
│   │   │   │   └── pvc.yaml                    # Persistent volume claim
│   │   │   │
│   │   │   ├── redis/                          # Redis StatefulSet
│   │   │   │   ├── statefulset.yaml            # 1 replica with persistence
│   │   │   │   └── service.yaml                # ClusterIP on port 6379
│   │   │   │
│   │   │   ├── minio/                          # MinIO StatefulSet
│   │   │   │   ├── statefulset.yaml            # 1 replica, PVC for object storage
│   │   │   │   ├── service.yaml                # ClusterIP on port 9000
│   │   │   │   └── pvc.yaml
│   │   │   │
│   │   │   ├── nats/                           # NATS StatefulSet with JetStream
│   │   │   │   ├── statefulset.yaml
│   │   │   │   └── service.yaml                # ClusterIP on port 4222
│   │   │   │
│   │   │   ├── elasticsearch/                  # Elasticsearch StatefulSet
│   │   │   │   ├── statefulset.yaml            # 1 replica, heap, PVC
│   │   │   │   └── service.yaml                # ClusterIP on port 9200
│   │   │   │
│   │   │   ├── livekit/                        # LiveKit SFU deployment
│   │   │   │   ├── deployment.yaml             # 1 replica, hostNetwork for WebRTC
│   │   │   │   └── service.yaml
│   │   │   │
│   │   │   ├── traefik/                        # Traefik Ingress Controller
│   │   │   │   ├── deployment.yaml             # 2 replicas, hostNetwork
│   │   │   │   ├── service.yaml                # LoadBalancer type
│   │   │   │   ├── ingressroute.yaml           # HTTP routing rules
│   │   │   │   └── middleware.yaml              # Rate limit, security headers
│   │   │   │
│   │   │   ├── coturn/                         # TURN server
│   │   │   │   ├── deployment.yaml             # hostNetwork, UDP port range
│   │   │   │   └── service.yaml
│   │   │   │
│   │   │   ├── monitoring/                     # Monitoring stack
│   │   │   │   ├── prometheus/
│   │   │   │   │   ├── deployment.yaml
│   │   │   │   │   ├── service.yaml
│   │   │   │   │   └── configmap.yaml          # Scrape targets
│   │   │   │   ├── grafana/
│   │   │   │   │   ├── deployment.yaml
│   │   │   │   │   └── service.yaml
│   │   │   │   └── loki/
│   │   │   │       ├── deployment.yaml
│   │   │   │       └── service.yaml
│   │   │   │
│   │   │   └── secrets/                        # Sealed Secrets (Bitnami)
│   │   │       ├── sealedsecret-db.yaml        # Encrypted DB credentials
│   │   │       ├── sealedsecret-jwt.yaml       # Encrypted JWT signing key
│   │   │       └── sealedsecret-minio.yaml     # Encrypted MinIO root credentials
│   │   │
│   │   ├── overlays/                           # Environment-specific Kustomize overlays
│   │   │   ├── staging/
│   │   │   │   ├── kustomization.yaml          # References base, applies staging patches
│   │   │   │   ├── patches/
│   │   │   │   │   └── replicas.yaml           # Override: 1 replica for all services
│   │   │   │   └── configmap-patch.yaml        # Staging-specific env vars
│   │   │   │
│   │   │   └── production/
│   │   │       ├── kustomization.yaml          # References base, applies production patches
│   │   │       ├── patches/
│   │   │       │   └── replicas.yaml           # Override: 3+ replicas for critical services
│   │   │       ├── configmap-patch.yaml        # Production env vars, logging level
│   │   │       └── hpa-patch.yaml              # Aggressive autoscaling thresholds
│   │   │
│   │   └── scripts/
│   │       ├── deploy.sh                       # kubectl apply with kustomize
│   │       ├── rollback.sh                     # Rollback to previous deployment
│   │       └── seed-db.sh                      # Seed production database with initial data
│   │
│   └── scripts/                                # DevOps scripts
│       ├── setup-local.sh                      # One-command local dev setup
│       ├── seed-dev.sh                         # Seed dev database with test data
│       ├── generate-keys.sh                    # Generate Ed25519 keypair for dev agent
│       ├── backup-db.sh                        # PostgreSQL backup script
│       └── restore-db.sh                       # PostgreSQL restore script
│
├── .env.example                                # Root env template with ALL required variables
├── .eslintrc.js                                # Shared ESLint: extends @typescript-eslint/recommended
├── .prettierrc                                 # Shared Prettier config
├── .gitignore                                  # node_modules, dist, .env, *.pem, acme.json
├── commitlint.config.js                        # @commitlint/config-conventional
├── lint-staged.config.js                       # Prettier + ESLint on staged files
├── turbo.json                                  # Turborepo pipeline: build, dev, lint, test
├── package.json                                # Root: workspaces, turbo, devDependencies
├── pnpm-workspace.yaml                         # pnpm workspace: apps/*, packages/*
├── tsconfig.json                               # Root TypeScript config (strict, paths)
└── LICENSE                                     # AGPL-3.0 (copyleft for sovereign infrastructure)
