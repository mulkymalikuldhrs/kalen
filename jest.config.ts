import type { Config } from "jest";

const config: Config = {
  projects: [
    "<rootDir>/packages/shared/jest.config.ts",
    "<rootDir>/packages/identity/jest.config.ts",
    "<rootDir>/packages/mcp-gateway/jest.config.ts",
    "<rootDir>/packages/a2a-router/jest.config.ts",
  ],
};

export default config;
