import type { Metadata } from "next";
import Link from "next/link";
import { ResourceActions, ResourceLibrary } from "@/components/academy/ResourceLibrary";
import { requireProductAccess } from "@/lib/dal/products";
import { findAuthorizedProductResources } from "@/lib/resources/access";

export const metadata: Metadata = { title: { absolute: "Producto | Mi Academia" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PrivateProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const returnTo = `/academia/mi-academia/productos/${encodeURIComponent(slug)}`;
  const { user, product, entitlement } = await requireProductAccess(slug, returnTo);
  const authorized = await findAuthorizedProductResources(user.id, slug);
  if (!authorized) return null;
  const manual = authorized.resources.find(resource => resource.type === "PDF");
  const [kitName, kitSubtitle = ""] = product.title.split(" — ", 2);

  return <section className="academy-section private-product-section"><div className="academy-container private-product-shell">
    <Link className="resources-back" href="/academia/mi-academia">← Volver a Mi Academia</Link>
    <header className="private-product-header">
      <div className="private-product-copy"><p className="academy-eyebrow">Tu producto · {product.type === "KIT" ? "Kit" : "Curso"}</p><h1>{kitName}</h1>{kitSubtitle ? <h2>{kitSubtitle}</h2> : null}<p>{product.description}</p><div className="private-product-actions">{manual?.status === "AVAILABLE" ? <ResourceActions resource={manual}/> : <span className="private-manual-pending">Manual próximamente</span>}<a className="academy-button academy-button-secondary" href="#tu-kit">Ver todos los recursos</a></div></div>
      <div className="private-product-mark" aria-hidden="true"><small>CIS Academia</small><strong>5P</strong><span>Acceso técnico</span></div>
      <div className="private-access-card"><span>Estado del acceso</span><strong>Activo</strong><small>{entitlement.expiresAt === null ? "Acceso permanente" : "Acceso con vencimiento"}</small></div>
    </header>
    <ResourceLibrary resources={authorized.resources}/>
  </div></section>;
}
