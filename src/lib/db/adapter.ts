import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

export function createPostgresAdapter(connectionString: string) {
  const hostname = new URL(connectionString).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? new PrismaPg({ connectionString })
    : new PrismaNeon({ connectionString });
}
