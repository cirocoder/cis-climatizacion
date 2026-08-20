import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { loadSafeTestDatabaseEnvironment } from "./scripts/test-database-environment.mjs";

loadSafeTestDatabaseEnvironment();

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
