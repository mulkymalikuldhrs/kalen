/**
 * KALEN Server — Configuration Factory
 * Maps environment variables to a typed configuration object.
 */

export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  appPort: parseInt(process.env.APP_PORT || '4000', 10),

  // Database
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'kalen',
    password: process.env.DB_PASSWORD || 'kalen_dev_password',
    database: process.env.DB_DATABASE || 'kalen',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    ssl: process.env.DB_SSL === 'true',
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    poolIdleTimeout: 30000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production-min-32-chars!!',
  },

  // WebAuthn
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'KALEN',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // OpenIM
  openim: {
    apiUrl: process.env.OPENIM_API_URL || 'http://localhost:10002',
    secret: process.env.OPENIM_SECRET || 'openim_secret_key',
  },

  // MCP Gateway
  mcp: {
    maxConcurrentCalls: parseInt(process.env.MCP_MAX_CONCURRENT_CALLS || '10', 10),
    defaultTimeout: parseInt(process.env.MCP_DEFAULT_TIMEOUT || '30000', 10),
  },

  // A2A Router
  a2a: {
    maxTasksPerAgent: parseInt(process.env.A2A_MAX_TASKS_PER_AGENT || '100', 10),
    taskTimeout: parseInt(process.env.A2A_TASK_TIMEOUT || '300000', 10),
  },
});
