# CIS Climatización

Landing corporativa desarrollada con Next.js App Router, TypeScript y Tailwind CSS. Es una web estática, sin backend ni base de datos.

## Ejecutar localmente

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. Para validar y ejecutar producción:

```bash
npm run lint
npm run build
npm start
```

## Editar los datos de la empresa

La información corporativa está centralizada en `src/data/site.ts`: marca, dominio, teléfono, WhatsApp, correo, Instagram, cobertura, horarios, servicios, trabajos y preguntas frecuentes.

## CIS Academia

El contenido educativo vive de forma independiente en `src/data/academy.ts`. Allí se configuran la marca CIS Academia, el Kit CIS 5P, sus cinco pasos, recursos, estados, próximos productos y rutas previstas.

Rutas publicadas actualmente:

- `/academia`
- `/academia/kit-5p`
- `/academia/kit-5p/recursos`

Los productos futuros pueden añadirse a `academy.futureRoutes` y `academy.upcomingProducts`, pero no deben enlazarse hasta que exista su página real.

Cada entrada de `academy.resources` utiliza el estado `Disponible` o `Próximamente`. Un recurso disponible debe incluir un `href` real; los recursos próximos se renderizan sin enlace para evitar destinos vacíos o rotos.

La compra está deshabilitada mediante `academy.commerce.enabled: false`. La estructura reserva este punto para una integración futura con Mercado Pago, pero actualmente los CTA sólo abren WhatsApp o navegan dentro de Academia.

El WhatsApp debe incluir código de país y área usando sólo dígitos. El formulario abre WhatsApp con una consulta precargada; no guarda ni envía datos a un backend.

## Trabajos realizados

Las fotografías originales se conservan en `private-originals/projects/`. Esta carpeta está excluida por `.gitignore`: no se publica en Vercel ni se incorpora al repositorio. Debe incluirse en la estrategia privada de copias de seguridad del propietario.

Las versiones públicas optimizadas se guardan en `public/images/projects/`. Los nombres deben escribirse en minúsculas, sin tildes y separados por guiones.

Para incorporar un trabajo futuro:

1. Guardar el original autorizado en `private-originals/projects/`.
2. Confirmar por escrito el trabajo, descripción, ubicación y permisos de personas, clientes y marcas visibles.
3. Añadir el archivo al listado de `scripts/process-project-images.mjs` y ejecutar:

```bash
node scripts/process-project-images.mjs
```

4. Verificar visualmente la versión WebP generada en `public/images/projects/`.
5. Añadir una entrada a `site.projects` en `src/data/site.ts` con `id`, `title`, `category`, `description`, `location`, `image`, `imageAlt` y `featured`.
6. Escribir el texto alternativo describiendo objetivamente lo visible, sin repetir información promocional.

El procesamiento utiliza Sharp, corrige la orientación, limita el lado mayor a 1600 px sin ampliar originales, genera WebP de calidad 84 y elimina EXIF porque no se conserva metadata al exportar. Antes de publicar debe comprobarse nuevamente que no existan GPS, fechas, datos del dispositivo, credenciales, números internos o información personal visible.

Las tarjetas presentan un recorte visual 4:3 mediante `object-fit: cover`, sin deformar el archivo. Se recomienda conservar el encuadre completo en el WebP público para futuras ampliaciones o un modal. Para fotografías nuevas se recomienda un lado mayor de 1400 a 2000 px, orientación correcta, foco nítido y buena iluminación.

No publicar fotografías sin autorización. Cuando aparezcan personas, credenciales, domicilios, matrículas internas, clientes o marcas, documentar expresamente el permiso o aplicar una ocultación discreta antes del procesamiento público. Las ediciones privadas intermedias se guardan en `private-originals/projects-edited/`.

## Imágenes de marca

El logo se encuentra en `public/images/cis-logo.png`. Debe conservar su proporción cuadrada y transparencia. La ruta compartida se configura en `src/data/site.ts` mediante `site.brand.logo`.

## Variables de entorno

No se requieren variables de entorno en esta versión. Si se agrega un backend, los secretos deben permanecer en variables del servidor.

## Desplegar en Vercel

1. Subir el proyecto a un repositorio Git.
2. En Vercel, crear un proyecto e importar el repositorio.
3. Mantener el preset Next.js y el comando `npm run build`.
4. Configurar el dominio definitivo.
5. Confirmar metadata, sitemap, robots y datos estructurados.
6. Desplegar y revisar móvil, tablet y escritorio.

La carpeta `private-originals/` nunca debe subirse a Vercel ni servirse públicamente.
