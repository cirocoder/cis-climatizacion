import type { Metadata } from "next";
import Link from "next/link";
import { FivePDiagram } from "@/components/AcademyShell";
import { Icon } from "@/components/icons";
import { academy, academyWhatsappUrl } from "@/data/academy";

const product = academy.featuredProduct;

export const metadata: Metadata = {
  title: { absolute: `${product.name} | ${academy.name}` },
  description: product.description,
  alternates: { canonical: `${academy.url}/kit-5p` },
  openGraph: { title: `${product.name} | ${academy.name}`, description: product.description, url: `${academy.url}/kit-5p`, siteName: academy.name, type: "website" },
};

export default function KitFivePPage() {
  const launchUrl = academyWhatsappUrl(product.launchMessage);
  const schema = { "@context": "https://schema.org", "@type": "Book", name: product.name, description: product.description, author: { "@type": "Organization", name: academy.name }, url: `${academy.url}/kit-5p`, bookFormat: "https://schema.org/EBook" };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}/>
    <section className="kit-hero academy-section">
      <div className="academy-container kit-hero-grid"><div><p className="academy-eyebrow">{academy.name} · {product.format}</p><h1>{product.name}</h1><h2>{product.title}</h2><p>{product.description}</p><div className="academy-actions"><a className="academy-button academy-button-primary" href={launchUrl}>Quiero enterarme del lanzamiento <Icon name="arrow"/></a><Link className="academy-button academy-button-secondary" href="/academia/kit-5p/recursos">Ver recursos</Link></div><small className="kit-no-payment">Sin pagos habilitados en esta etapa.</small></div><div className="kit-cover" aria-hidden="true"><span>CIS Academia</span><strong>Kit CIS <b>5P</b></strong><small>Mantenimiento preventivo de Split</small><FivePDiagram compact/></div></div>
    </section>

    <section className="academy-section kit-problem"><div className="academy-container kit-problem-grid"><div><p className="academy-eyebrow">El problema</p><h2>Un mantenimiento no debería depender de la improvisación</h2><p>Cada paso necesita un motivo, un orden y un resultado que pueda registrarse.</p></div><blockquote><Icon name="shield"/><strong>{product.rule}</strong><p>Si el equipo no enfría, no enciende o presenta una falla antes de intervenirlo, el servicio cambia a diagnóstico y reparación.</p></blockquote></div></section>

    <section className="academy-section kit-method" aria-labelledby="metodo-5p"><div className="academy-container"><div className="academy-section-head"><p className="academy-eyebrow">El método</p><h2 id="metodo-5p">Cinco pasos para ordenar el servicio</h2></div><FivePDiagram/><div className="method-detail-grid">{product.method.map(step => <article key={step.number}><span>{step.number}</span><div><h3>{step.name}</h3><p>{step.summary}</p></div></article>)}</div></div></section>

    <section className="academy-section kit-includes" aria-labelledby="incluye"><div className="academy-container kit-includes-grid"><div><p className="academy-eyebrow">Qué incluye</p><h2 id="incluye">Contenido construido alrededor del trabajo real</h2><p>El Kit reúne el procedimiento, las mediciones y la presentación final en una misma secuencia.</p></div><ul>{product.includes.map(item => <li key={item}><Icon name="check"/><span>{item}</span></li>)}</ul></div></section>

    <section className="academy-section kit-previews" aria-labelledby="previews"><div className="academy-container"><div className="academy-section-head"><p className="academy-eyebrow">Previews</p><h2 id="previews">Herramientas para ejecutar y documentar</h2></div><div className="preview-grid">{product.previews.map((preview, index) => <article className={`preview-card preview-${preview.id}`} key={preview.id}><div className="preview-ui" aria-hidden="true">{index === 0 ? <><i/><i/><i/><i/><i/></> : index === 1 ? <><b>PSI</b><i/><b>ΔT</b><i/><b>A</b></> : <><span>INFORME TÉCNICO</span><i/><i/><i/><i/></>}</div><small>{preview.label}</small><h3>{preview.title}</h3><p>{preview.description}</p></article>)}</div></div></section>

    <section className="academy-section kit-launch"><div className="academy-container kit-launch-card"><div><p className="academy-eyebrow">Próximo lanzamiento</p><h2>Recibí la información del Kit CIS 5P</h2><p>No hay pagos habilitados. La consulta abre WhatsApp con el mensaje preparado.</p></div><a className="academy-button academy-button-primary" href={launchUrl}>Quiero enterarme del lanzamiento <Icon name="arrow"/></a></div></section>
  </>;
}
