import { site } from "@/data/site";

export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    name: site.name,
    description: site.tagline,
    url: site.url,
    logo: new URL(site.brand.logo, site.url).toString(),
    telephone: site.phone.display,
    email: site.email.display,
    sameAs: [site.instagram.url],
    areaServed: { "@type": "AdministrativeArea", name: site.coverage },
    address: { "@type": "PostalAddress", addressLocality: "Mendoza", addressRegion: "Mendoza", addressCountry: "AR" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de CIS Climatización",
      itemListElement: site.services.map(service => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.title, description: service.description, areaServed: site.coverage },
      })),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}