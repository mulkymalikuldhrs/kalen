/**
 * KALEN Server — Main entry point
 * Bootstraps the NestJS application with global pipes, CORS, Swagger, and WebSocket support.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix for all API routes (health excluded)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  // Enable CORS for development
  app.enableCors({
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe — strips unknown properties, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters, interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    // AuditInterceptor requires repository injection — registered as provider in AppModule
  );

  // Rate limiting middleware (applied to all routes)
  app.use(new RateLimiterMiddleware().use.bind(new RateLimiterMiddleware()));

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('KALEN API')
    .setDescription(
      'KALEN — Kinetic Autonomous Layer for Entity Networking. ' +
      'REST API for WebAuthn authentication, agent identity management, ' +
      'real-time messaging, MCP tool gateway, and A2A agent coordination.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'KALEN JWT access token (issued by /auth/login-finish or /auth/agent)',
      },
      'bearer',
    )
    .addServer('http://localhost:4000', 'Local development')
    .addServer('https://staging.kalen.example.com', 'Staging')
    .addServer('https://kalen.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    customSiteTitle: 'KALEN API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 KALEN Server running on http://localhost:${port}`);
  logger.log(`📡 API base: http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/v1/docs`);
  logger.log(`❤️  Health: http://localhost:${port}/health`);
  logger.log(`🔌 WebSocket: ws://localhost:${port}/events`);
}

bootstrap();
