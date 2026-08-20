import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { requireUser } from "@/lib/dal/auth";
import { getMyProducts } from "@/lib/dal/products";

export const metadata: Metadata = { title: { absolute: "Mi Academia | CIS Academia" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Argentina/Mendoza" });

export default async function MyAcademyPage() {
  const [user, products] = await Promise.all([requireUser("/academia/mi-academia"), getMyProducts()]);

  return <section className="academy-section account-section">
    <div className="academy-container account-shell">
      <header className="account-heading">
        <div><p className="academy-eyebrow">Mi Academia</p><h1>Hola, {user.name}</h1><p>Este es tu espacio personal dentro de CIS Academia.</p></div>
        <article className="account-card"><span>Cuenta</span><h2>{user.email}</h2><dl><div><dt>Correo</dt><dd>{user.emailVerified ? "Verificado" : "Pendiente de verificación"}</dd></div></dl><LogoutButton/></article>
      </header>
      <div className="academy-library" aria-labelledby="mi-biblioteca">
        <div className="academy-library-heading"><div><p className="academy-eyebrow">Biblioteca personal</p><h2 id="mi-biblioteca">Tus productos</h2></div><span>{products.length} {products.length === 1 ? "producto" : "productos"}</span></div>
        {products.length === 0 ? <div className="academy-library-empty"><div aria-hidden="true">5P</div><h3>Todavía no tenés productos asociados</h3><p>Podés conocer el catálogo público y los próximos lanzamientos de CIS Academia.</p><Link className="academy-button academy-button-primary" href="/academia">Explorar CIS Academia</Link></div> : <div className="academy-library-grid">
          {products.map(({ product, ...entitlement }) => <article className="academy-library-card" key={product.id}><div className="academy-library-card-top"><span>{product.type === "KIT" ? "Kit" : "Curso"}</span><small>Acceso activo</small></div><h3>{product.title}</h3><p>{product.description}</p><div className="academy-access-detail"><span>Vigencia</span><strong>{entitlement.expiresAt === null ? "Acceso permanente" : `Hasta el ${dateFormatter.format(entitlement.expiresAt)}`}</strong></div><Link className="academy-button academy-button-primary" href={`/academia/mi-academia/productos/${product.slug}`}>Entrar al producto</Link></article>)}
        </div>}
      </div>
    </div>
  </section>;
}
