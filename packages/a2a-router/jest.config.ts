import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
  moduleNameMapper: {
    "^@kalen/shared$": "<rootDir>/../shared/src/index.ts",
    "^@kalen/identity$": "<rootDir>/../identity/src/index.ts",
  },
  transformIgnorePatterns: [
    "node_modules/(?!( @noble|@simplewebauthn)/)",
  ],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          target: "es2020",
        },
        diagnostics: false,
      },
    ],
  },
};

export default config;
