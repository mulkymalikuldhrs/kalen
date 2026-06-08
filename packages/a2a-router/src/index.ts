/**
 * @kalen/a2a-router — KALEN A2A Protocol Router
 * Agent discovery, task routing, card management, and state machines.
 */

// Router
export { A2ARouterService } from "./router/a2a-router-service";
export type { A2ARouterConfig } from "./router/a2a-router-service";

// Agent Card
export { AgentCardService } from "./agent-card/agent-card-service";

// Task
export { TaskLifecycle } from "./task/task-lifecycle";
export type { TaskTransitionResult } from "./task/task-lifecycle";

// Security
export { signAgentCard, verifyAgentCardSignature } from "./security/card-signer";
