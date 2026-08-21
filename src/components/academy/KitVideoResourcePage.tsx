import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import type { KitVideoResourceAlias } from "@/data/resources";
import { getCurrentUser } from "@/lib/dal/auth";
import { resolveKitVideoResourcePortal } from "@/lib/resources/portal";

type Props = {
  alias: KitVideoResourceAlias;
  pathname: "/academia/kit-5p/recursos/unidad-interior" | "/academia/kit-5p/recursos/unidad-exterior";
  heading: string;
};

export async function KitVideoResourcePage({ alias, pathname, heading }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?callbackUrl=${encodeURIComponent(pathname)}`);

  const portal = await resolveKitVideoResourcePortal(user.id, alias);
  if (portal.state === "NO_ACCESS") {
    return <section className="academy-section video-resource-page"><div className="academy-container video-resource-shell">
      <Link className="resources-back" href="/academia/kit-5p/recursos">← Volver a Recursos</Link>
      <div className="video-resource-message"><div className="video-resource-icon"><Icon name="screen"/></div><p className="academy-eyebrow">Kit CIS 5P</p><h1>{heading}</h1><p>Este recurso forma parte del Kit CIS 5P y requiere una cuenta con acceso activo.</p><div className="academy-actions"><Link className="academy-button academy-button-primary" href="/academia/kit-5p">Conocer el Kit CIS 5P</Link><Link className="academy-button academy-button-secondary" href="/academia/mi-academia">Ir a Mi Academia</Link></div></div>
    </div></section>;
  }

  if (portal.state !== "AUTHORIZED") {
    return <section className="academy-section video-resource-page"><div className="academy-container video-resource-shell"><Link className="resources-back" href="/academia/kit-5p/recursos">← Volver a Recursos</Link><div className="video-resource-message"><p className="academy-eyebrow">Kit CIS 5P</p><h1>Recurso no disponible</h1><p>Este material no está publicado actualmente.</p></div></div></section>;
  }

  const { resource } = portal;
  const available = resource.status === "AVAILABLE";
  const accessUrl = `/api/academy/resources/${encodeURIComponent(resource.id)}/access?disposition=inline`;

  return <section className="academy-section video-resource-page"><div className="academy-container video-resource-shell">
    <Link className="resources-back" href="/academia/kit-5p/recursos">← Volver a Recursos</Link>
    <header className="video-resource-heading"><div><p className="academy-eyebrow">Kit CIS 5P · Video</p><h1>{heading}</h1><p>Recurso audiovisual asociado a tu producto.</p></div><span className={`resource-status ${available ? "is-available" : "is-upcoming"}`}>{available ? "Disponible" : "Próximamente"}</span></header>
    {available ? <div className="video-resource-player"><video controls preload="metadata" src={accessUrl} aria-label={resource.title}/><p>El acceso al video utiliza una URL privada y temporal.</p></div> : <div className="video-resource-coming"><div aria-hidden="true"><Icon name="screen"/></div><strong>Próximamente</strong><p>El video todavía no fue publicado. Esta URL permanecerá estable cuando el recurso esté disponible.</p></div>}
  </div></section>;
}
