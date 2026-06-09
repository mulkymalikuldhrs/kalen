/**
 * KALEN Server — A2A Module
 * Agent-to-agent communication, task delegation, and agent discovery.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { A2aTaskEntity } from '../database/entities/a2a-task.entity';
import { A2aController, A2aJsonRpcController } from './a2a.controller';
import { A2aService } from './a2a.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([A2aTaskEntity]),
  ],
  controllers: [A2aController, A2aJsonRpcController],
  providers: [A2aService],
  exports: [A2aService],
})
export class A2aModule {}
