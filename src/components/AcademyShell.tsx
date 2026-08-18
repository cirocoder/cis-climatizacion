import Image from "next/image";
import Link from "next/link";
import { academy } from "@/data/academy";
import { site } from "@/data/site";

export function AcademyHeader() {
  return <header className="academy-header">
    <div className="academy-header-inner">
      <Link className="academy-brand" href="/academia" aria-label={`${academy.name}, inicio`}>
        <Image src={site.brand.logo} alt="" width={58} height={58} sizes="58px" priority/>
        <span><strong>{academy.name}</strong><small>{academy.descriptor}</small></span>
      </Link>
      <nav className="academy-nav" aria-label="Navegación de CIS Academia">
        <Link href="/academia">Academia</Link>
        <Link href="/academia/kit-5p">Kit CIS 5P</Link>
        <Link href="/academia/kit-5p/recursos">Recursos</Link>
        <Link className="academy-back-link" href="/">CIS Climatización</Link>
      </nav>
    </div>
  </header>;
}

export function AcademyFooter() {
  return <footer className="academy-footer">
    <div className="academy-footer-inner">
      <div><strong>{academy.name}</strong><span>{academy.descriptor}</span></div>
      <nav aria-label="Enlaces del pie de CIS Academia"><Link href="/academia/kit-5p">Kit CIS 5P</Link><Link href="/academia/kit-5p/recursos">Recursos</Link><Link href="/">CIS Climatización</Link></nav>
      <p>© {new Date().getFullYear()} {site.name}.</p>
    </div>
  </footer>;
}

export function FivePDiagram({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "five-p-diagram compact" : "five-p-diagram"} aria-label="Método CIS 5P">
    {academy.featuredProduct.method.map(step => <div className="five-p-node" key={step.number}>
      <span>{step.number}</span><strong>{step.initial}</strong><small>{step.name}</small>
    </div>)}
  </div>;
}
