/**
 * KALEN Server — Initial Schema Migration
 * Creates all tables with proper constraints, indexes, and foreign keys.
 * Supports both PostgreSQL (production) and SQLite (development fallback).
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Users table ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                UUID PRIMARY KEY,
        "username"          VARCHAR NOT NULL,
        "display_name"      VARCHAR NOT NULL,
        "email"             VARCHAR NOT NULL,
        "suffix"            VARCHAR NOT NULL,
        "kind"              VARCHAR NOT NULL DEFAULT 'human',
        "webauthn_credentials" JSONB NOT NULL DEFAULT '[]',
        "credentials"       JSONB NOT NULL DEFAULT '[]',
        "recovery_hash"     VARCHAR,
        "role"              VARCHAR NOT NULL DEFAULT 'human_user',
        "status"            VARCHAR NOT NULL DEFAULT 'active',
        "active"            BOOLEAN NOT NULL DEFAULT TRUE,
        "avatar_url"        VARCHAR,
        "public_key"        TEXT,
        "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "last_auth_at"      TIMESTAMP
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_suffix" ON "users" ("suffix")`);

    // ── Agents table ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "agents" (
        "id"                UUID PRIMARY KEY,
        "name"              VARCHAR NOT NULL,
        "display_name"      VARCHAR NOT NULL,
        "suffix"            VARCHAR NOT NULL,
        "public_key"        TEXT NOT NULL,
        "key_algorithm"     VARCHAR NOT NULL DEFAULT 'Ed25519',
        "agent_card_url"    VARCHAR,
        "capabilities"      JSONB NOT NULL DEFAULT '{}',
        "manifest"          JSONB,
        "scopes"            TEXT NOT NULL DEFAULT '',
        "role"              VARCHAR NOT NULL DEFAULT 'agent_basic',
        "status"            VARCHAR NOT NULL DEFAULT 'active',
        "owner_id"          UUID NOT NULL,
        "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "last_active_at"    TIMESTAMP,
        "last_seen_at"      TIMESTAMP,
        CONSTRAINT "FK_agents_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_agents_name" ON "agents" ("name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_agents_suffix" ON "agents" ("suffix")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_owner_id" ON "agents" ("owner_id")`);

    // ── Rooms table ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id"                UUID PRIMARY KEY,
        "type"              VARCHAR NOT NULL DEFAULT 'group',
        "name"              VARCHAR,
        "description"       VARCHAR,
        "created_by_id"     UUID NOT NULL,
        "creator_type"      VARCHAR NOT NULL DEFAULT 'human',
        "visibility"        VARCHAR NOT NULL DEFAULT 'private',
        "status"            VARCHAR NOT NULL DEFAULT 'active',
        "metadata"          JSONB NOT NULL DEFAULT '{}',
        "members"           JSONB NOT NULL DEFAULT '[]',
        "created_by"        UUID,
        "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "last_activity_at"  TIMESTAMP
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_rooms_created_by_id" ON "rooms" ("created_by_id")`);

    // ── Room Members table ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "room_members" (
        "id"                UUID PRIMARY KEY,
        "room_id"           UUID NOT NULL,
        "member_id"         UUID NOT NULL,
        "member_type"       VARCHAR NOT NULL DEFAULT 'human',
        "role"              VARCHAR NOT NULL DEFAULT 'member',
        "joined_at"         TIMESTAMP NOT NULL DEFAULT NOW(),
        "last_read_at"      TIMESTAMP,
        CONSTRAINT "FK_room_members_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_room_members_user" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_room_members_agent" FOREIGN KEY ("member_id") REFERENCES "agents"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_room_members_room_member_type" ON "room_members" ("room_id", "member_id", "member_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_room_members_room_id" ON "room_members" ("room_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_room_members_member_id" ON "room_members" ("member_id")`);

    // ── Messages table ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id"                UUID PRIMARY KEY,
        "room_id"           UUID NOT NULL,
        "sender_id"         UUID NOT NULL,
        "sender_type"       VARCHAR NOT NULL DEFAULT 'human',
        "content_type"      VARCHAR NOT NULL DEFAULT 'text',
        "content"           TEXT NOT NULL,
        "metadata"          JSONB,
        "reply_to_id"       UUID,
        "sender_kind"       VARCHAR NOT NULL DEFAULT 'human',
        "sender_suffix"     VARCHAR,
        "reply_to"          UUID,
        "mentions"          TEXT,
        "reactions"         JSONB NOT NULL DEFAULT '{}',
        "read_by"           TEXT NOT NULL DEFAULT '',
        "deleted"           BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "edited_at"         TIMESTAMP,
        CONSTRAINT "FK_messages_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_reply_to" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_messages_room_id" ON "messages" ("room_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_sender_id" ON "messages" ("sender_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_created_at" ON "messages" ("created_at")`);

    // ── Audit Logs table ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"                UUID PRIMARY KEY,
        "actor_id"          UUID NOT NULL,
        "actor_type"        VARCHAR NOT NULL DEFAULT 'human',
        "actor_kind"        VARCHAR NOT NULL DEFAULT 'human',
        "actor_suffix"      VARCHAR,
        "action"            VARCHAR NOT NULL,
        "target_type"       VARCHAR,
        "target_id"         UUID,
        "resource_type"     VARCHAR,
        "resource_id"       VARCHAR,
        "details"           JSONB NOT NULL DEFAULT '{}',
        "metadata"          JSONB NOT NULL DEFAULT '{}',
        "request_id"        VARCHAR,
        "trace_id"          VARCHAR,
        "ip_address"        VARCHAR,
        "user_agent"        VARCHAR,
        "access_decision"   VARCHAR NOT NULL DEFAULT 'allowed',
        "denial_reason"     VARCHAR,
        "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_audit_logs_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor_id" ON "audit_logs" ("actor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`);

    // ── MCP Calls table ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "mcp_calls" (
        "id"                UUID PRIMARY KEY,
        "agent_id"          UUID,
        "server_name"       VARCHAR,
        "tool_name"         VARCHAR NOT NULL,
        "server_id"         VARCHAR,
        "caller_id"         UUID NOT NULL,
        "caller_kind"       VARCHAR NOT NULL DEFAULT 'agent',
        "arguments"         JSONB NOT NULL DEFAULT '{}',
        "input"             JSONB NOT NULL DEFAULT '{}',
        "result"            JSONB,
        "output"            JSONB,
        "status"            VARCHAR NOT NULL DEFAULT 'pending',
        "is_error"          BOOLEAN NOT NULL DEFAULT FALSE,
        "error_message"     VARCHAR,
        "access_decision"   VARCHAR NOT NULL DEFAULT 'allowed',
        "denial_reason"     VARCHAR,
        "duration_ms"       INTEGER,
        "request_id"        VARCHAR,
        "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_mcp_calls_agent" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_mcp_calls_agent_id" ON "mcp_calls" ("agent_id")`);

    // ── A2A Tasks table ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "a2a_tasks" (
        "id"                  UUID PRIMARY KEY,
        "task_id"             VARCHAR NOT NULL,
        "status"              VARCHAR NOT NULL DEFAULT 'submitted',
        "status_message"      VARCHAR,
        "sender_agent_id"     UUID NOT NULL,
        "receiver_agent_id"   UUID,
        "description"         TEXT NOT NULL,
        "assigned_agent_id"   UUID,
        "created_by"          UUID,
        "creator_kind"        VARCHAR NOT NULL DEFAULT 'agent',
        "messages"            JSONB NOT NULL DEFAULT '[]',
        "artifacts"           JSONB NOT NULL DEFAULT '[]',
        "history"             JSONB NOT NULL DEFAULT '[]',
        "parent_task_id"      UUID,
        "created_at"          TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_a2a_tasks_sender_agent" FOREIGN KEY ("sender_agent_id") REFERENCES "agents"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_a2a_tasks_receiver_agent" FOREIGN KEY ("receiver_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a2a_tasks_task_id" ON "a2a_tasks" ("task_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_a2a_tasks_sender_agent_id" ON "a2a_tasks" ("sender_agent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_a2a_tasks_receiver_agent_id" ON "a2a_tasks" ("receiver_agent_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order to respect FK constraints
    await queryRunner.query(`DROP TABLE IF EXISTS "a2a_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mcp_calls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "room_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
