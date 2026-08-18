import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const suite = databaseUrl ? describe.sequential : describe.skip;

suite("identidad de CIS Academia", () => {
  const email = "persona.prueba@cis.test";
  const password = "ClaveSegura123!";
  let auth: Awaited<ReturnType<typeof import("../src/lib/auth/auth")["getAuth"]>>;
  let prisma: ReturnType<typeof import("../src/lib/db/prisma")["getPrisma"]>;
  let cookie = "";

  async function call(path: string, body?: object, requestCookie?: string) {
    const headers = new Headers({ origin: "http://localhost:3000" });
    if (body) headers.set("content-type", "application/json");
    if (requestCookie) headers.set("cookie", requestCookie);
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
    await prisma.verification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.verification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany({ where: { email } });
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

  it("3. inicia sesión con credenciales válidas", async () => {
    const { getTestEmailOutbox } = await import("../src/lib/email/service");
    const verificationUrl = getTestEmailOutbox().map(message => message.text.match(/https?:\/\/\S+/)?.[0]).find(Boolean);
    expect(verificationUrl).toBeTruthy();
    const verification = await auth.handler(new Request(verificationUrl!, { redirect: "manual" }));
    expect([302, 303]).toContain(verification.status);
    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).emailVerified).toBe(true);
    const response = await call("/sign-in/email", { email, password });
    expect(response.status).toBe(200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    expect(cookie).toContain("cis-academia.session_token");
  });

  it("4. rechaza un login inválido con un mensaje no enumerativo", async () => {
    const response = await call("/sign-in/email", { email, password: "Incorrecta123!" });
    expect(response.status).toBe(401);
  });

  it("5. no devuelve sesión para una ruta privada sin cookie", async () => {
    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });

  it("6. devuelve el usuario para una ruta privada con sesión", async () => {
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.email).toBe(email);
  });

  it("7. impide que USER supere requireAdmin", async () => {
    const { assertAdmin, AuthorizationError } = await import("../src/lib/auth/policy");
    expect(() => assertAdmin({ id: "u", name: "User", email, emailVerified: true, role: "USER" })).toThrow(AuthorizationError);
  });

  it("8. bloquea redirects externos", async () => {
    const { safeInternalRedirect } = await import("../src/lib/auth/redirect");
    expect(safeInternalRedirect("https://example.com/robo")).toBe("/academia/mi-academia");
    expect(safeInternalRedirect("//example.com/robo")).toBe("/academia/mi-academia");
    expect(safeInternalRedirect("/academia/mi-academia?tab=perfil")).toBe("/academia/mi-academia?tab=perfil");
  });

  it("9. procesa recuperación sin enviar correo real", async () => {
    const { clearTestEmailOutbox, getTestEmailOutbox } = await import("../src/lib/email/service");
    clearTestEmailOutbox();
    const response = await call("/request-password-reset", { email, redirectTo: "/restablecer-clave" });
    expect(response.status).toBe(200);
    expect(getTestEmailOutbox()).toHaveLength(1);
    expect(getTestEmailOutbox()[0].to).toBe(email);
  });

  it("10. cierra sesión e invalida la cookie", async () => {
    const response = await call("/sign-out", {}, cookie);
    expect(response.status).toBe(200);
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session).toBeNull();
  });
});
