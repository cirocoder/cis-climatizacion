"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { loginSchema, recoverySchema, registerSchema, resetPasswordSchema } from "@/lib/auth/validation";

type AuthMode = "login" | "register" | "recovery" | "reset";
type Props = { mode: AuthMode; callbackUrl?: string; token?: string };

const copy = {
  login: { eyebrow: "Acceso", title: "Ingresar a CIS Academia", intro: "Accedé con tu correo y contraseña para consultar tu espacio personal.", submit: "Ingresar" },
  register: { eyebrow: "Nueva cuenta", title: "Crear una cuenta", intro: "Registrate para acceder a Mi Academia cuando haya contenidos asociados a tu perfil.", submit: "Crear cuenta" },
  recovery: { eyebrow: "Recuperación", title: "Recuperar tu cuenta", intro: "Ingresá tu correo. Si existe una cuenta, recibirás las instrucciones para restablecer la contraseña.", submit: "Solicitar instrucciones" },
  reset: { eyebrow: "Nueva contraseña", title: "Restablecer contraseña", intro: "Elegí una contraseña nueva de al menos ocho caracteres.", submit: "Guardar contraseña" },
} as const;

function messageFrom(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "status" in error && error.status === 503) return "El correo transaccional todavía no está configurado. Intentá nuevamente cuando el servicio esté habilitado.";
  return fallback;
}

export function AuthForm({ mode, callbackUrl, token }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const content = copy[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      if (mode === "register") {
        const values = registerSchema.parse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
        const result = await authClient.signUp.email({ ...values, callbackURL: "/academia/mi-academia" });
        if (result.error) throw result.error;
        setStatus("success");
        setMessage("Si los datos son válidos, recibirás un correo para verificar la cuenta antes de ingresar.");
        event.currentTarget.reset();
        return;
      }

      if (mode === "login") {
        const values = loginSchema.parse({ email: form.get("email"), password: form.get("password") });
        const result = await authClient.signIn.email(values);
        if (result.error) throw result.error;
        router.push(safeInternalRedirect(callbackUrl));
        router.refresh();
        return;
      }

      if (mode === "recovery") {
        const values = recoverySchema.parse({ email: form.get("email") });
        const result = await authClient.requestPasswordReset({ email: values.email, redirectTo: "/restablecer-clave" });
        if (result.error && result.error.status === 503) throw result.error;
        setStatus("success");
        setMessage("Si el correo corresponde a una cuenta, recibirás instrucciones para continuar.");
        return;
      }

      const values = resetPasswordSchema.parse({ password: form.get("password") });
      if (!token) throw new Error("TOKEN_MISSING");
      const result = await authClient.resetPassword({ newPassword: values.password, token });
      if (result.error) throw result.error;
      setStatus("success");
      setMessage("La contraseña fue actualizada. Ya podés ingresar con la nueva contraseña.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      if (error instanceof Error && error.message === "TOKEN_MISSING") {
        setMessage("El enlace de recuperación no es válido o está incompleto.");
      } else if (error instanceof Error && error.name === "ZodError") {
        setMessage(error.message.includes("[") ? "Revisá los datos ingresados y volvé a intentar." : error.message);
      } else {
        const fallback = mode === "login" ? "No pudimos iniciar sesión. Revisá tus datos y verificá tu correo." : "No pudimos completar la solicitud. Intentá nuevamente.";
        setMessage(messageFrom(error, fallback));
      }
    }
  }

  return <section className="auth-panel" aria-labelledby={`auth-${mode}-title`}>
    <div className="auth-panel-copy"><p className="academy-eyebrow">{content.eyebrow}</p><h1 id={`auth-${mode}-title`}>{content.title}</h1><p>{content.intro}</p></div>
    <form className="auth-form" onSubmit={submit} noValidate>
      {mode === "register" && <label>Nombre completo<input name="name" type="text" autoComplete="name" required minLength={2} maxLength={80}/></label>}
      {mode !== "reset" && <label>Correo electrónico<input name="email" type="email" inputMode="email" autoComplete="email" required/></label>}
      {(mode === "login" || mode === "register" || mode === "reset") && <label>{mode === "reset" ? "Nueva contraseña" : "Contraseña"}<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 8} maxLength={128}/></label>}
      {message && <p className={`auth-message is-${status}`} role={status === "error" ? "alert" : "status"} aria-live="polite">{message}</p>}
      <button className="academy-button academy-button-primary auth-submit" type="submit" disabled={status === "loading"}>{status === "loading" ? "Procesando…" : content.submit}</button>
      <div className="auth-form-links">
        {mode === "login" && <><Link href="/recuperar-cuenta">Olvidé mi contraseña</Link><Link href="/registro">Crear una cuenta</Link></>}
        {mode === "register" && <Link href="/ingresar">Ya tengo una cuenta</Link>}
        {(mode === "recovery" || mode === "reset") && <Link href="/ingresar">Volver a ingresar</Link>}
      </div>
    </form>
  </section>;
}
