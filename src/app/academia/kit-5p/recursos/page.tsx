import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { academy } from "@/data/academy";

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

export default function KitResourcesPage() {
  return <>
    <section className="academy-section resources-hero"><div className="academy-container"><p className="academy-eyebrow">Kit CIS 5P</p><h1>Recursos</h1><p>Esta es la URL permanente de los materiales complementarios indicados en el ebook.</p></div></section>
    <section className="academy-section resources-list"><div className="academy-container"><div className="resource-grid">{academy.resources.map(resource => <article key={resource.id}><div><Icon name={resource.id.includes("video") ? "screen" : "certificate"}/><span className={`resource-status ${resource.status === "Disponible" ? "is-available" : "is-upcoming"}`}>{resource.status}</span></div><h2>{resource.title}</h2><p>{resource.description}</p>{resource.status === "Disponible" && resource.href ? <a className="academy-button academy-button-secondary" href={resource.href}>Abrir recurso <Icon name="arrow"/></a> : <span className="resource-unavailable" aria-label={`${resource.title}: próximamente`}>Se publicará aquí</span>}</article>)}</div><Link className="resources-back" href="/academia/kit-5p">← Volver al Kit CIS 5P</Link></div></section>
  </>;
}
