/**
 * KALEN Server — MCP Module
 * MCP gateway integration, tool calls, and resource access.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpCallEntity } from '../database/entities/mcp-call.entity';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([McpCallEntity]),
  ],
  controllers: [McpController],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
