export type ProjectCategory =
  | "Aires acondicionados"
  | "Refrigeración"
  | "Calderas y calefacción"
  | "Radiadores y losa radiante"
  | "Gas"
  | "Electricidad"
  | "Heladeras y lavarropas";

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  location: string;
  image: string;
  imageAlt: string;
  featured: boolean;
};

export const site = {
  name: "CIS Climatización",
  shortName: "CIS",
  brand: {
    name: "CIS Climatización",
    logo: "/images/cis-logo.png",
  },
  tagline: "Expertos técnicos integrando soluciones reales en aire, refrigeración, gas y electricidad.",
  url: "https://cisclimatizacion.com.ar",
  location: "Mendoza, Argentina",
  coverage: "Gran Mendoza, Mendoza, Argentina",
  hours: "9:00hs a 18:00hs",
  phone: {
    display: "+54 9 261 364-0373",
    href: "tel:+5492613640373",
  },
  whatsapp: "5492613640373",
  email: {
    display: "marcelocjv@gmail.com",
    href: "mailto:marcelocjv@gmail.com",
  },
  instagram: {
    handle: "@cis_climatizacion",
    url: "https://www.instagram.com/cis_climatizacion/",
  },
  messages: {
    service: "Hola CIS Climatización, me comunico desde la página web. Quisiera solicitar un presupuesto o realizar una consulta sobre el servicio de: [Agregar Servicio].",
  },
  services: [
    { icon: "snow", title: "Aire acondicionado", description: "Instalación, mantenimiento y reparación.", items: ["Split", "Multi-Split", "Central"] },
    { icon: "fridge", title: "Refrigeración comercial e industrial", description: "Reparación y mantenimiento de sistemas de refrigeración.", items: ["Refrigeración comercial", "Refrigeración industrial"] },
    { icon: "flame", title: "Gas", description: "Instalaciones de gas y habilitación de artefactos.", items: ["Instalaciones de gas", "Habilitación de artefactos", "Prueba de hermeticidad"] },
    { icon: "heat", title: "Calefacción", description: "Mantenimiento de sistemas de calefacción.", items: ["Estufas", "Calderas", "Sistemas de calefacción"] },
    { icon: "bolt", title: "Electricidad aplicada a climatización", description: "Instalaciones eléctricas domiciliarias y comerciales.", items: ["Instalaciones domiciliarias", "Instalaciones comerciales", "Aplicaciones de climatización"] },
  ],
  projectsSection: {
    title: "Trabajos realizados",
    intro: "Conocé algunos de nuestros trabajos de instalación, reparación y mantenimiento realizados para hogares, comercios y empresas.",
  },
  projects: [
    {
      id: "instalacion-equipos-climatizacion-cubierta",
      title: "Instalación de equipos de climatización en cubierta",
      category: "Aires acondicionados",
      description: "Instalación de múltiples unidades exteriores y verificación de tuberías mediante nitrógeno para una prueba de presión.",
      location: "Arístides, Ciudad de Mendoza",
      image: "/images/projects/instalacion-equipos-climatizacion-cubierta.webp",
      imageAlt: "Cuatro unidades exteriores de aire acondicionado, herramientas, cilindro y materiales sobre una cubierta.",
      featured: true,
    },
    {
      id: "mantenimiento-calefactor-central-gas",
      title: "Mantenimiento de calefactor central a gas",
      category: "Calderas y calefacción",
      description: "Limpieza y mantenimiento de un calefactor central a gas Goodman de 30.000 kcal/h.",
      location: "Guaymallén, Mendoza",
      image: "/images/projects/mantenimiento-calefactor-central-gas.webp",
      imageAlt: "Sistema de calefacción central abierto con cañerías, cableado y componentes internos expuestos.",
      featured: true,
    },
    {
      id: "prueba-hermeticidad-instalacion-gas",
      title: "Prueba de hermeticidad en instalación de gas",
      category: "Gas",
      description: "Verificación de estabilidad de presión mediante un manómetro de columna de agua para detectar posibles pérdidas de gas.",
      location: "Ciudad de Mendoza, Mendoza",
      image: "/images/projects/prueba-hermeticidad-instalacion-gas.webp",
      imageAlt: "Manómetro de columna de agua conectado mediante una manguera amarilla a una instalación de gas.",
      featured: true,
    },
    {
      id: "verificacion-temperatura-climatizacion",
      title: "Verificación de temperatura en equipo de climatización",
      category: "Aires acondicionados",
      description: "Medición de la temperatura de impulsión del equipo interior mediante instrumental técnico para verificar su funcionamiento.",
      location: "Incluir Salud, Ciudad de Mendoza",
      image: "/images/projects/verificacion-temperatura-climatizacion.webp",
      imageAlt: "Mano sosteniendo un termómetro digital que muestra una lectura frente a un equipo de aire acondicionado.",
      featured: true,
    },
    {
      id: "instalacion-cableado-tablero-electrico",
      title: "Instalación y cableado de tablero eléctrico",
      category: "Electricidad",
      description: "Instalación y cableado de protecciones térmicas dentro de un tablero eléctrico.",
      location: "Luján de Cuyo, Mendoza",
      image: "/images/projects/instalacion-cableado-tablero-electrico.webp",
      imageAlt: "Tablero eléctrico abierto con interruptores, cableado y componentes montados en su interior.",
      featured: false,
    },
    {
      id: "instalacion-preparacion-aire-acondicionado",
      title: "Instalación y preparación de equipos de aire acondicionado",
      category: "Aires acondicionados",
      description: "Instalación de equipos de aire acondicionado y preparación de la cañería mediante bomba de vacío.",
      location: "Vista Calma, Potrerillos, Mendoza",
      image: "/images/projects/instalacion-preparacion-aire-acondicionado.webp",
      imageAlt: "Técnico trabajando junto a dos unidades exteriores de aire acondicionado y herramientas de medición.",
      featured: false,
    },
    {
      id: "reparacion-caldera-mural",
      title: "Reparación de caldera mural",
      category: "Calderas y calefacción",
      description: "Diagnóstico de falla, reemplazo de la bomba de circulación y puesta en marcha de una caldera mural.",
      location: "Las Lomas - Palmares Valley, Luján de Cuyo, Mendoza",
      image: "/images/projects/reparacion-caldera-mural.webp",
      imageAlt: "Técnico trabajando frente a una caldera mural abierta con sus conexiones inferiores visibles.",
      featured: false,
    },
    {
      id: "mantenimiento-equipo-piso-techo-comercio",
      title: "Mantenimiento de equipo piso-techo en comercio",
      category: "Aires acondicionados",
      description: "Limpieza y verificación del sistema de drenaje y evacuación de condensado de un equipo piso-techo.",
      location: "Avenida San Martín, Ciudad de Mendoza",
      image: "/images/projects/mantenimiento-equipo-piso-techo-comercio.webp",
      imageAlt: "Técnico sobre una escalera trabajando en un equipo de aire acondicionado dentro de un comercio.",
      featured: false,
    },
    {
      id: "mantenimiento-equipo-piso-techo",
      title: "Mantenimiento de equipo piso-techo",
      category: "Aires acondicionados",
      description: "Limpieza y mantenimiento de un equipo de climatización BGH de 18.000 frigorías.",
      location: "Ciudad de Mendoza, Mendoza",
      image: "/images/projects/mantenimiento-equipo-piso-techo.webp",
      imageAlt: "Técnico sobre una escalera trabajando en un equipo de climatización instalado cerca del cielorraso.",
      featured: false,
    },
    {
      id: "verificacion-electrica-unidades-exteriores",
      title: "Verificación eléctrica de unidades exteriores",
      category: "Aires acondicionados",
      description: "Revisión de unidades exteriores y medición de aislación a tierra de los motores mediante instrumental técnico.",
      location: "Ciudad de Mendoza, Mendoza",
      image: "/images/projects/verificacion-electrica-unidades-exteriores.webp",
      imageAlt: "Técnico agachado junto a varias unidades exteriores de climatización y una caja de herramientas.",
      featured: false,
    },
    {
      id: "instalacion-equipo-split-aeropuerto",
      title: "Instalación de equipo split en entorno aeroportuario",
      category: "Aires acondicionados",
      description: "Instalación de un equipo de aire acondicionado split en un entorno aeroportuario.",
      location: "Aeropuerto Internacional El Plumerillo, Las Heras, Mendoza",
      image: "/images/projects/instalacion-equipo-split-aeropuerto.webp",
      imageAlt: "Técnico sosteniendo un equipo de climatización delante de una aeronave en un aeropuerto.",
      featured: false,
    },
  ] as Project[],
  faqs: [
    ["¿En qué zonas trabajan?", "La zona de cobertura es Gran Mendoza, Mendoza, Argentina."],
    ["¿Cuál es el horario de atención?", "El horario informado es de 9:00hs a 18:00hs."],
    ["¿Realizan trabajos de refrigeración comercial e industrial?", "Sí. CIS Climatización realiza reparación y mantenimiento de sistemas de refrigeración comercial e industrial."],
  ],
} as const;

export function serviceMessage(service: string) {
  return site.messages.service.replace("[Agregar Servicio]", service);
}

export function whatsappUrl(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
