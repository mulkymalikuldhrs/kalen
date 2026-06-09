/**
 * KALEN Server — Database Module
 * Configures TypeORM with PostgreSQL connection using environment variables.
 * Supports both PostgreSQL (production) and SQLite (development fallback).
 * Registers all entities, repositories, and configures migrations.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  UserEntity,
  AgentEntity,
  RoomEntity,
  RoomMemberEntity,
  MessageEntity,
  AuditLogEntity,
  McpCallEntity,
  A2aTaskEntity,
} from './entities';
import { UserRepository } from './repositories/user.repository';
import { AgentRepository } from './repositories/agent.repository';
import { RoomRepository } from './repositories/room.repository';
import { MessageRepository } from './repositories/message.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

/** All entities in the application */
const ENTITIES = [
  UserEntity,
  AgentEntity,
  RoomEntity,
  RoomMemberEntity,
  MessageEntity,
  AuditLogEntity,
  McpCallEntity,
  A2aTaskEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('nodeEnv', 'development');
        const dbType = configService.get<string>('database.type', 'postgres');

        // SQLite fallback for development without PostgreSQL
        if (dbType === 'sqlite' || nodeEnv === 'test') {
          return {
            type: 'better-sqlite3' as const,
            database: configService.get<string>('database.database', 'kalen-dev.db'),
            entities: ENTITIES,
            synchronize: configService.get<boolean>('database.synchronize', true),
            logging: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
          };
        }

        // PostgreSQL for production
        return {
          type: 'postgres' as const,
          host: configService.get<string>('database.host', 'localhost'),
          port: configService.get<number>('database.port', 5432),
          username: configService.get<string>('database.username', 'kalen'),
          password: configService.get<string>('database.password', 'kalen_dev_password'),
          database: configService.get<string>('database.database', 'kalen'),
          entities: ENTITIES,
          synchronize: configService.get<boolean>('database.synchronize', false),
          // TODO: Disable synchronize in production — use migrations instead
          logging: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: configService.get<boolean>('database.migrationsRun', nodeEnv === 'production'),
          // Connection pool settings
          extra: {
            max: configService.get<number>('database.poolMax', 20),
            idleTimeoutMillis: configService.get<number>('database.poolIdleTimeout', 30000),
          },
          // SSL support for production
          ssl: configService.get<boolean>('database.ssl', false)
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: [
    UserRepository,
    AgentRepository,
    RoomRepository,
    MessageRepository,
    AuditLogRepository,
  ],
  exports: [
    TypeOrmModule,
    UserRepository,
    AgentRepository,
    RoomRepository,
    MessageRepository,
    AuditLogRepository,
  ],
})
export class DatabaseModule {}
