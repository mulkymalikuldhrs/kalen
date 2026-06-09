/**
 * KALEN Server — Environment Variable Validation Schema
 * Uses Joi for environment variable validation via @nestjs/config.
 */

import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  APP_PORT: Joi.number().default(4000),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('kalen'),
  DB_PASSWORD: Joi.string().default('kalen_dev_password'),
  DB_TYPE: Joi.string().valid('postgres', 'sqlite').default('postgres'),
  DB_DATABASE: Joi.string().default('kalen'),
  DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('true'),
  DB_MIGRATIONS_RUN: Joi.string().valid('true', 'false').default('false'),
  DB_SSL: Joi.string().valid('true', 'false').default('false'),
  DB_POOL_MAX: Joi.number().default(20),

  JWT_SECRET: Joi.string().min(16).default('change-me-in-production-min-32-chars!!'),

  WEBAUTHN_RP_NAME: Joi.string().default('KALEN'),
  WEBAUTHN_RP_ID: Joi.string().default('localhost'),
  WEBAUTHN_ORIGIN: Joi.string().default('http://localhost:3000'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  OPENIM_API_URL: Joi.string().default('http://localhost:10002'),
  OPENIM_SECRET: Joi.string().default('openim_secret_key'),

  MCP_MAX_CONCURRENT_CALLS: Joi.number().default(10),
  MCP_DEFAULT_TIMEOUT: Joi.number().default(30000),

  A2A_MAX_TASKS_PER_AGENT: Joi.number().default(100),
  A2A_TASK_TIMEOUT: Joi.number().default(300000),
});
