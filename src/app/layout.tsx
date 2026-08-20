import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/data/site";
import { StructuredData } from "@/components/StructuredData";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "CIS Climatización | Servicios técnicos en Mendoza", template: "%s | CIS Climatización" },
  description: site.tagline,
  keywords: ["climatización en Mendoza", "aire acondicionado en Mendoza", "refrigeración comercial e industrial", "instalaciones de gas en Mendoza", "calderas y calefacción", "electricidad aplicada a climatización", "curso de aire acondicionado Split"],
  openGraph: { type: "website", locale: "es_AR", url: site.url, title: site.brand.name, description: site.tagline, siteName: site.brand.name, images: [{ url: site.brand.logo, width: 1448, height: 1086, alt: `Logo de ${site.brand.name}` }] },
  twitter: { card: "summary_large_image", title: site.brand.name, description: site.tagline, images: [site.brand.logo] },
  icons: { icon: site.brand.logo, apple: site.brand.logo },
  alternates: { canonical: site.url },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body><a className="skip-link" href="#contenido">Saltar al contenido</a><StructuredData/>{children}</body></html>;
}
