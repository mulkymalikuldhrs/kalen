/**
 * KALEN Server — Auth Module
 * WebAuthn registration/authentication, agent auth, and JWT token management.
 * Uses UserRepository and AgentRepository for database access.
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from '../database/repositories/user.repository';
import { AgentRepository } from '../database/repositories/agent.repository';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, AgentRepository],
  exports: [AuthService],
})
export class AuthModule {}
