/**
 * KALEN Server — Root Application Module
 * Imports all feature modules and configures global providers.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { IdentityModule } from './identity/identity.module';
import { MessagingModule } from './messaging/messaging.module';
import { McpModule } from './mcp/mcp.module';
import { A2aModule } from './a2a/a2a.module';
import { HealthModule } from './health/health.module';
import { EventsGateway } from './gateway/events.gateway';
import { AuditLogRepository } from './database/repositories/audit-log.repository';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    // Global configuration from .env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Database (TypeORM + PostgreSQL/SQLite + Repositories)
    DatabaseModule,

    // Feature modules
    AuthModule,
    IdentityModule,
    MessagingModule,
    McpModule,
    A2aModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    EventsGateway,
    // AuditInterceptor with repository injection
    {
      provide: AuditInterceptor,
      useFactory: (auditLogRepo: AuditLogRepository) => {
        return new AuditInterceptor(auditLogRepo as any);
      },
      inject: [AuditLogRepository],
    },
  ],
})
export class AppModule {}
