import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeInternalRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Ingresar a CIS Academia", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return <AuthForm mode="login" callbackUrl={safeInternalRedirect(callbackUrl)}/>;
}
