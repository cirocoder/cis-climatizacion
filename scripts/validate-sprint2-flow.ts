import "dotenv/config";
import { loadSafeTestDatabaseEnvironment } from "./test-database-environment.mjs";

const baseUrl = "http://localhost:3000";
const password = "Sprint2Local123!";
const suffix = process.env.SPRINT2_VALIDATION_SUFFIX?.trim() || Date.now().toString(36);
const primaryEmail = `sprint2-primary-${suffix}@example.com`;
const secondaryEmail = `sprint2-secondary-${suffix}@example.com`;
const keepData = process.argv.includes("--keep-data") || process.env.SPRINT2_KEEP_DATA === "1";
const cleanupOnly = process.argv.includes("--cleanup-only") || process.env.SPRINT2_CLEANUP_ONLY === "1";

function ensureIncludes(html: string, text: string, step: string) {
  if (!html.includes(text)) throw new Error(`${step}: no se encontró el contenido esperado.`);
}

async function main() {
  loadSafeTestDatabaseEnvironment();
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  process.env.BETTER_AUTH_URL = baseUrl;
  process.env.APP_URL = baseUrl;

  const [{ getAuth }, { getPrisma }, emailService, entitlementCommands] = await Promise.all([
    import("../src/lib/auth/auth"),
    import("../src/lib/db/prisma"),
    import("../src/lib/email/service"),
    import("./lib/entitlements"),
  ]);
  const auth = getAuth();
  const prisma = getPrisma();
  const emails = [primaryEmail, secondaryEmail];

  const callAuth = (path: string, body: Record<string, unknown>, cookie?: string) => auth.handler(new Request(`${baseUrl}/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
    redirect: "manual",
  }));

  async function createVerifiedSession(email: string) {
    const signup = await callAuth("/sign-up/email", { name: "Validación Sprint 2", email, password, callbackURL: "/academia/mi-academia" });
    if (signup.status !== 200) throw new Error(`No se pudo crear la cuenta local ${email}.`);
    emailService.clearTestEmailOutbox();
    const verificationRequest = await callAuth("/send-verification-email", { email, callbackURL: "/academia/mi-academia" });
    if (verificationRequest.status !== 200) throw new Error(`No se pudo preparar la verificación local ${email}.`);
    const verificationUrl = emailService.getTestEmailOutbox()[0]?.text.match(/https?:\/\/\S+/)?.[0];
    if (!verificationUrl) throw new Error("Better Auth no generó la URL de verificación local.");
    const verification = await auth.handler(new Request(verificationUrl, { redirect: "manual" }));
    if (![302, 303].includes(verification.status)) throw new Error("La verificación local no fue aceptada.");
    const signin = await callAuth("/sign-in/email", { email, password });
    const cookie = signin.headers.get("set-cookie")?.split(";")[0];
    if (signin.status !== 200 || !cookie) throw new Error(`No se pudo iniciar sesión con ${email}.`);
    return cookie;
  }

  if (cleanupOnly) {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await prisma.$disconnect();
    process.stdout.write("Datos locales de validación eliminados.\n");
    return;
  }

  try {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    const primaryCookie = await createVerifiedSession(primaryEmail);
    const secondaryCookie = await createVerifiedSession(secondaryEmail);

    const emptyResponse = await fetch(`${baseUrl}/academia/mi-academia`, { headers: { cookie: primaryCookie } });
    ensureIncludes(await emptyResponse.text(), "Todavía no tenés productos asociados", "Biblioteca vacía");
    process.stdout.write("1/8 Mi Academia vacía: correcto\n");

    await entitlementCommands.grantAdminEntitlement(prisma, primaryEmail, "kit-cis-5p");
    const libraryResponse = await fetch(`${baseUrl}/academia/mi-academia`, { headers: { cookie: primaryCookie } });
    ensureIncludes(await libraryResponse.text(), "Kit CIS 5P", "Biblioteca con grant");
    process.stdout.write("2/8 Grant visible en Mi Academia: correcto\n");

    const privateUrl = `${baseUrl}/academia/mi-academia/productos/kit-cis-5p`;
    const allowed = await fetch(privateUrl, { headers: { cookie: primaryCookie }, redirect: "manual" });
    if (allowed.status !== 200) throw new Error(`Ruta privada autorizada respondió ${allowed.status}.`);
    process.stdout.write("3/8 Ruta privada autorizada: correcto\n");

    const denied = await fetch(privateUrl, { headers: { cookie: secondaryCookie }, redirect: "manual" });
    if (denied.status !== 404) throw new Error(`Otra cuenta sin acceso respondió ${denied.status} en lugar de 404.`);
    process.stdout.write("4/8 Aislamiento entre cuentas: correcto\n");

    await entitlementCommands.revokeAdminEntitlement(prisma, primaryEmail, "kit-cis-5p");
    const revoked = await fetch(privateUrl, { headers: { cookie: primaryCookie }, redirect: "manual" });
    if (revoked.status !== 404) throw new Error(`El acceso revocado respondió ${revoked.status}.`);
    process.stdout.write("5/8 Revocación inmediata: correcto\n");

    await entitlementCommands.grantAdminEntitlement(prisma, primaryEmail, "kit-cis-5p");
    const repeat = await entitlementCommands.grantAdminEntitlement(prisma, primaryEmail, "kit-cis-5p");
    if (repeat.outcome !== "unchanged") throw new Error("El segundo grant no fue idempotente.");
    process.stdout.write("6/8 Reactivación y grant idempotente: correcto\n");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: primaryEmail }, select: { id: true } });
    const count = await prisma.entitlement.count({ where: { userId: user.id, sourceType: "ADMIN" } });
    if (count !== 1) throw new Error(`Se encontraron ${count} entitlements ADMIN en lugar de uno.`);
    process.stdout.write("7/8 Sin duplicados: correcto\n");

    const restored = await fetch(privateUrl, { headers: { cookie: primaryCookie }, redirect: "manual" });
    if (restored.status !== 200) throw new Error(`La ruta reactivada respondió ${restored.status}.`);
    process.stdout.write("8/8 Acceso restaurado: correcto\n");
  } finally {
    if (!keepData) {
      await prisma.rateLimit.deleteMany();
      await prisma.verification.deleteMany();
      await prisma.user.deleteMany({ where: { email: { in: emails } } });
    } else {
      process.stdout.write(`Cuenta visual local: ${primaryEmail}\n`);
    }
    await prisma.$disconnect();
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Falló la validación manual de Sprint 2."}\n`);
  process.exitCode = 1;
});
