import "server-only";
import { Resend } from "resend";
import { getEmailEnvironment } from "@/lib/env/server";

export type CapturedEmail = { to: string; subject: string; text: string };
const testState = globalThis as unknown as { cisEmailOutbox?: CapturedEmail[] };

export function getTestEmailOutbox() {
  if (process.env.NODE_ENV !== "test") throw new Error("El buzón de pruebas sólo está disponible durante tests.");
  return (testState.cisEmailOutbox ??= []);
}

export function clearTestEmailOutbox() {
  getTestEmailOutbox().length = 0;
}

export async function sendAuthEmail(message: CapturedEmail) {
  if (process.env.NODE_ENV === "test") {
    getTestEmailOutbox().push(message);
    return;
  }

  const { RESEND_API_KEY, EMAIL_FROM } = getEmailEnvironment();
  const resend = new Resend(RESEND_API_KEY);
  const result = await resend.emails.send({ from: EMAIL_FROM, ...message });
  if (result.error) throw new Error("El proveedor de correo rechazó el envío.");
}
