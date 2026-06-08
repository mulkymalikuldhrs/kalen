/**
 * KALEN A2A Router Service
 * Route A2A messages between agents, manage discovery, tasks, and delegation.
 */

import type {
  AgentCard,
  A2ATask,
  A2AMessage,
  A2AArtifact,
  TaskStateTransition,
} from "@kalen/shared";
import { TaskStatus, VALID_TRANSITIONS, A2A_DISCOVERY_TIMEOUT, A2A_TASK_TIMEOUT } from "@kalen/shared";
import { AgentCardService } from "../agent-card/agent-card-service";
import { TaskLifecycle, type TaskTransitionResult } from "../task/task-lifecycle";

/** A2A Router configuration */
export interface A2ARouterConfig {
  /** Discovery cache TTL in seconds */
  discoveryCacheTTL: number;
  /** Maximum concurrent tasks per agent */
  maxTasksPerAgent: number;
  /** Task timeout in milliseconds */
  taskTimeout: number;
}

const DEFAULT_ROUTER_CONFIG: A2ARouterConfig = {
  discoveryCacheTTL: 300,
  maxTasksPerAgent: 100,
  taskTimeout: A2A_TASK_TIMEOUT,
};

/** Stored task with metadata */
interface StoredTask {
  task: A2ATask;
  assignedCard: AgentCard | null;
}

/**
 * A2A Router Service — central routing hub for agent-to-agent communication.
 *
 * Handles:
 * - Agent discovery and card resolution
 * - Task creation, delegation, and cancellation
 * - Message routing between agents
 * - Task state management
 */
export class A2ARouterService {
  private config: A2ARouterConfig;
  private cardService: AgentCardService;
  private taskLifecycle: TaskLifecycle;
  private tasks: Map<string, StoredTask> = new Map();
  private agentTaskCounts: Map<string, number> = new Map();

  constructor(
    cardService: AgentCardService,
    config?: Partial<A2ARouterConfig>,
  ) {
    this.config = { ...DEFAULT_ROUTER_CONFIG, ...config };
    this.cardService = cardService;
    this.taskLifecycle = new TaskLifecycle();
  }

  /**
   * Discover an agent by resolving its Agent Card.
   *
   * @param agentUrl - The agent's URL or identifier
   * @returns The resolved Agent Card
   */
  async discoverAgent(agentUrl: string): Promise<AgentCard> {
    const cached = this.cardService.getCardByUrl(agentUrl);
    if (cached) {
      return cached;
    }

    const card = await this.cardService.fetchAndCacheCard(agentUrl, this.config.discoveryCacheTTL);
    return card;
  }

