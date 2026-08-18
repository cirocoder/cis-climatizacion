import "server-only";
import { z } from "zod";

const authEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL debe ser una URL válida"),
  APP_URL: z.url("APP_URL debe ser una URL válida"),
});

const emailEnvironmentSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY es obligatoria"),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM es obligatorio"),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;
export type EmailEnvironment = z.infer<typeof emailEnvironmentSchema>;

export function isAuthConfigured() {
  return authEnvironmentSchema.safeParse(process.env).success;
}

export function isEmailConfigured() {
  return process.env.NODE_ENV === "test" || emailEnvironmentSchema.safeParse(process.env).success;
}

export function getAuthEnvironment(): AuthEnvironment {
  const result = authEnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Configuración de autenticación incompleta: ${result.error.issues.map(issue => issue.message).join("; ")}`);
  }
  return result.data;
}

export function getEmailEnvironment(): EmailEnvironment {
  const result = emailEnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error("El envío de correo no está configurado. Definí RESEND_API_KEY y EMAIL_FROM.");
  }
  return result.data;
}
