import type { Metadata } from "next";
import { KitVideoResourcePage } from "@/components/academy/KitVideoResourcePage";
import { academy } from "@/data/academy";

const pathname = "/academia/kit-5p/recursos/unidad-interior" as const;

export const metadata: Metadata = {
  title: { absolute: `Video — Unidad interior | ${academy.name}` },
  description: "Acceso privado al video de unidad interior del Kit CIS 5P.",
  alternates: { canonical: `${academy.url}/kit-5p/recursos/unidad-interior` },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function InteriorUnitVideoPage() {
  return <KitVideoResourcePage alias="unidad-interior" pathname={pathname} heading="Video — Unidad interior"/>;
}
