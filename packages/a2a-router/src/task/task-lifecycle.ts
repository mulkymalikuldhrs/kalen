/**
 * KALEN A2A Task Lifecycle
 * Task state machine with validated state transitions.
 */

import type { A2ATask, A2AArtifact, A2AMessage, TaskStateTransition } from "@kalen/shared";
import { TaskStatus, VALID_TRANSITIONS, MAX_ARTIFACTS_PER_TASK, MAX_MESSAGES_PER_TASK } from "@kalen/shared";

/** Result of a task state transition */
export interface TaskTransitionResult {
  success: boolean;
  task: A2ATask;
  error?: string;
}

/**
 * Task Lifecycle — manages A2A task state transitions.
 *
 * State machine:
 *   SUBMITTED → WORKING → COMPLETED
 *                       → FAILED
 *                       → CANCELED
 *                       → INPUT_REQUIRED → WORKING
 *                                       → CANCELED
 *   SUBMITTED → CANCELED
 *   SUBMITTED → FAILED
 *
 * Terminal states: COMPLETED, FAILED, CANCELED
 */
export class TaskLifecycle {
  /**
   * Transition a task to a new status.
   * Validates the transition against the state machine rules.
   *
   * @param task - The current task
   * @param newStatus - The target status
   * @param message - Optional reason/message for the transition
   * @returns Transition result with updated task or error
   */
  transitionTask(task: A2ATask, newStatus: TaskStatus, message?: string): TaskTransitionResult {
    const currentStatus = task.status;

    // Same status is a no-op
    if (currentStatus === newStatus) {
      return { success: true, task };
    }

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      return {
        success: false,
        task,
        error: `Invalid state transition: ${currentStatus} → ${newStatus}. Allowed: [${allowedTransitions.join(", ")}]`,
      };
    }

    // Apply the transition
    const transition: TaskStateTransition = {
      status: newStatus,
      message,
      timestamp: new Date().toISOString(),
    };

    const updatedTask: A2ATask = {
      ...task,
      status: newStatus,
      statusMessage: message,
      history: [...task.history, transition],
      updatedAt: transition.timestamp,
    };

    return { success: true, task: updatedTask };
  }

  /**
   * Add an artifact to a task.
   *
   * @param task - The task
   * @param artifact - The artifact to add
   * @returns Updated task with the artifact
   */
  addArtifact(task: A2ATask, artifact: A2AArtifact): A2ATask {
    if (task.artifacts.length >= MAX_ARTIFACTS_PER_TASK) {
      throw new Error(`Task has reached the maximum artifacts limit (${MAX_ARTIFACTS_PER_TASK})`);
    }

    return {
      ...task,
      artifacts: [...task.artifacts, artifact],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add a message to a task.
   *
   * @param task - The task
   * @param message - The message to add
   * @returns Updated task with the message
   */
  addMessage(task: A2ATask, message: A2AMessage): A2ATask {
    if (task.messages.length >= MAX_MESSAGES_PER_TASK) {
      throw new Error(`Task has reached the maximum messages limit (${MAX_MESSAGES_PER_TASK})`);
    }

    return {
      ...task,
      messages: [...task.messages, message],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if a task is in a terminal state.
   */
  isTerminal(task: A2ATask): boolean {
    return this.isTerminalStatus(task.status);
  }

  /**
   * Check if a status is terminal.
   */
  isTerminalStatus(status: TaskStatus): boolean {
    return status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELED;
  }

  /**
   * Get valid transitions from a given status.
   */
  getValidTransitions(status: TaskStatus): TaskStatus[] {
    return VALID_TRANSITIONS[status] ?? [];
  }

  /**
   * Create an initial task in SUBMITTED state.
   *
   * @param id - Task ID
   * @param createdBy - Creator entity ID
   * @param assignedAgentId - Assigned agent ID
   * @param initialMessage - Optional initial message
   * @returns New task in SUBMITTED state
   */
  createInitialTask(
    id: string,
    createdBy: string,
    assignedAgentId?: string,
    initialMessage?: A2AMessage,
  ): A2ATask {
    const now = new Date().toISOString();

    return {
      id,
      status: TaskStatus.SUBMITTED,
      statusMessage: "Task submitted",
      artifacts: [],
      messages: initialMessage ? [initialMessage] : [],
      history: [
        {
          status: TaskStatus.SUBMITTED,
          message: "Task created",
          timestamp: now,
        },
      ],
      assignedAgentId,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }
}
