import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { assertAdmin, AuthorizationError } from "@/lib/auth/policy";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { isAuthConfigured } from "@/lib/env/server";

export { AuthorizationError };

export async function getCurrentUser() {
  if (!isAuthConfigured()) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return { ...session.user, role: session.user.role === "ADMIN" ? "ADMIN" as const : "USER" as const };
}

export async function requireUser(returnTo = "/academia/mi-academia") {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?callbackUrl=${encodeURIComponent(safeInternalRedirect(returnTo))}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  return assertAdmin(user);
}
