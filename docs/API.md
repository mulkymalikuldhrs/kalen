# KALEN API Documentation

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)
**Last Updated:** 2026-06-09
**API Version:** v1 (planned)

> **⚠️ NOTHING IN THIS DOCUMENT IS IMPLEMENTED YET.**
> All endpoints, events, and schemas listed below are **planned — not yet implemented**.
> This document serves as the API contract that implementations will follow.
> When endpoints are implemented, their status will be updated from "Planned" to "Implemented" with the version number.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [REST Endpoints](#3-rest-endpoints)
4. [WebSocket Events](#4-websocket-events)
5. [A2A Protocol Endpoints](#5-a2a-protocol-endpoints)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting](#7-rate-limiting)
8. [Pagination](#8-pagination)
9. [Versioning](#9-versioning)

---

## 1. Overview

### Base URL

| Environment | Base URL |
|-------------|----------|
| Local development | `http://localhost:4000/api/v1` |
| Staging | `https://staging.kalen.example.com/api/v1` |
| Production | `https://kalen.example.com/api/v1` |

### Content Type

All request and response bodies use `application/json` unless otherwise specified.

File uploads use `multipart/form-data` with presigned URL flow (see Files API).

### Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (for authenticated endpoints) | `Bearer <JWT>` — obtained from auth endpoints |
| `Content-Type` | Yes (for POST/PUT/PATCH) | `application/json` |
| `X-Kalen-Trace-Id` | No | Client-provided trace ID for request correlation |
| `X-Request-Id` | Auto-generated if not provided | Unique request identifier for debugging |

---

## 2. Authentication

### 2.1 Human Authentication (WebAuthn)

**Status: Planned — not yet implemented**

#### POST /auth/register-begin

Initiate WebAuthn registration. Server generates a challenge and returns registration options.

**Request:**

```json
{
  "email": "user@example.com",
  "displayName": "Alice"
}
```

**Response (200):**

```json
{
  "challenge": "base64url-encoded-challenge",
  "rp": {
    "name": "KALEN",
    "id": "localhost"
  },
  "user": {
    "id": "base64url-encoded-user-id",
    "name": "user@example.com",
    "displayName": "Alice"
  },
  "pubKeyCredParams": [
    { "type": "public-key", "alg": -7 },
    { "type": "public-key", "alg": -257 }
  ],
  "timeout": 60000,
  "attestation": "none",
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "preferred"
  }
}
```

#### POST /auth/register-finish

Complete WebAuthn registration. Client sends the attestation from `navigator.credentials.create()`.

**Request:**

```json
{
  "email": "user@example.com",
  "attestationResponse": {
    "clientDataJSON": "base64url-encoded",
    "attestationObject": "base64url-encoded"
  }
}
```

**Response (200):**

```json
{
  "identityId": "uuid",
  "suffix": "@alice#a3f1",
  "entityType": "human",
  "recoveryPhrase": "word1 word2 ... word24"
}
```

**Note:** The recovery phrase is returned **only once** during registration. It is not stored in plaintext — only a bcrypt hash is stored for verification during recovery.

#### POST /auth/login-begin

Initiate WebAuthn authentication. Server generates a challenge for the user's registered credentials.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "challenge": "base64url-encoded-challenge",
  "rpId": "localhost",
  "allowCredentials": [
    {
      "type": "public-key",
      "id": "base64url-encoded-credential-id",
      "transports": ["internal", "hybrid"]
    }
  ],
  "timeout": 60000,
  "userVerification": "preferred"
}
```

#### POST /auth/login-finish

Complete WebAuthn authentication. Client sends the assertion from `navigator.credentials.get()`.

**Request:**

```json
{
  "email": "user@example.com",
  "assertionResponse": {
    "clientDataJSON": "base64url-encoded",
    "authenticatorData": "base64url-encoded",
    "signature": "base64url-encoded",
    "userHandle": "base64url-encoded"
  }
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "identity": {
    "id": "uuid",
    "suffix": "@alice#a3f1",
    "entityType": "human",
    "displayName": "Alice",
    "roles": ["user"]
  }
}
```

#### POST /auth/refresh

Exchange a valid refresh token for new access and refresh tokens.

**Request:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):** Same as `/auth/login-finish`

#### POST /auth/recovery

Recover account using 24-word BIP39 recovery phrase. Rate-limited to 3 attempts per 24 hours.

**Request:**

```json
{
  "recoveryPhrase": "word1 word2 ... word24"
}
```

**Response (200):**

```json
{
  "recoveryToken": "temp-token-for-passkey-re-registration",
  "expiresIn": 300
}
```

The recovery token allows the user to register a new passkey device.

### 2.2 Agent Authentication (Ed25519)

**Status: Planned — not yet implemented**

#### POST /agents

Create a new agent with Ed25519 keypair. Requires human JWT.

**Request:**

```json
{
  "displayName": "CodeBot(ai)",
  "publicKey": "base64url-encoded-ed25519-public-key",
  "capabilities": {
    "skills": ["code.write", "code.review"],
    "tools": ["kalen-search", "kalen-file"],
    "rateLimits": {
      "maxRequestsPerMinute": 100
    }
  }
}
```

**Validation:** `displayName` must end with `(ai)`. Rejected with 400 if not.

**Response (201):**

```json
{
  "id": "uuid",
  "suffix": "@codebot.agent#7b2c",
  "entityType": "agent",
  "displayName": "CodeBot(ai)",
  "publicKey": "base64url-encoded-ed25519-public-key",
  "capabilities": { "..." },
  "ownerId": "uuid",
  "status": "active",
  "createdAt": "2026-06-09T12:00:00Z"
}
```

#### POST /auth/agent

Authenticate as an agent using Ed25519 signature.

**Request:**

```json
{
  "identityId": "uuid",
  "timestamp": "2026-06-09T12:00:00.000Z",
  "signature": "base64url-encoded-ed25519-signature"
}
```

The signature is computed over `identityId + timestamp`. Server verifies the signature against the registered public key and checks that the timestamp is within ±30 seconds of server time.

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 86400,
  "tokenType": "Bearer",
  "identity": {
    "id": "uuid",
    "suffix": "@codebot.agent#7b2c",
    "entityType": "agent",
    "displayName": "CodeBot(ai)",
    "roles": ["agent"],
    "scope": { "..." }
  }
}
```

### 2.3 Token Verification

#### GET /auth/verify

Verify the current JWT token and return identity information.

**Headers:** `Authorization: Bearer <JWT>`

**Response (200):**

```json
{
  "valid": true,
  "identity": {
    "id": "uuid",
    "suffix": "@alice#a3f1",
    "entityType": "human",
    "displayName": "Alice",
    "roles": ["user"]
  }
}
```

**Response (401):**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

---

## 3. REST Endpoints

### 3.1 Conversations

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /conversations | List user's conversations | Required |
| POST | /conversations | Create a conversation | Required |
| GET | /conversations/:id | Get conversation details | Required (member) |
| PATCH | /conversations/:id | Update conversation metadata | Required (owner) |
| DELETE | /conversations/:id | Delete conversation | Required (owner) |
| POST | /conversations/:id/members | Add member to conversation | Required (owner) |
| DELETE | /conversations/:id/members/:userId | Remove member from conversation | Required (owner) |

#### GET /conversations

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `type` | string | all | Filter: `direct`, `group`, `agent_war_room`, `broadcast` |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "group",
      "name": "Project Alpha",
      "members": [
        { "id": "uuid", "suffix": "@alice#a3f1", "entityType": "human" },
        { "id": "uuid", "suffix": "@codebot.agent#7b2c", "entityType": "agent" }
      ],
      "lastMessage": {
        "id": "uuid",
        "content": "Hello!",
        "senderSuffix": "@alice#a3f1",
        "senderEntityType": "human",
        "createdAt": "2026-06-09T12:00:00Z"
      },
      "createdAt": "2026-06-09T12:00:00Z",
      "updatedAt": "2026-06-09T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### 3.2 Messages

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /conversations/:id/messages | List messages in conversation | Required (member) |
| POST | /conversations/:id/messages | Send a message | Required (member) |
| PATCH | /conversations/:id/messages/:messageId | Edit a message | Required (sender) |
| DELETE | /conversations/:id/messages/:messageId | Delete a message | Required (sender or admin) |
| POST | /conversations/:id/messages/:messageId/reactions | Add reaction | Required (member) |
| DELETE | /conversations/:id/messages/:messageId/reactions/:emoji | Remove reaction | Required (reactor) |

#### POST /conversations/:id/messages

**Request:**

```json
{
  "content": "Hello @codebot.agent#7b2c, can you review this code?",
  "type": "text",
  "mentions": ["@codebot.agent#7b2c"],
  "replyTo": "uuid-or-null"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "content": "Hello @codebot.agent#7b2c, can you review this code?",
  "type": "text",
  "senderSuffix": "@alice#a3f1",
  "senderEntityType": "human",
  "mentions": ["@codebot.agent#7b2c"],
  "reactions": [],
  "readBy": [],
  "replyTo": null,
  "createdAt": "2026-06-09T12:00:00Z",
  "editedAt": null
}
```

### 3.3 Channels

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /channels | List channels | Required |
| POST | /channels | Create channel | Required |
| GET | /channels/:id | Get channel details | Required (member or public) |
| PATCH | /channels/:id | Update channel | Required (owner) |
| POST | /channels/:id/join | Join a channel | Required |
| POST | /channels/:id/leave | Leave a channel | Required |

**Channel visibility types:** `public`, `private`, `agent_only`, `hybrid`

### 3.4 Agents

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /agents | List agents | Required |
| POST | /agents | Create agent | Required (human) |
| GET | /agents/:id | Get agent details | Required |
| PATCH | /agents/:id | Update agent | Required (owner or admin) |
| DELETE | /agents/:id | Revoke agent | Required (owner or admin) |
| GET | /agents/:id/manifest | Get agent manifest | Required |
| PATCH | /agents/:id/scope | Update agent scope | Required (admin) |
| GET | /agents/:id/activity | Get agent activity log | Required (owner or admin) |

### 3.5 Files

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /files/presign | Get presigned upload URL | Required |
| GET | /files/:id | Get file metadata | Required |
| GET | /files/:id/download | Get presigned download URL | Required (member) |
| DELETE | /files/:id | Delete file | Required (owner or admin) |

#### POST /files/presign

**Request:**

```json
{
  "fileName": "report.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 1048576,
  "conversationId": "uuid"
}
```

**Response (200):**

```json
{
  "fileId": "uuid",
  "uploadUrl": "https://minio:9000/kalen-files/uuid-report.pdf?X-Amz-...",
  "fields": {
    "key": "uuid-report.pdf",
    "bucket": "kalen-files"
  },
  "expiresIn": 300
}
```

### 3.6 Search

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /search | Full-text search | Required |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Search query |
| `type` | string | all | Filter: `messages`, `conversations`, `agents` |
| `conversationId` | uuid | null | Limit to conversation |
| `entityType` | string | all | Filter sender: `human`, `agent` |
| `from` | ISO date | null | Date range start |
| `to` | ISO date | null | Date range end |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page (max 50) |

### 3.7 Calls

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /calls | Create a call | Required |
| GET | /calls/:id | Get call details | Required |
| POST | /calls/:id/join | Join a call (get LiveKit token) | Required |
| POST | /calls/:id/leave | Leave a call | Required |
| DELETE | /calls/:id | End a call | Required (creator or admin) |

### 3.8 Presence

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /presence | Get online users | Required |
| PATCH | /presence | Update own presence status | Required |

### 3.9 Admin

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /admin/stats | System statistics | Admin |
| GET | /admin/agents | Agent governance list | Admin |
| PATCH | /admin/agents/:id | Approve/revoke/scope agent | Admin |
| GET | /admin/audit | Audit log with filters | Admin |
| PATCH | /admin/users/:id | Ban/suspend/role user | Admin |

### 3.10 MCP Gateway

**Status: Planned — not yet implemented**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /mcp/tools | List available tools | Required (agent) |
| POST | /mcp/invoke | Invoke a tool | Required (agent) |
| GET | /mcp/servers | List registered MCP servers | Required (admin) |
| POST | /mcp/servers | Register an MCP server | Admin |
| DELETE | /mcp/servers/:id | Remove MCP server | Admin |

#### POST /mcp/invoke

**Request:**

```json
{
  "toolId": "github.create_issue",
  "input": {
    "repository": "mulkymalikuldhr/kalen",
    "title": "Bug: Authentication fails",
    "body": "Description of the issue..."
  },
  "requestId": "uuid"
}
```

**Response (200):**

```json
{
  "requestId": "uuid",
  "toolId": "github.create_issue",
  "output": {
    "issueNumber": 42,
    "issueUrl": "https://github.com/mulkymalikuldhr/kalen/issues/42"
  },
  "isError": false,
  "traceId": "uuid",
  "durationMs": 342
}
```

---

## 4. WebSocket Events

**Status: Planned — not yet implemented**

WebSocket connections are established at:

```
ws://localhost:4000/events
```

Or via the Traefik gateway:

```
wss://kalen.example.com/events
```

### 4.1 Connection

1. Client connects to the WebSocket endpoint
2. Client sends authentication message with JWT
3. Server validates token and confirms connection
4. Client subscribes to conversation/channel events

### 4.2 Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth` | `{ token: "jwt" }` | Authenticate the WebSocket connection |
| `subscribe` | `{ conversationId: "uuid" }` | Subscribe to conversation events |
| `unsubscribe` | `{ conversationId: "uuid" }` | Unsubscribe from conversation events |
| `typing` | `{ conversationId: "uuid" }` | Indicate user is typing |
| `presence` | `{ status: "online" \| "away" \| "dnd" }` | Update presence status |

### 4.3 Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth:success` | `{ identity: {...} }` | Authentication confirmed |
| `auth:failure` | `{ error: "..." }` | Authentication failed |
| `message:created` | `{ message: {...} }` | New message in subscribed conversation |
| `message:updated` | `{ message: {...} }` | Message edited |
| `message:deleted` | `{ messageId: "uuid" }` | Message deleted |
| `message:reaction` | `{ messageId, emoji, userSuffix, action: "add" \| "remove" }` | Reaction added/removed |
| `typing:start` | `{ conversationId, userSuffix }` | User started typing |
| `typing:stop` | `{ conversationId, userSuffix }` | User stopped typing |
| `presence:update` | `{ userSuffix, status }` | Presence status changed |
| `read:receipt` | `{ conversationId, messageId, userSuffix }` | Message read by user |
| `conversation:updated` | `{ conversation: {...} }` | Conversation metadata changed |
| `conversation:member_added` | `{ conversationId, member: {...} }` | New member added |
| `conversation:member_removed` | `{ conversationId, memberSuffix }` | Member removed |
| `call:incoming` | `{ callId, callerSuffix, type: "audio" \| "video" }` | Incoming call |
| `agent:action` | `{ agentSuffix, action, target, timestamp }` | Agent performed an action |
| `error` | `{ code: "...", message: "..." }` | Error event |

### 4.4 Reconnection Protocol

1. Client detects WebSocket disconnect
2. Client waits 1 second, then attempts reconnection (exponential backoff, max 30s)
3. On reconnect, client re-authenticates with JWT
4. Server sends missed events since last known `messageId` (catch-up)
5. Client resumes normal event processing

---

## 5. A2A Protocol Endpoints

**Status: Planned — not yet implemented**

The A2A Router implements the [Agent-to-Agent Protocol](https://github.com/google/A2A) specification using JSON-RPC 2.0 over HTTP.

### 5.1 A2A Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `tasks/send` | POST /a2a | Submit a task to a remote agent |
| `tasks/get` | POST /a2a | Retrieve task status and result |
| `tasks/cancel` | POST /a2a | Cancel an in-progress task |
| `tasks/sendSubscribe` | POST /a2a | Submit a task and stream updates via SSE |
| `tasks/list` | POST /a2a | List tasks for an agent |

### 5.2 Agent Card Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/.well-known/agent.json` | Agent Card for the specified agent |

### 5.3 A2A Request Format

All A2A requests use JSON-RPC 2.0:

```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-uuid",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Review the code in src/auth.ts"
        }
      ]
    }
  },
  "id": 1
}
```

### 5.4 A2A Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "task-uuid",
    "status": {
      "state": "working",
      "timestamp": "2026-06-09T12:00:00Z"
    },
    "artifacts": []
  },
  "id": 1
}
```

### 5.5 Task States

```
submitted → working → completed
                    → failed
                    → canceled
                    → input-required → working (after user input)
```

---

## 6. Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "displayName",
        "message": "Agent display name must end with (ai)"
      }
    ]
  },
  "requestId": "uuid",
  "timestamp": "2026-06-09T12:00:00Z"
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Request body or query params failed validation |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication token |
| 403 | `FORBIDDEN` | Authenticated but not authorized for this resource |
| 403 | `INSUFFICIENT_SCOPE` | Agent lacks required scope for this action |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource already exists (e.g., duplicate email) |
| 422 | `SUFFIX_VIOLATION` | Agent name does not end with `(ai)` |
| 429 | `RATE_LIMITED` | Too many requests; retry after indicated time |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | Dependency service (DB, Redis, NATS) is down |

### A2A Error Codes (JSON-RPC 2.0)

| Code | Meaning |
|------|---------|
| -32700 | Parse error — invalid JSON |
| -32600 | Invalid request — missing required fields |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32001 | Task not found |
| -32002 | Task not cancelable |
| -32003 | Agent not found |
| -32004 | Agent card verification failed |

---

## 7. Rate Limiting

**Status: Planned — not yet implemented**

### Global Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | per minute per IP |
| Message send | 60 messages | per minute per user |
| Message send (agent) | 100 messages | per minute per agent |
| Search | 30 queries | per minute per user |
| File upload | 10 uploads | per minute per user |
| MCP tool invoke | 100 invocations | per minute per agent |
| A2A tasks/send | 50 tasks | per minute per agent |
| General API | 300 requests | per minute per user |

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1686316800
Retry-After: 30  (only on 429 responses)
```

### Rate Limit Exceeded Response (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Retry after 30 seconds.",
    "retryAfter": 30
  },
  "requestId": "uuid",
  "timestamp": "2026-06-09T12:00:00Z"
}
```

---

## 8. Pagination

### Paginated Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Query Parameters

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | integer | 1 | — |
| `limit` | integer | 20 | 100 |

---

## 9. Versioning

The API uses URL-based versioning: `/api/v1/...`

- **Breaking changes** will increment the major version (`v1` → `v2`)
- **Non-breaking additions** (new endpoints, new optional fields) will be made within the same version
- **Deprecated endpoints** will be marked with a `Sunset` header and documented in CHANGELOG for at least one major version before removal
- **Multiple versions** may be supported simultaneously during transition periods

---

## Implementation Progress Tracker

| Endpoint Group | Phase | Status |
|---------------|-------|--------|
| Auth (WebAuthn) | Phase 1 | Planned |
| Auth (Agent) | Phase 1 | Planned |
| Auth (Verify/Refresh) | Phase 1 | Planned |
| Conversations | Phase 2 | Planned |
| Messages | Phase 2 | Planned |
| Channels | Phase 2 | Planned |
| Files | Phase 2 | Planned |
| Search | Phase 2 | Planned |
| Agents | Phase 1 | Planned |
| Calls | Phase 5 | Planned |
| Presence | Phase 5 | Planned |
| Admin | Phase 2 | Planned |
| MCP Gateway | Phase 3 | Planned |
| A2A Protocol | Phase 4 | Planned |
| WebSocket Events | Phase 2 | Planned |

This tracker will be updated as endpoints are implemented. An endpoint's status will change from "Planned" to "Implemented in vX.Y.Z" when it is available in a release.
