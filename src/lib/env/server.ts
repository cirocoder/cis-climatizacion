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

const mercadoPagoEnvironmentSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, "MERCADOPAGO_ACCESS_TOKEN es obligatorio"),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, "MERCADOPAGO_WEBHOOK_SECRET es obligatorio"),
  MERCADOPAGO_COLLECTOR_ID: z.string().min(1, "MERCADOPAGO_COLLECTOR_ID es obligatorio"),
  MERCADOPAGO_ENVIRONMENT: z.enum(["TEST", "PRODUCTION"]).default("TEST"),
  APP_URL: z.url("APP_URL debe ser una URL válida"),
});

const r2EnvironmentSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID es obligatorio"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID es obligatorio"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY es obligatorio"),
  R2_BUCKET_NAME: z.string().min(3, "R2_BUCKET_NAME es obligatorio"),
  R2_ENDPOINT: z.url("R2_ENDPOINT debe ser una URL válida"),
  R2_REGION: z.literal("auto").default("auto"),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;
export type EmailEnvironment = z.infer<typeof emailEnvironmentSchema>;
export type MercadoPagoEnvironment = z.infer<typeof mercadoPagoEnvironmentSchema>;
export type R2Environment = z.infer<typeof r2EnvironmentSchema>;

export function isAuthConfigured() {
  return authEnvironmentSchema.safeParse(process.env).success;
}

export function isEmailConfigured() {
  return process.env.NODE_ENV === "test" || emailEnvironmentSchema.safeParse(process.env).success;
}

export function isMercadoPagoConfigured() {
  return mercadoPagoEnvironmentSchema.safeParse(process.env).success;
}

export function isR2Configured() {
  return r2EnvironmentSchema.safeParse(process.env).success;
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


export function getMercadoPagoEnvironment(): MercadoPagoEnvironment {
  const result = mercadoPagoEnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Configuración de Mercado Pago incompleta: ${result.error.issues.map(issue => issue.message).join("; ")}`);
  }
  return result.data;
}

export function getR2Environment(): R2Environment {
  const result = r2EnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Configuración de R2 incompleta: ${result.error.issues.map(issue => issue.message).join("; ")}`);
  }
  const endpoint = new URL(result.data.R2_ENDPOINT);
  if (endpoint.protocol !== "https:" || endpoint.hostname !== `${result.data.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`) {
    throw new Error("R2_ENDPOINT debe ser el endpoint S3 HTTPS correspondiente a R2_ACCOUNT_ID");
  }
  return result.data;
}
