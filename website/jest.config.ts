import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.(test|spec).[jt]s?(x)",
    "**/?(*.)+(test|spec).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "stores/**/*.ts",
    "hooks/**/*.ts",
    "middleware.ts",
    "components/**/*.tsx",
    "!components/ui/**",   // shadcn generated — skip
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
}

export default createJestConfig(config)
