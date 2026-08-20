import type { Metadata } from "next";
import Link from "next/link";
import { academy } from "@/data/academy";
import { requireProductAccess } from "@/lib/dal/products";

export const metadata: Metadata = { title: { absolute: "Producto | Mi Academia" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PrivateProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const returnTo = `/academia/mi-academia/productos/${encodeURIComponent(slug)}`;
  const { product, entitlement } = await requireProductAccess(slug, returnTo);
  return <section className="academy-section private-product-section"><div className="academy-container private-product-shell"><Link className="resources-back" href="/academia/mi-academia">← Volver a Mi Academia</Link><header className="private-product-header"><div><p className="academy-eyebrow">Tu producto · {product.type === "KIT" ? "Kit" : "Curso"}</p><h1>{product.title}</h1><p>{product.description}</p></div><div className="private-access-card"><span>Estado del acceso</span><strong>Activo</strong><small>{entitlement.expiresAt === null ? "Acceso permanente" : "Acceso con vencimiento"}</small></div></header><div className="private-welcome"><span aria-hidden="true">5P</span><div><h2>Te damos la bienvenida</h2><p>Este espacio reúne los recursos asociados a tu Kit CIS 5P. Los materiales se habilitarán aquí cuando estén disponibles.</p></div></div><section className="private-resources" aria-labelledby="recursos-privados"><div className="academy-section-head"><p className="academy-eyebrow">Contenido del producto</p><h2 id="recursos-privados">Recursos del Kit</h2></div><div className="private-resource-grid">{academy.resources.map(resource => <article key={resource.id}><span className="resource-status is-upcoming">Próximamente</span><h3>{resource.title}</h3><p>{resource.description}</p></article>)}</div></section></div></section>;
}
