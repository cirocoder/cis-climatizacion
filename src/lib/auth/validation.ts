import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Ingresá un correo electrónico válido.");
const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128, "La contraseña es demasiado larga.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre.").max(80, "El nombre es demasiado largo."),
  email,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Ingresá tu contraseña.") });
export const recoverySchema = z.object({ email });
export const resetPasswordSchema = z.object({ password });
