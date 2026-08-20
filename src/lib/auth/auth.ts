import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrisma } from "@/lib/db/prisma";
import { getAuthEnvironment } from "@/lib/env/server";
import { sendAuthEmail } from "@/lib/email/service";

function createAuth() {
  const environment = getAuthEnvironment();

  return betterAuth({
    appName: "CIS Academia",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    trustedOrigins: [environment.APP_URL, environment.BETTER_AUTH_URL],
    database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/send-verification-email": { window: 60, max: 3 },
      },
    },
    user: {
      additionalFields: {
        role: { type: ["USER", "ADMIN"], required: false, defaultValue: "USER", input: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Restablecé tu contraseña de CIS Academia",
          text: `Recibimos una solicitud para restablecer tu contraseña. Usá este enlace durante la próxima hora: ${url}`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Verificá tu cuenta de CIS Academia",
          text: `Confirmá tu correo electrónico para activar la cuenta: ${url}`,
        });
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    advanced: {
      cookiePrefix: "cis-academia",
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    },
  });

}

type AuthInstance = ReturnType<typeof createAuth>;
let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}

export type AuthSession = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;
