import { spawnSync } from "node:child_process";
import { loadSafeTestDatabaseEnvironment } from "./test-database-environment.mjs";

const connectionString = loadSafeTestDatabaseEnvironment();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("No se pudo localizar el CLI de npm para preparar la base de tests.");

const result = spawnSync(process.execPath, [npmCli, "run", "prisma:deploy"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL: connectionString,
    DIRECT_URL: connectionString,
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
