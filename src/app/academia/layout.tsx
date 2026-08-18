import type { Metadata } from "next";
import { AcademyFooter, AcademyHeader } from "@/components/AcademyShell";
import { academy } from "@/data/academy";
import "./academy.css";

export const metadata: Metadata = {
  title: { default: academy.name, template: `%s | ${academy.name}` },
  description: academy.intro,
  alternates: { canonical: academy.url },
};

export default function AcademyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="academy-site"><AcademyHeader/><main id="contenido">{children}</main><AcademyFooter/></div>;
}
