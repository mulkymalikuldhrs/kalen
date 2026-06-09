/**
 * @kalen/a2a-router — Task Lifecycle Tests
 */
import { TaskLifecycle, type TaskTransitionResult } from "../task/task-lifecycle";
import { TaskStatus, VALID_TRANSITIONS } from "@kalen/shared";
import type { A2ATask, A2AArtifact, A2AMessage } from "@kalen/shared";

describe("TaskLifecycle", () => {
  let lifecycle: TaskLifecycle;

  beforeEach(() => {
    lifecycle = new TaskLifecycle();
  });

  // Helper to create a minimal task
  function createTask(status: TaskStatus = TaskStatus.SUBMITTED): A2ATask {
    return {
      id: "task-1",
      status,
      statusMessage: "Test task",
      artifacts: [],
      messages: [],
      history: [{ status, message: "Created", timestamp: new Date().toISOString() }],
      assignedAgentId: "agent-1",
      createdBy: "user-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  describe("createInitialTask", () => {
    it("creates a task in SUBMITTED state", () => {
      const task = lifecycle.createInitialTask("task-1", "user-1", "agent-1");
      expect(task.id).toBe("task-1");
      expect(task.status).toBe(TaskStatus.SUBMITTED);
      expect(task.createdBy).toBe("user-1");
      expect(task.assignedAgentId).toBe("agent-1");
      expect(task.artifacts).toEqual([]);
      expect(task.history).toHaveLength(1);
      expect(task.history[0].status).toBe(TaskStatus.SUBMITTED);
    });

    it("includes initial message when provided", () => {
      const message: A2AMessage = {
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
        timestamp: new Date().toISOString(),
      };
      const task = lifecycle.createInitialTask("task-1", "user-1", "agent-1", message);
      expect(task.messages).toHaveLength(1);
      expect(task.messages[0].parts[0].text).toBe("Hello");
    });

    it("has empty messages when no initial message provided", () => {
      const task = lifecycle.createInitialTask("task-1", "user-1");
      expect(task.messages).toHaveLength(0);
    });
  });

  describe("transitionTask — valid transitions", () => {
    it("SUBMITTED → WORKING", () => {
      const task = createTask(TaskStatus.SUBMITTED);
      const result = lifecycle.transitionTask(task, TaskStatus.WORKING, "Starting work");
      expect(result.success).toBe(true);
      expect(result.task.status).toBe(TaskStatus.WORKING);
      expect(result.task.statusMessage).toBe("Starting work");
      expect(result.task.history).toHaveLength(2);
    });

    it("SUBMITTED → CANCELED", () => {
      const task = createTask(TaskStatus.SUBMITTED);
      const result = lifecycle.transitionTask(task, TaskStatus.CANCELED, "Cancelled by user");
      expect(result.success).toBe(true);
      expect(result.task.status).toBe(TaskStatus.CANCELED);
    });

    it("SUBMITTED → FAILED", () => {
      const task = createTask(TaskStatus.SUBMITTED);
      const result = lifecycle.transitionTask(task, TaskStatus.FAILED, "Failed immediately");
      expect(result.success).toBe(true);
    });

    it("WORKING → COMPLETED", () => {
      const task = createTask(TaskStatus.WORKING);
      const result = lifecycle.transitionTask(task, TaskStatus.COMPLETED, "Done");
      expect(result.success).toBe(true);
      expect(result.task.status).toBe(TaskStatus.COMPLETED);
    });

    it("WORKING → FAILED", () => {
      const task = createTask(TaskStatus.WORKING);
      const result = lifecycle.transitionTask(task, TaskStatus.FAILED, "Error occurred");
      expect(result.success).toBe(true);
    });

    it("WORKING → CANCELED", () => {
      const task = createTask(TaskStatus.WORKING);
      const result = lifecycle.transitionTask(task, TaskStatus.CANCELED);
      expect(result.success).toBe(true);
    });

    it("WORKING → INPUT_REQUIRED", () => {
      const task = createTask(TaskStatus.WORKING);
      const result = lifecycle.transitionTask(task, TaskStatus.INPUT_REQUIRED, "Need more info");
      expect(result.success).toBe(true);
    });

    it("INPUT_REQUIRED → WORKING", () => {
      const task = createTask(TaskStatus.INPUT_REQUIRED);
      const result = lifecycle.transitionTask(task, TaskStatus.WORKING, "Input provided");
      expect(result.success).toBe(true);
    });

    it("INPUT_REQUIRED → CANCELED", () => {
      const task = createTask(TaskStatus.INPUT_REQUIRED);
      const result = lifecycle.transitionTask(task, TaskStatus.CANCELED);
      expect(result.success).toBe(true);
    });

    it("same-status transition is a no-op", () => {
      const task = createTask(TaskStatus.SUBMITTED);
      const result = lifecycle.transitionTask(task, TaskStatus.SUBMITTED);
      expect(result.success).toBe(true);
      expect(result.task).toBe(task); // same reference
    });
  });

  describe("transitionTask — invalid transitions", () => {
    it("SUBMITTED → COMPLETED is invalid", () => {
      const task = createTask(TaskStatus.SUBMITTED);
      const result = lifecycle.transitionTask(task, TaskStatus.COMPLETED);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid state transition");
      expect(result.task.status).toBe(TaskStatus.SUBMITTED); // unchanged
    });

    it("SUBMITTED → INPUT_REQUIRED is invalid", () => {
      const task = createTask(TaskStatus.SUBMITTED);
      const result = lifecycle.transitionTask(task, TaskStatus.INPUT_REQUIRED);
      expect(result.success).toBe(false);
    });

    it("COMPLETED → WORKING is invalid (terminal state)", () => {
      const task = createTask(TaskStatus.COMPLETED);
      const result = lifecycle.transitionTask(task, TaskStatus.WORKING);
      expect(result.success).toBe(false);
    });

    it("FAILED → WORKING is invalid (terminal state)", () => {
      const task = createTask(TaskStatus.FAILED);
      const result = lifecycle.transitionTask(task, TaskStatus.WORKING);
      expect(result.success).toBe(false);
    });

    it("CANCELED → WORKING is invalid (terminal state)", () => {
      const task = createTask(TaskStatus.CANCELED);
      const result = lifecycle.transitionTask(task, TaskStatus.WORKING);
      expect(result.success).toBe(false);
    });

    it("COMPLETED → FAILED is invalid (terminal state)", () => {
      const task = createTask(TaskStatus.COMPLETED);
      const result = lifecycle.transitionTask(task, TaskStatus.FAILED);
      expect(result.success).toBe(false);
    });
  });

  describe("transitionTask — error messages", () => {
    it("lists allowed transitions in error message", () => {
      const task = createTask(TaskStatus.COMPLETED);
      const result = lifecycle.transitionTask(task, TaskStatus.WORKING);
      // Error message uses enum values (lowercase)
      expect(result.error).toContain("completed");
      expect(result.error).toContain("working");
      expect(result.error).toContain("Allowed");
    });
  });

  describe("full task lifecycle", () => {
    it("SUBMITTED → WORKING → COMPLETED", () => {
      let task = createTask(TaskStatus.SUBMITTED);
      task = lifecycle.transitionTask(task, TaskStatus.WORKING, "Starting").task;
      expect(task.status).toBe(TaskStatus.WORKING);

      task = lifecycle.transitionTask(task, TaskStatus.COMPLETED, "Done").task;
      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.history).toHaveLength(3);
    });

    it("SUBMITTED → WORKING → INPUT_REQUIRED → WORKING → COMPLETED", () => {
      let task = createTask(TaskStatus.SUBMITTED);
      task = lifecycle.transitionTask(task, TaskStatus.WORKING).task;
      task = lifecycle.transitionTask(task, TaskStatus.INPUT_REQUIRED, "Need input").task;
      task = lifecycle.transitionTask(task, TaskStatus.WORKING, "Input provided").task;
      task = lifecycle.transitionTask(task, TaskStatus.COMPLETED, "Done").task;

      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.history).toHaveLength(5);
    });
  });

  describe("addArtifact", () => {
    it("adds an artifact to the task", () => {
      const task = createTask();
      const artifact: A2AArtifact = {
        id: "artifact-1",
        parts: [{ type: "text", text: "Result" }],
        createdAt: new Date().toISOString(),
      };

      const updated = lifecycle.addArtifact(task, artifact);
      expect(updated.artifacts).toHaveLength(1);
      expect(updated.artifacts[0].id).toBe("artifact-1");
    });

    it("does not mutate the original task", () => {
      const task = createTask();
      const artifact: A2AArtifact = {
        id: "artifact-1",
        parts: [{ type: "text", text: "Result" }],
        createdAt: new Date().toISOString(),
      };

      lifecycle.addArtifact(task, artifact);
      expect(task.artifacts).toHaveLength(0); // original unchanged
    });
  });

  describe("addMessage", () => {
    it("adds a message to the task", () => {
      const task = createTask();
      const message: A2AMessage = {
        role: "agent",
        parts: [{ type: "text", text: "Processing" }],
        timestamp: new Date().toISOString(),
      };

      const updated = lifecycle.addMessage(task, message);
      expect(updated.messages).toHaveLength(1);
    });
  });

  describe("isTerminal / isTerminalStatus", () => {
    it("COMPLETED is terminal", () => {
      expect(lifecycle.isTerminalStatus(TaskStatus.COMPLETED)).toBe(true);
    });

    it("FAILED is terminal", () => {
      expect(lifecycle.isTerminalStatus(TaskStatus.FAILED)).toBe(true);
    });

    it("CANCELED is terminal", () => {
      expect(lifecycle.isTerminalStatus(TaskStatus.CANCELED)).toBe(true);
    });

    it("SUBMITTED is not terminal", () => {
      expect(lifecycle.isTerminalStatus(TaskStatus.SUBMITTED)).toBe(false);
    });

    it("WORKING is not terminal", () => {
      expect(lifecycle.isTerminalStatus(TaskStatus.WORKING)).toBe(false);
    });

    it("INPUT_REQUIRED is not terminal", () => {
      expect(lifecycle.isTerminalStatus(TaskStatus.INPUT_REQUIRED)).toBe(false);
    });

    it("isTerminal checks task status", () => {
      const completedTask = createTask(TaskStatus.COMPLETED);
      expect(lifecycle.isTerminal(completedTask)).toBe(true);

      const workingTask = createTask(TaskStatus.WORKING);
      expect(lifecycle.isTerminal(workingTask)).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns correct transitions for SUBMITTED", () => {
      const transitions = lifecycle.getValidTransitions(TaskStatus.SUBMITTED);
      expect(transitions).toEqual(VALID_TRANSITIONS[TaskStatus.SUBMITTED]);
    });

    it("returns empty array for COMPLETED", () => {
      const transitions = lifecycle.getValidTransitions(TaskStatus.COMPLETED);
      expect(transitions).toEqual([]);
    });
  });
});
