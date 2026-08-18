"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return <button className="academy-button academy-button-secondary" type="button" disabled={loading} onClick={async () => {
    setLoading(true);
    await authClient.signOut();
    router.push("/ingresar");
    router.refresh();
  }}>{loading ? "Cerrando…" : "Cerrar sesión"}</button>;
}
