import { resolve } from "node:path";
import { config } from "dotenv";

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function loadSafeTestDatabaseEnvironment() {
  config({ path: resolve(process.cwd(), ".env.test.local"), override: true, quiet: true });

  const connectionString = process.env.TEST_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "TEST_DATABASE_URL no está configurada. Copiá .env.test.example a .env.test.local y usá una base PostgreSQL local exclusiva de tests.",
    );
  }

  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("TEST_DATABASE_URL no es una URL PostgreSQL válida.");
  }

  if (!url.protocol.startsWith("postgres")) {
    throw new Error("TEST_DATABASE_URL debe utilizar PostgreSQL.");
  }

  if (!localHosts.has(url.hostname)) {
    throw new Error("Por seguridad, los tests sólo admiten PostgreSQL local. Neon y otras bases remotas están bloqueadas.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, "")).toLowerCase();
  if (!/(^|[-_])test($|[-_])/.test(databaseName)) {
    throw new Error("La base indicada en TEST_DATABASE_URL debe tener 'test' en el nombre para confirmar que es exclusiva.");
  }

  process.env.TEST_DATABASE_URL = connectionString;
  process.env.DATABASE_URL = connectionString;
  process.env.DIRECT_URL = connectionString;
  return connectionString;
}
