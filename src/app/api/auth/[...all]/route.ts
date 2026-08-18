import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/auth";
import { isEmailConfigured } from "@/lib/env/server";

function emailIsRequired(request: Request) {
  const path = new URL(request.url).pathname;
  return ["/sign-up/email", "/forget-password", "/request-password-reset", "/send-verification-email"].some(endpoint => path.endsWith(endpoint));
}

function handlers() {
  return toNextJsHandler(getAuth());
}

export async function GET(request: Request) {
  return handlers().GET(request);
}

export async function POST(request: Request) {
  if (emailIsRequired(request) && !isEmailConfigured()) {
    return Response.json({ message: "El correo transaccional todavía no está configurado." }, { status: 503 });
  }
  return handlers().POST(request);
}
