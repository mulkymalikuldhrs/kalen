/**
 * @kalen/a2a-router — A2A Router Service Tests
 */
import { A2ARouterService } from "../router/a2a-router-service";
import { AgentCardService } from "../agent-card/agent-card-service";
import { TaskStatus } from "@kalen/shared";
import type { A2AMessage, AgentCard } from "@kalen/shared";

// ─── Helpers ──────────────────────────────────────────────────────

function createMessage(text: string, role: "user" | "agent" = "user"): A2AMessage {
  return {
    role,
    parts: [{ type: "text", text }],
    timestamp: new Date().toISOString(),
  };
}

function createValidCard(url: string = "https://agent.example.com"): AgentCard {
  return {
    name: "TestAgent (ai)",
    url,
    description: "A test agent",
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    endpoints: [{ method: "POST", path: "/a2a" }],
    authentication: { scheme: "bearer" },
  };
}

describe("A2ARouterService", () => {
  let router: A2ARouterService;
  let cardService: AgentCardService;

  beforeEach(() => {
    cardService = new AgentCardService();
    router = new A2ARouterService(cardService);
  });

  describe("createTask", () => {
    it("creates a task in SUBMITTED state", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));

      expect(task.id).toBeTruthy();
      expect(task.status).toBe(TaskStatus.SUBMITTED);
      expect(task.assignedAgentId).toBe("agent-1");
      expect(task.createdBy).toBe("user-1");
      expect(task.messages).toHaveLength(1);
      expect(task.history).toHaveLength(1);
    });

    it("enforces max task limit per agent", async () => {
      const limitedRouter = new A2ARouterService(cardService, { maxTasksPerAgent: 2 });

      await limitedRouter.createTask("agent-1", "user-1", createMessage("Task 1"));
      await limitedRouter.createTask("agent-1", "user-1", createMessage("Task 2"));

      await expect(
        limitedRouter.createTask("agent-1", "user-1", createMessage("Task 3")),
      ).rejects.toThrow("maximum concurrent task limit");
    });

    it("different agents have independent task counts", async () => {
      const limitedRouter = new A2ARouterService(cardService, { maxTasksPerAgent: 1 });

      await limitedRouter.createTask("agent-1", "user-1", createMessage("Task 1"));
      // Should not throw — agent-2 has no tasks yet
      const task2 = await limitedRouter.createTask("agent-2", "user-1", createMessage("Task 2"));
      expect(task2.assignedAgentId).toBe("agent-2");
    });
  });

  describe("getTask", () => {
    it("returns created task by ID", async () => {
      const created = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      const retrieved = router.getTask(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
    });

    it("returns null for unknown task ID", () => {
      expect(router.getTask("nonexistent")).toBeNull();
    });
  });

  describe("delegateTask", () => {
    it("creates a new task on the target agent", async () => {
      const original = await router.createTask("agent-1", "user-1", createMessage("Original"));

      const delegated = await router.delegateTask(
        original.id,
        "agent-2",
        createMessage("Delegated task"),
      );

      expect(delegated.assignedAgentId).toBe("agent-2");
      expect(delegated.status).toBe(TaskStatus.SUBMITTED);
      expect(delegated.id).not.toBe(original.id);
    });

    it("adds a delegation message to the original task", async () => {
      const original = await router.createTask("agent-1", "user-1", createMessage("Original"));

      await router.delegateTask(original.id, "agent-2", createMessage("Delegated"));

      const updatedOriginal = router.getTask(original.id);
      expect(updatedOriginal!.messages.length).toBeGreaterThan(1);
      const lastMsg = updatedOriginal!.messages[updatedOriginal!.messages.length - 1];
      expect(lastMsg.parts[0].text).toContain("delegated");
    });

    it("throws for nonexistent task", async () => {
      await expect(
        router.delegateTask("nonexistent", "agent-2", createMessage("Delegated")),
      ).rejects.toThrow("not found");
    });
  });

  describe("cancelTask", () => {
    it("cancels a submitted task", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      const cancelled = await router.cancelTask(task.id, "user-1", "Changed mind");

      expect(cancelled.status).toBe(TaskStatus.CANCELED);
    });

    it("cancels a working task", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      router.transitionTask(task.id, TaskStatus.WORKING);

      const cancelled = await router.cancelTask(task.id, "user-1");
      expect(cancelled.status).toBe(TaskStatus.CANCELED);
    });

    it("throws for nonexistent task", async () => {
      await expect(
        router.cancelTask("nonexistent", "user-1"),
      ).rejects.toThrow("not found");
    });

    it("throws when trying to cancel a completed task", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      router.transitionTask(task.id, TaskStatus.WORKING);
      router.transitionTask(task.id, TaskStatus.COMPLETED);

      await expect(
        router.cancelTask(task.id, "user-1"),
      ).rejects.toThrow("Invalid state transition");
    });
  });

  describe("transitionTask", () => {
    it("transitions task through valid states", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));

      const working = router.transitionTask(task.id, TaskStatus.WORKING, "Starting work");
      expect(working.status).toBe(TaskStatus.WORKING);

      const completed = router.transitionTask(task.id, TaskStatus.COMPLETED, "Done");
      expect(completed.status).toBe(TaskStatus.COMPLETED);
    });

    it("throws for invalid state transition", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      expect(() =>
        router.transitionTask(task.id, TaskStatus.COMPLETED),
      ).toThrow("Invalid state transition");
    });

    it("throws for nonexistent task", () => {
      expect(() =>
        router.transitionTask("nonexistent", TaskStatus.WORKING),
      ).toThrow("not found");
    });

    it("decrements agent task count on terminal state", async () => {
      const limitedRouter = new A2ARouterService(cardService, { maxTasksPerAgent: 1 });

      const task = await limitedRouter.createTask("agent-1", "user-1", createMessage("Hello"));
      limitedRouter.transitionTask(task.id, TaskStatus.WORKING);
      limitedRouter.transitionTask(task.id, TaskStatus.COMPLETED);

      // Should be able to create another task now
      const task2 = await limitedRouter.createTask("agent-1", "user-1", createMessage("Another"));
      expect(task2).toBeDefined();
    });
  });

  describe("addTaskMessage", () => {
    it("adds a message to an existing task", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      const updated = router.addTaskMessage(task.id, createMessage("Follow-up", "agent"));

      expect(updated.messages).toHaveLength(2);
      expect(updated.messages[1].role).toBe("agent");
    });

    it("throws for nonexistent task", () => {
      expect(() =>
        router.addTaskMessage("nonexistent", createMessage("Hello")),
      ).toThrow("not found");
    });
  });

  describe("addTaskArtifact", () => {
    it("adds an artifact to a task", async () => {
      const task = await router.createTask("agent-1", "user-1", createMessage("Hello"));
      const artifact = {
        id: "artifact-1",
        parts: [{ type: "text", text: "Result" }],
        createdAt: new Date().toISOString(),
      };

      const updated = router.addTaskArtifact(task.id, artifact);
      expect(updated.artifacts).toHaveLength(1);
    });

    it("throws for nonexistent task", () => {
      expect(() =>
        router.addTaskArtifact("nonexistent", {
          id: "a1",
          parts: [],
          createdAt: new Date().toISOString(),
        }),
      ).toThrow("not found");
    });
  });

  describe("listTasksForAgent", () => {
    it("returns tasks assigned to an agent", async () => {
      await router.createTask("agent-1", "user-1", createMessage("Task 1"));
      await router.createTask("agent-1", "user-1", createMessage("Task 2"));
      await router.createTask("agent-2", "user-1", createMessage("Task 3"));

      const agent1Tasks = router.listTasksForAgent("agent-1");
      expect(agent1Tasks).toHaveLength(2);
    });

    it("returns empty list for agent with no tasks", () => {
      expect(router.listTasksForAgent("agent-999")).toEqual([]);
    });
  });

  describe("listTasksByCreator", () => {
    it("returns tasks created by a specific entity", async () => {
      await router.createTask("agent-1", "user-1", createMessage("Task 1"));
      await router.createTask("agent-2", "user-1", createMessage("Task 2"));
      await router.createTask("agent-1", "user-2", createMessage("Task 3"));

      const user1Tasks = router.listTasksByCreator("user-1");
      expect(user1Tasks).toHaveLength(2);
    });

    it("returns empty list for creator with no tasks", () => {
      expect(router.listTasksByCreator("user-999")).toEqual([]);
    });
  });

  describe("discoverAgent", () => {
    it("returns cached card if available", async () => {
      const card = createValidCard();
      await cardService.registerCard(card);

      const discovered = await router.discoverAgent(card.url);
      expect(discovered).toEqual(card);
    });
  });
});
