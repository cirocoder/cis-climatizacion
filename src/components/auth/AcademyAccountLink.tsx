"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export function AcademyAccountLink() {
  const { data: session } = authClient.useSession();
  return <Link className="academy-auth-link" href={session ? "/academia/mi-academia" : "/ingresar"}>{session ? "Mi Academia" : "Ingresar"}</Link>;
}
