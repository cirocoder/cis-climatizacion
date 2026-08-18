import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPostgresAdapter } from "../src/lib/db/adapter";

const email = process.argv[2]?.trim().toLowerCase();
const connectionString = process.env.DATABASE_URL;

if (!email || !email.includes("@")) throw new Error("Uso: npm run admin:promote -- correo@dominio.com");
if (!connectionString) throw new Error("DATABASE_URL no está configurada.");

const prisma = new PrismaClient({ adapter: createPostgresAdapter(connectionString) });
try {
  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" }, select: { id: true, email: true, role: true } });
  process.stdout.write(`Rol actualizado de forma local para ${user.email}: ${user.role}\n`);
} finally {
  await prisma.$disconnect();
}
