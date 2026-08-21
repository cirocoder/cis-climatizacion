import type { Metadata } from "next";
import Link from "next/link";
import { ResourceLibrary } from "@/components/academy/ResourceLibrary";
import { academy } from "@/data/academy";
import { getCurrentUser } from "@/lib/dal/auth";
import { resolveKitResourcePortal } from "@/lib/resources/portal";

export const metadata: Metadata = {
  title: { absolute: `Recursos del Kit CIS 5P | ${academy.name}` },
  description: "URL permanente de videos y plantillas complementarias del Kit CIS 5P.",
  alternates: { canonical: `${academy.url}/kit-5p/recursos` },
  openGraph: {
    title: `Recursos del Kit CIS 5P | ${academy.name}`,
    description: "URL permanente de videos y plantillas complementarias del Kit CIS 5P.",
    url: `${academy.url}/kit-5p/recursos`,
    siteName: academy.name,
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function KitResourcesPage() {
  const user = await getCurrentUser();
  const portal = await resolveKitResourcePortal(user?.id ?? null);
  const authorized = portal.access;
  return <>
    <section className="academy-section resources-hero"><div className="academy-container"><p className="academy-eyebrow">Kit CIS 5P</p><h1>Recursos</h1><p>Esta es la URL permanente de los materiales complementarios indicados en el ebook.</p></div></section>
    <section className="academy-section resources-list"><div className="academy-container">
      {authorized ? <><div className="resource-portal-message is-authorized"><p className="academy-eyebrow">Centro privado de recursos</p><h2>Tu Kit está listo</h2><p>Accedé al manual, las plantillas, la documentación y los videos incluidos en tu producto.</p></div><ResourceLibrary resources={authorized.resources}/></> : <div className="resource-portal-message"><p className="academy-eyebrow">{user ? "Acceso al producto" : "Acceso privado"}</p><h2>{user ? "Conocé el Kit CIS 5P" : "Iniciá sesión para ver tus recursos"}</h2><p>{user ? "Los recursos premium se habilitan únicamente para cuentas con acceso activo al Kit CIS 5P." : "Si ya adquiriste el Kit, ingresá con la cuenta asociada para abrir sus materiales."}</p><div className="academy-actions">{user ? <Link className="academy-button academy-button-primary" href="/academia/kit-5p">Ver el Kit CIS 5P</Link> : <Link className="academy-button academy-button-primary" href="/ingresar?callbackUrl=%2Facademia%2Fkit-5p%2Frecursos">Ingresar</Link>}<Link className="academy-button academy-button-secondary" href="/academia/kit-5p">Volver al Kit CIS 5P</Link></div></div>}
    </div></section>
  </>;
}
