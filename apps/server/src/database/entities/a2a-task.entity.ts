/**
 * KALEN Server — A2A Task Entity
 * Records of A2A tasks for agent-to-agent coordination.
 * Status enum matches TaskStatus from @kalen/shared.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AgentEntity } from './agent.entity';

/** Task states per A2A protocol — matches @kalen/shared TaskStatus */
export enum A2ATaskStatus {
  SUBMITTED = 'submitted',
  WORKING = 'working',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
  INPUT_REQUIRED = 'input_required',
}

@Entity('a2a_tasks')
export class A2aTaskEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Unique task ID for external reference — indexed */
  @Index({ unique: true })
  @Column({ name: 'task_id', unique: true })
  taskId: string;

  /** Current task status */
  @Column({ type: 'enum', enum: A2ATaskStatus, default: A2ATaskStatus.SUBMITTED })
  status: A2ATaskStatus;

  /** Status message */
  @Column({ name: 'status_message', nullable: true })
  statusMessage: string | null;

  /** Agent that sent this task */
  @Index()
  @Column({ name: 'sender_agent_id', type: 'uuid' })
  senderAgentId: string;

  @ManyToOne(() => AgentEntity, { nullable: true })
  @JoinColumn({ name: 'sender_agent_id' })
  senderAgent: AgentEntity | null;

  /** Agent that is receiving/handling this task */
  @Index()
  @Column({ name: 'receiver_agent_id', type: 'uuid', nullable: true })
  receiverAgentId: string | null;

  @ManyToOne(() => AgentEntity, { nullable: true })
  @JoinColumn({ name: 'receiver_agent_id' })
  receiverAgent: AgentEntity | null;

  /** Task description */
  @Column({ type: 'text' })
  description: string;

  /** Agent assigned to this task (legacy field) */
  @Column({ name: 'assigned_agent_id', type: 'uuid', nullable: true })
  assignedAgentId: string | null;

  /** Entity that created the task (legacy field) */
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  /** Creator kind (legacy field) */
  @Column({ name: 'creator_kind', default: 'agent' })
  creatorKind: 'human' | 'agent';

  /** Task messages (JSONB array) */
  @Column({ type: 'jsonb', default: '[]' })
  messages: Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
    timestamp: string;
  }>;

  /** Task artifacts (JSONB) */
  @Column({ type: 'jsonb', default: '[]' })
  artifacts: Array<{
    id: string;
    type: string;
    parts: Array<unknown>;
    createdAt: string;
  }>;

  /** Task history (state transitions) */
  @Column({ type: 'jsonb', default: '[]' })
  history: Array<{
    status: string;
    message: string;
    timestamp: string;
  }>;

  /** Parent task ID (for delegation chains) */
  @Column({ name: 'parent_task_id', type: 'uuid', nullable: true })
  parentTaskId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
