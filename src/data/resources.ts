export const KIT_CIS_5P_RESOURCE_DEFINITIONS = [
  {
    alias: "manual",
    title: "Kit CIS 5P — Mantenimiento Preventivo de Aire Acondicionado Split",
    description: "Manual visual y práctico del Método CIS 5P para realizar un mantenimiento preventivo de aire acondicionado split de forma ordenada, registrar mediciones y presentar el trabajo profesionalmente.",
    type: "PDF" as const,
    position: 1,
    directory: "manual",
    baseName: "kit-cis-5p",
    formats: ["pdf"] as const,
  },
  { alias: "checklist", title: "Checklist de campo", description: "Documento de apoyo para registrar de forma ordenada las tareas en campo.", type: "CHECKLIST" as const, position: 2, directory: "procedimiento", baseName: "checklist-de-campo", formats: ["pdf", "docx"] as const },
  { alias: "ficha-visita", title: "Ficha de visita", description: "Plantilla editable para documentar una visita técnica.", type: "TEMPLATE" as const, position: 3, directory: "documentacion", baseName: "ficha-de-visita", formats: ["docx", "pdf"] as const },
  { alias: "mediciones", title: "Hoja de mediciones", description: "Planilla editable para registrar mediciones técnicas.", type: "MEASUREMENT_SHEET" as const, position: 4, directory: "documentacion", baseName: "hoja-de-mediciones", formats: ["xlsx"] as const },
  { alias: "informe-tecnico", title: "Informe técnico", description: "Plantilla editable para presentar un informe técnico.", type: "REPORT" as const, position: 5, directory: "documentacion", baseName: "informe-tecnico", formats: ["docx", "pdf"] as const },
  { alias: "arbol-decisiones", title: "Árbol de decisiones", description: "Documento visual de apoyo para el proceso de decisión.", type: "OTHER" as const, position: 6, directory: "procedimiento", baseName: "arbol-de-decisiones", formats: ["pdf"] as const },
  { alias: "unidad-interior", title: "Video — Unidad interior", description: "Video complementario dedicado a la unidad interior.", type: "VIDEO" as const, position: 7, directory: "videos", baseName: "unidad-interior", formats: ["mp4", "webm"] as const, permanentPath: "/academia/kit-5p/recursos/unidad-interior" },
  { alias: "unidad-exterior", title: "Video — Unidad exterior", description: "Video complementario dedicado a la unidad exterior.", type: "VIDEO" as const, position: 8, directory: "videos", baseName: "unidad-exterior", formats: ["mp4", "webm"] as const, permanentPath: "/academia/kit-5p/recursos/unidad-exterior" },
] as const;

export type KitResourceAlias = typeof KIT_CIS_5P_RESOURCE_DEFINITIONS[number]["alias"];

export function getKitResourceDefinition(alias: string) {
  const legacyAliases: Record<string, KitResourceAlias> = {
    "hoja-mediciones": "mediciones",
    "video-unidad-interior": "unidad-interior",
    "video-unidad-exterior": "unidad-exterior",
  };
  const normalizedAlias = legacyAliases[alias] ?? alias;
  return KIT_CIS_5P_RESOURCE_DEFINITIONS.find(resource => resource.alias === normalizedAlias) ?? null;
}

export type KitVideoResourceAlias = "unidad-interior" | "unidad-exterior";