  /**
   * Create a new A2A task.
   *
   * @param agentId - Target agent for the task
   * @param createdBy - Entity creating the task
   * @param initialMessage - Initial task message
   * @returns The created task
   */
  async createTask(
    agentId: string,
    createdBy: string,
    initialMessage: A2AMessage,
  ): Promise<A2ATask> {
    // Check agent task limit
    const currentCount = this.agentTaskCounts.get(agentId) ?? 0;
    if (currentCount >= this.config.maxTasksPerAgent) {
      throw new Error(`Agent "${agentId}" has reached the maximum concurrent task limit (${this.config.maxTasksPerAgent})`);
    }

    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    const task: A2ATask = {
      id: taskId,
      status: TaskStatus.SUBMITTED,
      statusMessage: "Task submitted",
      artifacts: [],
      messages: [initialMessage],
      history: [
        {
          status: TaskStatus.SUBMITTED,
          message: "Task created",
          timestamp: now,
        },
      ],
      assignedAgentId: agentId,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const card = this.cardService.getCardByUrl(agentId) ?? null;

    this.tasks.set(taskId, { task, assignedCard: card });
    this.agentTaskCounts.set(agentId, currentCount + 1);

    return task;
  }

  /**
   * Delegate a task to another agent.
   * Creates a new task on the target agent and links it to the original.
   *
   * @param taskId - Original task ID
   * @param targetAgentId - Agent to delegate to
   * @param delegationMessage - Message explaining the delegation
   * @returns The new delegated task
   */
  async delegateTask(
    taskId: string,
    targetAgentId: string,
    delegationMessage: A2AMessage,
  ): Promise<A2ATask> {
    const stored = this.tasks.get(taskId);
    if (!stored) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const originalTask = stored.task;

    // Create a new task for the target agent
    const delegatedTask = await this.createTask(
      targetAgentId,
      originalTask.assignedAgentId ?? originalTask.createdBy,
      delegationMessage,
    );

    // Update the original task's history
    const now = new Date().toISOString();
    originalTask.messages.push({
      role: "agent",
      parts: [
        {
          type: "text",
          text: `Task delegated to agent ${targetAgentId}. Delegated task ID: ${delegatedTask.id}`,
        },
      ],
      timestamp: now,
    });
    originalTask.updatedAt = now;

    return delegatedTask;
  }

  /**
   * Cancel a task.
   *
   * @param taskId - Task to cancel
   * @param cancelledBy - Entity cancelling the task
   * @param reason - Cancellation reason
   * @returns Updated task
   */
  async cancelTask(
    taskId: string,
    cancelledBy: string,
    reason?: string,
  ): Promise<A2ATask> {
    const stored = this.tasks.get(taskId);
    if (!stored) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const result = this.taskLifecycle.transitionTask(
      stored.task,
      TaskStatus.CANCELED,
      reason ?? `Cancelled by ${cancelledBy}`,
    );

    if (!result.success) {
      throw new Error(result.error ?? "Invalid state transition");
    }

    stored.task = result.task;
    this.decrementAgentTaskCount(stored.task.assignedAgentId);

    return stored.task;
  }

  /**
   * Get a task by ID.
   */
  getTask(taskId: string): A2ATask | null {
    const stored = this.tasks.get(taskId);
    return stored?.task ?? null;
  }

  /**
   * Add a message to a task.
   *
   * @param taskId - Target task
   * @param message - Message to add
   * @returns Updated task
   */
  addTaskMessage(taskId: string, message: A2AMessage): A2ATask {
    const stored = this.tasks.get(taskId);
    if (!stored) {
      throw new Error(`Task "${taskId}" not found`);
    }

    stored.task.messages.push(message);
    stored.task.updatedAt = new Date().toISOString();

    return stored.task;
  }

  /**
   * Transition a task's state.
   *
   * @param taskId - Target task
   * @param newStatus - New status
   * @param message - Transition message
   * @returns Updated task
   */
  transitionTask(taskId: string, newStatus: TaskStatus, message?: string): A2ATask {
    const stored = this.tasks.get(taskId);
    if (!stored) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const result = this.taskLifecycle.transitionTask(stored.task, newStatus, message);
    if (!result.success) {
      throw new Error(result.error ?? "Invalid state transition");
    }

    stored.task = result.task;

    // Decrement agent task count if task is terminal
    if (this.isTerminalStatus(newStatus)) {
      this.decrementAgentTaskCount(stored.task.assignedAgentId);
    }

    return stored.task;
  }

  /**
   * Add an artifact to a task.
   *
   * @param taskId - Target task
   * @param artifact - Artifact to add
   * @returns Updated task
   */
  addTaskArtifact(taskId: string, artifact: A2AArtifact): A2ATask {
    const stored = this.tasks.get(taskId);
    if (!stored) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const result = this.taskLifecycle.addArtifact(stored.task, artifact);
    stored.task = result;

    return stored.task;
  }

  /**
   * List tasks for an agent.
   */
  listTasksForAgent(agentId: string): A2ATask[] {
    const result: A2ATask[] = [];
    for (const [, stored] of this.tasks.entries()) {
      if (stored.task.assignedAgentId === agentId) {
        result.push(stored.task);
      }
    }
    return result;
  }

  /**
   * List tasks created by an entity.
   */
  listTasksByCreator(createdBy: string): A2ATask[] {
    const result: A2ATask[] = [];
    for (const [, stored] of this.tasks.entries()) {
      if (stored.task.createdBy === createdBy) {
        result.push(stored.task);
      }
    }
    return result;
  }

  private isTerminalStatus(status: TaskStatus): boolean {
    return status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELED;
  }

  private decrementAgentTaskCount(agentId?: string): void {
    if (!agentId) return;
    const count = this.agentTaskCounts.get(agentId) ?? 0;
    this.agentTaskCounts.set(agentId, Math.max(0, count - 1));
  }
}
