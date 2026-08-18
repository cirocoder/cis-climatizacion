import type { Metadata } from "next";
import Link from "next/link";
import { FivePDiagram } from "@/components/AcademyShell";
import { Icon } from "@/components/icons";
import { academy } from "@/data/academy";

export const metadata: Metadata = {
  title: { absolute: "CIS Academia | Formación Técnica" },
  description: `${academy.name}: formación práctica y recursos técnicos de CIS Climatización.`,
  alternates: { canonical: academy.url },
  openGraph: {
    title: "CIS Academia | Formación Técnica",
    description: `${academy.name}: formación práctica y recursos técnicos de CIS Climatización.`,
    url: academy.url,
    siteName: academy.name,
    type: "website",
  },
};

export default function AcademyPage() {
  const product = academy.featuredProduct;
  const upcoming = academy.upcomingProducts[0];
  return <>
    <section className="academy-hero academy-section">
      <div className="academy-container academy-hero-grid">
        <div className="academy-hero-copy"><p className="academy-eyebrow">{academy.descriptor}</p><h1>{academy.name}</h1><p>{academy.intro}</p><div className="academy-actions"><Link className="academy-button academy-button-primary" href="/academia/kit-5p">Conocer el Kit CIS 5P <Icon name="arrow"/></Link><Link className="academy-button academy-button-secondary" href="/academia/kit-5p/recursos">Ver recursos</Link></div></div>
        <div className="academy-hero-visual"><span>Primer producto destacado</span><h2>{product.name}</h2><p>{product.title}</p><FivePDiagram compact/></div>
      </div>
    </section>

    <section className="academy-section academy-featured" aria-labelledby="producto-destacado">
      <div className="academy-container academy-featured-grid">
        <div><p className="academy-eyebrow">Método · proceso · presentación</p><h2 id="producto-destacado">Un sistema para dejar de improvisar</h2><p>{product.description}</p><blockquote>{product.rule}</blockquote></div>
        <article className="academy-product-card"><div className="academy-product-card-top"><span>{product.status}</span><small>{product.format}</small></div><h3>{product.name}</h3><p>{product.title}</p><ul>{product.includes.slice(0, 4).map(item => <li key={item}><Icon name="check"/>{item}</li>)}</ul><Link href="/academia/kit-5p">Explorar el Kit <Icon name="arrow"/></Link></article>
      </div>
    </section>

    <section className="academy-section academy-upcoming" aria-labelledby="proxima-formacion">
      <div className="academy-container academy-upcoming-grid"><div><p className="academy-eyebrow">Próxima formación</p><h2 id="proxima-formacion">{upcoming.name}</h2><p>Instructor principal: {upcoming.instructor}.</p></div><dl><div><dt>Modalidad</dt><dd>{upcoming.modality}</dd></div><div><dt>Duración</dt><dd>{upcoming.duration}</dd></div><div><dt>Cupos</dt><dd>{upcoming.capacity}</dd></div><div><dt>Estado</dt><dd>{upcoming.status}</dd></div><div className="academy-upcoming-certificate"><dt>Certificado</dt><dd>{upcoming.certificate}</dd></div></dl></div>
    </section>
  </>;
}
