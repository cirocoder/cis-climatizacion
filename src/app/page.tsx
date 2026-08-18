import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Header } from "@/components/Header";
import { ProjectGallery } from "@/components/ProjectGallery";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Icon } from "@/components/icons";
import { academy } from "@/data/academy";
import { serviceMessage, site, whatsappUrl } from "@/data/site";

export default function Home() {
  const product = academy.featuredProduct;
  return <><Header/><main id="contenido">
    <section className="hero" id="inicio"><div className="container hero-grid hero-grid-copy-only"><div className="hero-copy"><p className="eyebrow">Servicios técnicos · Mendoza</p><h1>{site.tagline}</h1><p className="hero-lead">Atención en {site.coverage}.</p><div className="actions"><a className="button" href={whatsappUrl(serviceMessage("servicios de CIS Climatización"))}>Solicitar presupuesto por WhatsApp <Icon name="arrow"/></a><a className="button button-ghost" href="#servicios">Ver nuestros servicios</a></div></div></div></section>

    <section className="audience"><div className="container audience-row"><span>Soluciones en</span>{["Aire acondicionado", "Refrigeración", "Gas", "Calefacción", "Electricidad"].map(x => <b key={x}>{x}</b>)}</div></section>

    <section className="section" id="servicios"><div className="container"><div className="section-head"><div><p className="eyebrow">Servicios prioritarios</p><h2>Soluciones técnicas para climatización e instalaciones</h2></div><p>{site.tagline}</p></div><div className="service-grid">{site.services.map((s, i) => <article className="service-card" key={s.title}><div className="service-top"><span className="service-icon"><Icon name={s.icon}/></span><span className="service-number">0{i+1}</span></div><h3>{s.title}</h3><p>{s.description}</p><ul>{s.items.map(item => <li key={item}><Icon name="check"/>{item}</li>)}</ul><a href={whatsappUrl(serviceMessage(s.title))}>Consultar por este servicio <Icon name="arrow"/></a></article>)}</div></div></section>

    <section className="section projects" id="trabajos"><div className="container"><div className="section-head projects-head"><div><p className="eyebrow">Galería de trabajos</p><h2>{site.projectsSection.title}</h2></div><p>{site.projectsSection.intro}</p></div><ProjectGallery projects={site.projects}/></div></section>
    <section className="section training" id="capacitaciones"><div className="container training-layout">
      <div className="training-copy">
        <p className="eyebrow light">{academy.descriptor}</p>
        <div className="training-heading"><h2>{academy.name}</h2><div className="training-learning-mark" aria-hidden="true"><svg viewBox="0 0 120 88" fill="none"><rect x="20" y="12" width="80" height="54" rx="7"/><path d="M13 75h94M44 66l-4 9m36-9 4 9"/><path d="m54 30 18 9-18 9V30Z"/><path d="M8 24h7m90 0h7M8 52h7m90 0h7"/></svg></div></div>
        <div className="training-instructor"><Icon name="screen"/><p>{academy.intro}</p></div>
        <div className="training-highlights" aria-label="Información destacada del Kit CIS 5P">
          <div><Icon name="screen"/><span>Formato</span><strong>{product.format}</strong></div>
          <div><Icon name="check"/><span>Método</span><strong>CIS 5P</strong></div>
          <div><Icon name="calendar"/><span>Estado</span><strong>{product.status}</strong></div>
          <div><Icon name="certificate"/><span>Producto destacado</span><strong>{product.name}: {product.title}</strong></div>
        </div>
        <div className="actions training-actions"><Link className="button button-red" href="/academia">Conocer CIS Academia</Link><Link className="button training-secondary" href="/academia/kit-5p">Ver Kit CIS 5P <Icon name="arrow"/></Link></div>
      </div>
      <div className="course-grid course-grid-single"><article className="course-card">
        <div className="course-card-head"><span className="status">{product.status}</span></div>
        <h3>{product.name}</h3>
        <p className="academy-training-product-title">{product.title}</p>
        <dl className="course-facts">
          <div><dt><Icon name="screen"/><span>Formato</span></dt><dd>{product.format}</dd></div>
          <div><dt><Icon name="check"/><span>Método</span></dt><dd>Preparación · Procedimiento · Parámetros · Prueba · Presentación</dd></div>
          <div><dt><Icon name="calendar"/><span>Estado</span></dt><dd>{product.status}</dd></div>
        </dl>
        <div className="course-instructor"><Icon name="check"/><span>Incluye</span><strong>{product.includes.join(" · ")}</strong></div>
        <div className="course-certificate"><Icon name="arrow"/><span>Continuar</span><strong>Información completa, previews y registro para el lanzamiento en CIS Academia.</strong></div>
      </article></div>
    </div></section>

    <section className="section about" id="nosotros"><div className="container about-grid"><div className="about-mark"><Image src={site.brand.logo} width={320} height={320} sizes="(max-width: 760px) 190px, 320px" alt={`Logo de ${site.brand.name}`}/></div><div><p className="eyebrow">Sobre CIS</p><h2>{site.name}</h2><p>{site.tagline}</p><p>Servicios en {site.coverage}.</p></div></div></section>

    <section className="section faq" id="preguntas"><div className="container narrow"><div className="section-head"><div><p className="eyebrow">Preguntas frecuentes</p><h2>Información sobre servicios y formación</h2></div></div>{[...site.faqs, ...academy.faqs].map(([q,a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>

    <section className="section contact" id="contacto"><div className="container contact-grid"><div><p className="eyebrow light">Contacto</p><h2>Contactá a CIS Climatización</h2><p>Solicitá un presupuesto, realizá una consulta o pedí información sobre CIS Academia.</p><address><div><span>WhatsApp</span><a href={whatsappUrl(serviceMessage("servicios de CIS Climatización"))}>{site.phone.display}</a></div><div><span>Teléfono</span><a href={site.phone.href}>{site.phone.display}</a></div><div><span>Correo electrónico</span><a href={site.email.href}>{site.email.display}</a></div><div><span>Instagram</span><a href={site.instagram.url} target="_blank" rel="noreferrer">{site.instagram.handle}</a></div><div><span>Zona de atención</span><b>{site.coverage}</b></div><div><span>Horarios</span><b>{site.hours}</b></div></address></div><ContactForm/></div></section>
  </main><footer><div className="container footer-grid"><div className="brand footer-brand"><Image src={site.brand.logo} alt="" width={58} height={58} sizes="58px"/><span><b>CIS</b><small>Climatización</small></span></div><p>Aire acondicionado · Refrigeración · Gas · Calefacción · Electricidad</p><p>© {new Date().getFullYear()} {site.name}. {site.location}.</p></div></footer><WhatsAppFloat/></>;
}
