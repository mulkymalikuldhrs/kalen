/**
 * KALEN Server — Identity Module
 * Human and agent identity management, RBAC enforcement.
 * Uses AgentRepository and UserRepository for database access.
 */

import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentRepository } from '../database/repositories/agent.repository';
import { UserRepository } from '../database/repositories/user.repository';

@Module({
  imports: [],
  controllers: [AgentController],
  providers: [AgentService, AgentRepository, UserRepository],
  exports: [AgentService],
})
export class IdentityModule {}
