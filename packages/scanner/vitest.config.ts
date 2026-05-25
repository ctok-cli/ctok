import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/**/types.ts"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 72, // binary-read-error and null-byte paths are OS-level and not unit-testable
        statements: 85,
      },
      reporter: ["text", "lcov"],
    },
  },
});
