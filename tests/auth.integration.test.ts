import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadSafeTestDatabaseEnvironment } from "../scripts/test-database-environment.mjs";

const databaseUrl = loadSafeTestDatabaseEnvironment();

describe.sequential("identidad de CIS Academia", () => {
  const email = "persona.prueba@cis.test";
  const verifiedEmail = "persona.verificada@cis.test";
  const limitedEmail = "persona.limitada@cis.test";
  const missingEmail = "persona.inexistente@cis.test";
  const testEmails = [email, verifiedEmail, limitedEmail, missingEmail];
  const password = "ClaveSegura123!";
  let auth: Awaited<ReturnType<typeof import("../src/lib/auth/auth")["getAuth"]>>;
  let prisma: ReturnType<typeof import("../src/lib/db/prisma")["getPrisma"]>;
  let cookie = "";
  let verificationUrl = "";

  async function call(path: string, body?: object, requestCookie?: string, clientIp = "198.51.100.10") {
    const headers = new Headers({ origin: "http://localhost:3000" });
    if (body) headers.set("content-type", "application/json");
    if (requestCookie) headers.set("cookie", requestCookie);
    headers.set("x-forwarded-for", clientIp);
    return auth.handler(new Request(`http://localhost:3000/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    }));
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = databaseUrl;
    process.env.BETTER_AUTH_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3000";
    const authModule = await import("../src/lib/auth/auth");
    const dbModule = await import("../src/lib/db/prisma");
    const emailModule = await import("../src/lib/email/service");
    auth = authModule.getAuth();
    prisma = dbModule.getPrisma();
    emailModule.clearTestEmailOutbox();
    await prisma.rateLimit.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.rateLimit.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    await prisma.$disconnect();
  });

  it("1. registra datos válidos y asigna USER", async () => {
    const response = await call("/sign-up/email", { name: "Persona Prueba", email, password, callbackURL: "/academia/mi-academia" });
    expect(response.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("USER");
    expect(user.emailVerified).toBe(false);
  });

  it("2. no revela si un correo ya está registrado", async () => {
    const response = await call("/sign-up/email", { name: "Otra Persona", email, password, callbackURL: "/academia/mi-academia" });
    expect(response.status).toBe(200);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it("3. reenvía la verificación para un usuario no verificado", async () => {
    const { clearTestEmailOutbox, getTestEmailOutbox } = await import("../src/lib/email/service");
    clearTestEmailOutbox();
    const response = await call("/send-verification-email", { email, callbackURL: "/academia/mi-academia" }, undefined, "198.51.100.21");
    expect(response.status).toBe(200);
    expect(getTestEmailOutbox()).toHaveLength(1);
    expect(getTestEmailOutbox()[0].to).toBe(email);
    verificationUrl = getTestEmailOutbox()[0].text.match(/https?:\/\/\S+/)?.[0] ?? "";
    expect(verificationUrl).toBeTruthy();
  });

  it("4. responde de forma neutra y no envía para un usuario ya verificado", async () => {
    const { clearTestEmailOutbox, getTestEmailOutbox } = await import("../src/lib/email/service");
    await call("/sign-up/email", { name: "Persona Verificada", email: verifiedEmail, password, callbackURL: "/academia/mi-academia" }, undefined, "198.51.100.22");
    await prisma.user.update({ where: { email: verifiedEmail }, data: { emailVerified: true } });
    clearTestEmailOutbox();
    const response = await call("/send-verification-email", { email: verifiedEmail, callbackURL: "/academia/mi-academia" }, undefined, "198.51.100.23");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });
    expect(getTestEmailOutbox()).toHaveLength(0);
  });

  it("5. responde de forma neutra y no envía para un email inexistente", async () => {
    const { clearTestEmailOutbox, getTestEmailOutbox } = await import("../src/lib/email/service");
    clearTestEmailOutbox();
    const response = await call("/send-verification-email", { email: missingEmail, callbackURL: "/academia/mi-academia" }, undefined, "198.51.100.24");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });
    expect(getTestEmailOutbox()).toHaveLength(0);
  });

  it("6. limita el reenvío a tres solicitudes por minuto", async () => {
    const { clearTestEmailOutbox, getTestEmailOutbox } = await import("../src/lib/email/service");
    await call("/sign-up/email", { name: "Persona Limitada", email: limitedEmail, password, callbackURL: "/academia/mi-academia" }, undefined, "198.51.100.25");
    clearTestEmailOutbox();
    await prisma.rateLimit.deleteMany();
    const responses = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      responses.push(await call("/send-verification-email", { email: limitedEmail, callbackURL: "/academia/mi-academia" }, undefined, "198.51.100.26"));
    }
    expect(responses.map(response => response.status)).toEqual([200, 200, 200, 429]);
    expect(responses[3].headers.get("x-retry-after")).toBeTruthy();
    expect(getTestEmailOutbox()).toHaveLength(3);
  });

  it("7. inicia sesión con credenciales válidas", async () => {
    expect(verificationUrl).toBeTruthy();
    const verification = await auth.handler(new Request(verificationUrl, { redirect: "manual" }));
    expect([302, 303]).toContain(verification.status);
    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).emailVerified).toBe(true);
    const response = await call("/sign-in/email", { email, password });
    expect(response.status).toBe(200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    expect(cookie).toContain("cis-academia.session_token");
  });

  it("8. rechaza un login inválido con un mensaje no enumerativo", async () => {
    const response = await call("/sign-in/email", { email, password: "Incorrecta123!" });
    expect(response.status).toBe(401);
  });

  it("9. no devuelve sesión para una ruta privada sin cookie", async () => {
    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });

  it("10. devuelve el usuario para una ruta privada con sesión", async () => {
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.email).toBe(email);
  });

  it("11. impide que USER supere requireAdmin", async () => {
    const { assertAdmin, AuthorizationError } = await import("../src/lib/auth/policy");
    expect(() => assertAdmin({ id: "u", name: "User", email, emailVerified: true, role: "USER" })).toThrow(AuthorizationError);
  });

  it("12. bloquea redirects externos", async () => {
    const { safeInternalRedirect } = await import("../src/lib/auth/redirect");
    expect(safeInternalRedirect("https://example.com/robo")).toBe("/academia/mi-academia");
    expect(safeInternalRedirect("//example.com/robo")).toBe("/academia/mi-academia");
    expect(safeInternalRedirect("/academia/mi-academia?tab=perfil")).toBe("/academia/mi-academia?tab=perfil");
  });

  it("13. procesa recuperación sin enviar correo real", async () => {
    const { clearTestEmailOutbox, getTestEmailOutbox } = await import("../src/lib/email/service");
    clearTestEmailOutbox();
    const response = await call("/request-password-reset", { email, redirectTo: "/restablecer-clave" });
    expect(response.status).toBe(200);
    expect(getTestEmailOutbox()).toHaveLength(1);
    expect(getTestEmailOutbox()[0].to).toBe(email);
  });

  it("14. cierra sesión e invalida la cookie", async () => {
    const response = await call("/sign-out", {}, cookie);
    expect(response.status).toBe(200);
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session).toBeNull();
  });
});
