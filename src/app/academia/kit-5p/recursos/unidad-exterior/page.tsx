import type { Metadata } from "next";
import { KitVideoResourcePage } from "@/components/academy/KitVideoResourcePage";
import { academy } from "@/data/academy";

const pathname = "/academia/kit-5p/recursos/unidad-exterior" as const;

export const metadata: Metadata = {
  title: { absolute: `Video — Unidad exterior | ${academy.name}` },
  description: "Acceso privado al video de unidad exterior del Kit CIS 5P.",
  alternates: { canonical: `${academy.url}/kit-5p/recursos/unidad-exterior` },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ExteriorUnitVideoPage() {
  return <KitVideoResourcePage alias="unidad-exterior" pathname={pathname} heading="Video — Unidad exterior"/>;
}
