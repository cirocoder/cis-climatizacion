import { site } from "@/data/site";

export type AcademyResourceStatus = "Disponible" | "Próximamente";

export type AcademyResource = {
  id: string;
  title: string;
  description: string;
  status: AcademyResourceStatus;
  href?: string;
};

export const academy = {
  name: "CIS Academia",
  descriptor: "Formación Técnica",
  url: `${site.url}/academia`,
  intro: "Formación práctica para convertir procedimientos técnicos en servicios profesionales, repetibles y medibles.",
  instructor: "Técnicos especialistas de CIS Climatización",
  featuredProduct: {
    slug: "kit-5p",
    name: "Kit CIS 5P",
    title: "El método de mantenimiento preventivo de Split",
    format: "Manual técnico digital",
    status: "Próximamente" as const,
    description: "Un sistema de trabajo para dejar de improvisar y ordenar cada mantenimiento preventivo con pasos, criterios y resultados medibles.",
    rule: "El mantenimiento preventivo no es un diagnóstico de fallas.",
    launchMessage: "Hola, quiero enterarme del lanzamiento del Kit CIS 5P de CIS Academia.",
    method: [
      { number: "01", initial: "P", name: "Preparación", summary: "Herramientas, protección del área y verificación inicial del equipo." },
      { number: "02", initial: "P", name: "Procedimiento", summary: "Trabajo ordenado sobre unidad interior, drenaje y unidad exterior." },
      { number: "03", initial: "P", name: "Parámetros", summary: "Registro de presión, consumo eléctrico y salto térmico." },
      { number: "04", initial: "P", name: "Prueba", summary: "Checklist final de funcionamiento, drenaje, ruidos y terminación." },
      { number: "05", initial: "P", name: "Presentación", summary: "Entrega de un informe técnico claro al cliente." },
    ],
    includes: [
      "Preparación y arsenal de trabajo",
      "Procedimiento para unidad interior y exterior",
      "Medición de parámetros técnicos",
      "Checklist final de prueba",
      "Guía para presentar el informe al cliente",
      "Plantilla de informe técnico",
    ],
    previews: [
      { id: "arsenal", label: "Preparación", title: "Tu arsenal", description: "Lista de herramientas, materiales de protección y elementos de seguridad." },
      { id: "parametros", label: "Parámetros", title: "Medir para demostrar", description: "Presión de trabajo, consumo eléctrico y salto térmico registrados en el informe." },
      { id: "informe", label: "Presentación", title: "Informe técnico", description: "Campos para documentar equipo, mediciones, verificaciones y observaciones." },
    ],
  },
  resources: [
    { id: "video-unidad-interior", title: "Video: unidad interior", description: "Recurso complementario del procedimiento de la evaporadora.", status: "Próximamente" },
    { id: "video-unidad-exterior", title: "Video: unidad exterior", description: "Recurso complementario del procedimiento de la condensadora.", status: "Próximamente" },
    { id: "planilla-informe", title: "Planilla de informe técnico", description: "Versión en alta calidad de la plantilla incluida en el Kit CIS 5P.", status: "Próximamente" },
  ] as AcademyResource[],
  upcomingProducts: [
    {
      name: "Curso Práctico de Instalación y Diagnóstico de Aire Acondicionado Split",
      route: "/academia/diagnostico-split",
      status: "Próximamente" as const,
      modality: "Virtual grabado",
      duration: "4 semanas",
      capacity: "Sin límite",
      location: "Mendoza, Argentina",
      instructor: "Técnicos especialistas de CIS Climatización",
      certificate: "Certificado de asistencia y aprobación",
    },
  ],
  futureRoutes: [
    "/academia/diagnostico-split",
    "/academia/electricidad-climatizacion",
    "/academia/calderas",
    "/academia/herramientas",
    "/academia/recursos",
  ],
  faqs: [
    ["¿Qué es el Kit CIS 5P?", "Es un manual técnico digital sobre el método de mantenimiento preventivo de equipos Split."],
    ["¿Dónde estarán disponibles los recursos del Kit?", "Los recursos se publicarán en la URL permanente de recursos del Kit CIS 5P a medida que estén disponibles."],
  ],
  commerce: {
    enabled: false,
    provider: null,
  },
} as const;

export function academyWhatsappUrl(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
