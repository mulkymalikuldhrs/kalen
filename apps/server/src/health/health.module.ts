/**
 * KALEN Server — Health Module
 * Health check endpoints for monitoring and load balancers.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
