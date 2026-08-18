import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { requireUser } from "@/lib/dal/auth";

export const metadata: Metadata = { title: { absolute: "Mi Academia | CIS Academia" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MyAcademyPage() {
  const user = await requireUser("/academia/mi-academia");
  return <section className="academy-section account-section"><div className="academy-container account-grid"><div><p className="academy-eyebrow">Mi Academia</p><h1>Hola, {user.name}</h1><p>Este es tu espacio personal dentro de CIS Academia.</p></div><article className="account-card"><span>Cuenta</span><h2>{user.email}</h2><dl><div><dt>Correo</dt><dd>{user.emailVerified ? "Verificado" : "Pendiente de verificación"}</dd></div><div><dt>Contenido</dt><dd>Todavía no tenés productos asociados</dd></div></dl><LogoutButton/></article></div></section>;
}
