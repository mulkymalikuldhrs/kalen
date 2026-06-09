/**
 * KALEN Server — A2A Service
 * Agent-to-agent communication, task delegation, and agent discovery.
 * Uses @kalen/a2a-router for the A2ARouterService and AgentCardService.
 *
 * Key integration points:
 * - A2ARouterService.createTask() creates tasks and manages state machines
 * - A2ARouterService.discoverAgent() resolves agent cards for discovery
 * - A2ARouterService.listTasksForAgent() / listTasksByCreator() for queries
 * - TaskLifecycle manages valid state transitions
 * - AgentCardService handles card caching and verification
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { A2aTaskEntity } from '../database/entities/a2a-task.entity';
import {
  A2ARouterService,
  AgentCardService,
  type A2ARouterConfig,
} from '@kalen/a2a-router';
import { TaskStatus } from '@kalen/shared';

@Injectable()
export class A2aService {
  private router: A2ARouterService;

  constructor(
    private configService: ConfigService,
    @InjectRepository(A2aTaskEntity)
    private taskRepo: Repository<A2aTaskEntity>,
  ) {
    const routerConfig: Partial<A2ARouterConfig> = {
      maxTasksPerAgent: configService.get<number>('a2a.maxTasksPerAgent', 100),
      taskTimeout: configService.get<number>('a2a.taskTimeout', 300000),
      discoveryCacheTTL: 300,
    };

    // Wire to @kalen/a2a-router AgentCardService
    const cardService = new AgentCardService();
    this.router = new A2ARouterService(cardService, routerConfig);
  }

  /**
   * Create a new A2A task.
   * Uses @kalen/a2a-router A2ARouterService.createTask() for state management.
   */
  async createTask(
    agentId: string,
    createdBy: string,
    creatorKind: 'human' | 'agent',
    message: { role: string; parts: Array<{ type: string; text?: string }> },
  ) {
    // Map to A2AMessage format with strict types from @kalen/shared
    const a2aMessage: import('@kalen/shared').A2AMessage = {
      role: (message.role === 'user' || message.role === 'agent') ? message.role : 'user',
      parts: message.parts.map((p) => ({
        type: (p.type === 'text' || p.type === 'file' || p.type === 'data') ? p.type : 'text' as const,
        text: p.text,
      })),
      timestamp: new Date().toISOString(),
    };

    // Route through @kalen/a2a-router
    const task = await this.router.createTask(agentId, createdBy, a2aMessage);

    // Persist to database for durability and audit
    const entity = this.taskRepo.create({
      id: task.id,
      status: task.status as any,
      statusMessage: task.statusMessage,
      assignedAgentId: task.assignedAgentId ?? null,
      createdBy,
      creatorKind,
      messages: task.messages as any,
      artifacts: task.artifacts as any,
      history: task.history as any,
      parentTaskId: null,
    });

    await this.taskRepo.save(entity);

    return task;
  }

  /**
   * Get a task by ID.
   * Uses @kalen/a2a-router A2ARouterService.getTask().
   */
  async getTask(taskId: string) {
    const task = this.router.getTask(taskId);
    if (!task) {
      // Fallback to database
      const entity = await this.taskRepo.findOne({ where: { id: taskId } });
      if (!entity) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: `Task "${taskId}" not found`,
        });
      }
      return entity;
    }
    return task;
  }

  /**
   * Cancel a task.
   * Uses @kalen/a2a-router A2ARouterService.cancelTask() for state transition.
   */
  async cancelTask(taskId: string, cancelledBy: string, reason?: string) {
    const task = await this.router.cancelTask(taskId, cancelledBy, reason);

    // Update database
    await this.taskRepo.update(taskId, {
      status: 'canceled',
      statusMessage: reason ?? `Cancelled by ${cancelledBy}`,
    });

    return task;
  }

  /**
   * Get agent card for discovery.
   * Uses @kalen/a2a-router A2ARouterService.discoverAgent() which
   * delegates to AgentCardService for card resolution and caching.
   */
  async getAgentCard(agentId: string) {
    try {
      const card = await this.router.discoverAgent(agentId);
      return card;
    } catch {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Agent card for "${agentId}" not found`,
      });
    }
  }

  /**
   * List tasks for an agent.
   * Uses @kalen/a2a-router A2ARouterService.listTasksForAgent().
   */
  async listTasksForAgent(agentId: string) {
    return this.router.listTasksForAgent(agentId);
  }

  /**
   * List tasks created by an entity.
   * Uses @kalen/a2a-router A2ARouterService.listTasksByCreator().
   */
  async listTasksByCreator(createdBy: string) {
    return this.router.listTasksByCreator(createdBy);
  }

  /**
   * Handle JSON-RPC 2.0 A2A requests.
   * This is the main entry point for A2A protocol messages.
   * Routes to the appropriate @kalen/a2a-router method based on the JSON-RPC method name.
   */
  async handleJsonRpcRequest(body: {
    jsonrpc: string;
    method: string;
    params?: any;
    id?: number | string;
  }) {
    const { method, params, id } = body;

    try {
      let result: any;

      switch (method) {
        case 'tasks/send': {
          result = await this.createTask(
            params?.agentId ?? params?.id,
            params?.createdBy ?? 'system',
            params?.creatorKind ?? 'agent',
            params?.message ?? { role: 'user', parts: [] },
          );
          break;
        }

        case 'tasks/get': {
          result = await this.getTask(params?.id);
          break;
        }

        case 'tasks/cancel': {
          result = await this.cancelTask(
            params?.id,
            params?.cancelledBy ?? 'system',
            params?.reason,
          );
          break;
        }

        case 'tasks/list': {
          result = params?.agentId
            ? await this.listTasksForAgent(params.agentId)
            : await this.listTasksByCreator(params?.createdBy ?? 'system');
          break;
        }

        default:
          return {
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
            id,
          };
      }

      return {
        jsonrpc: '2.0',
        result,
        id,
      };
    } catch (error) {
      const code =
        error instanceof NotFoundException ? -32003 :
        error instanceof ForbiddenException ? -32004 :
        -32603;

      return {
        jsonrpc: '2.0',
        error: {
          code,
          message: error instanceof Error ? error.message : 'Internal error',
        },
        id,
      };
    }
  }
}
