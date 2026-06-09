/**
 * KALEN Server — MCP Call Entity
 * Records of MCP tool invocations for audit and billing.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AgentEntity } from './agent.entity';

/** MCP call status enum */
export enum McpCallStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

@Entity('mcp_calls')
export class McpCallEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Agent that made the call — indexed for per-agent query */
  @Index()
  @Column({ name: 'agent_id', type: 'uuid', nullable: true })
  agentId: string | null;

  @ManyToOne(() => AgentEntity, { nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent: AgentEntity | null;

  /** MCP server name */
  @Column({ name: 'server_name', nullable: true })
  serverName: string | null;

  /** Tool name invoked */
  @Column({ name: 'tool_name' })
  toolName: string;

  /** Legacy: server_id kept for backward compat */
  @Column({ name: 'server_id', nullable: true })
  serverId: string | null;

  /** Caller ID */
  @Column({ name: 'caller_id', type: 'uuid' })
  callerId: string;

  /** Caller kind */
  @Column({ name: 'caller_kind', default: 'agent' })
  callerKind: 'human' | 'agent';

  /** Tool input arguments (JSONB) */
  @Column({ type: 'jsonb', default: '{}' })
  arguments: Record<string, unknown>;

  /** Legacy: input column kept for backward compat */
  @Column({ type: 'jsonb', default: '{}' })
  input: Record<string, unknown>;

  /** Tool output / result (JSONB) */
  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  /** Legacy: output column kept for backward compat */
  @Column({ type: 'jsonb', nullable: true })
  output: Record<string, unknown> | null;

  /** Call status */
  @Column({ type: 'enum', enum: McpCallStatus, default: McpCallStatus.PENDING })
  status: McpCallStatus;

  /** Whether the call resulted in an error (legacy) */
  @Column({ name: 'is_error', default: false })
  isError: boolean;

  /** Error message (if error) */
  @Column({ name: 'error_message', nullable: true })
  errorMessage: string | null;

  /** Access decision */
  @Column({ name: 'access_decision', default: 'allowed' })
  accessDecision: 'allowed' | 'denied';

  /** Denial reason */
  @Column({ name: 'denial_reason', nullable: true })
  denialReason: string | null;

  /** Duration in milliseconds */
  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number | null;

  /** Request ID */
  @Column({ name: 'request_id', nullable: true })
  requestId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
