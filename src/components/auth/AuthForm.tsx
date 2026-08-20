"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { loginSchema, recoverySchema, registerSchema, resetPasswordSchema } from "@/lib/auth/validation";

type AuthMode = "login" | "register" | "recovery" | "reset";
type Props = { mode: AuthMode; callbackUrl?: string; token?: string };
type RequestStatus = "idle" | "loading" | "success" | "error";

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

function requestCode(error: unknown) {
  if (typeof error !== "object" || !error || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

function requestStatus(error: unknown) {
  if (typeof error !== "object" || !error || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

export function AuthForm({ mode, callbackUrl, token }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [showVerificationActions, setShowVerificationActions] = useState(false);
  const [resendStatus, setResendStatus] = useState<RequestStatus>("idle");
  const [resendMessage, setResendMessage] = useState("");
  const content = copy[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("loading");
    setMessage("");
    setShowVerificationActions(false);
    setResendStatus("idle");
    setResendMessage("");
    const form = new FormData(formElement);
    let submittedEmail = "";
    let registrationAccepted = false;

    try {
      if (mode === "register") {
        const values = registerSchema.parse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
        submittedEmail = values.email;
        setVerificationEmail(values.email);
        const result = await authClient.signUp.email({ ...values, callbackURL: "/academia/mi-academia" });
        if (result.error) throw result.error;
        registrationAccepted = true;
        const verificationResult = await authClient.sendVerificationEmail({
          email: values.email,
          callbackURL: "/academia/mi-academia",
        });
        if (verificationResult.error) throw verificationResult.error;
        setStatus("success");
        setShowVerificationActions(true);
        setMessage("La solicitud quedó registrada. Si acabás de crear la cuenta, revisá tu correo. Si ya tenías una cuenta pendiente, podés reenviar el enlace.");
        formElement.reset();
        return;
      }

      if (mode === "login") {
        const values = loginSchema.parse({ email: form.get("email"), password: form.get("password") });
        submittedEmail = values.email;
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
      formElement.reset();
    } catch (error) {
      setStatus("error");
      if (error instanceof Error && error.message === "TOKEN_MISSING") {
        setMessage("El enlace de recuperación no es válido o está incompleto.");
      } else if (error instanceof Error && error.name === "ZodError") {
        setMessage(error.message.includes("[") ? "Revisá los datos ingresados y volvé a intentar." : error.message);
      } else if (mode === "login" && requestCode(error) === "EMAIL_NOT_VERIFIED") {
        setVerificationEmail(submittedEmail);
        setShowVerificationActions(true);
        setMessage("La cuenta todavía necesita verificación. Podés solicitar un nuevo enlace sin volver a registrarte.");
      } else if (mode === "register") {
        setVerificationEmail(submittedEmail);
        setShowVerificationActions(Boolean(submittedEmail));
        if (registrationAccepted && requestStatus(error) === 429) {
          setMessage("La solicitud quedó registrada, pero alcanzaste el límite temporal de correos. Esperá un minuto y reenviá el enlace.");
        } else if (registrationAccepted) {
          setMessage(messageFrom(error, "La solicitud quedó registrada, pero no pudimos enviar el correo de verificación. Podés reintentar el enlace."));
        } else {
          setMessage(messageFrom(error, "No pudimos completar la solicitud. Intentá nuevamente."));
        }
      } else {
        const fallback = mode === "login" ? "No pudimos iniciar sesión. Revisá tus datos y verificá tu correo." : "No pudimos completar la solicitud. Intentá nuevamente.";
        setMessage(messageFrom(error, fallback));
      }
    }
  }

  async function resendVerification() {
    if (!verificationEmail || resendStatus === "loading") return;
    setResendStatus("loading");
    setResendMessage("");

    try {
      const result = await authClient.sendVerificationEmail({
        email: verificationEmail,
        callbackURL: "/academia/mi-academia",
      });
      if (result.error) throw result.error;
      setResendStatus("success");
      setResendMessage("Si el correo corresponde a una cuenta pendiente de verificación, recibirás un nuevo enlace.");
    } catch (error) {
      setResendStatus("error");
      if (requestStatus(error) === 429) {
        setResendMessage("Alcanzaste el límite temporal de solicitudes. Esperá un minuto antes de volver a intentar.");
      } else {
        setResendMessage(messageFrom(error, "No pudimos completar el intento de envío en este momento. Intentá nuevamente más tarde."));
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
      {verificationEmail && showVerificationActions && <div className="auth-verification-actions">
        <button className="academy-button academy-button-secondary" type="button" onClick={resendVerification} disabled={resendStatus === "loading"}>
          {resendStatus === "loading" ? "Solicitando…" : "Reenviar correo de verificación"}
        </button>
        {resendMessage && <p className={`auth-message is-${resendStatus}`} role={resendStatus === "error" ? "alert" : "status"} aria-live="polite">{resendMessage}</p>}
      </div>}
      <button className="academy-button academy-button-primary auth-submit" type="submit" disabled={status === "loading"}>{status === "loading" ? "Procesando…" : content.submit}</button>
      <div className="auth-form-links">
        {mode === "login" && <><Link href="/recuperar-cuenta">Olvidé mi contraseña</Link><Link href="/registro">Crear una cuenta</Link></>}
        {mode === "register" && <Link href="/ingresar">Ya tengo una cuenta</Link>}
        {(mode === "recovery" || mode === "reset") && <Link href="/ingresar">Volver a ingresar</Link>}
      </div>
    </form>
  </section>;
}
