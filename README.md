# CIS Climatización

Sitio corporativo y base de identidad de CIS Academia desarrollados con Next.js App Router, TypeScript y Tailwind CSS. Las páginas públicas conservan su funcionamiento sin base de datos; registro, sesiones y Mi Academia utilizan PostgreSQL mediante Prisma y Better Auth.

## Ejecutar localmente

Requisitos:

- Node.js 22.12 o superior dentro de la rama 22 LTS. El proyecto fue validado con Node.js 22.17.0.
- npm 10 o superior.
- PostgreSQL 14 o superior. Para producción se recomienda Neon.

```bash
npm install
npm run prisma:generate
npm run dev
```

Abrir `http://localhost:3000`. Para validar y ejecutar producción:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## PostgreSQL y Prisma

El esquema se encuentra en `prisma/schema.prisma`. En Sprint 0/1 contiene únicamente `User`, `Session`, `Account`, `Verification` y el enum `Role` requerido por la identidad.

Para Neon deben utilizarse dos conexiones:

- `DATABASE_URL`: URL con pooling (`-pooler` en el hostname), utilizada por la aplicación mediante `@prisma/adapter-neon`.
- `DIRECT_URL`: URL directa sin pooler, utilizada por Prisma CLI para migraciones.

En desarrollo local, una URL con hostname `localhost` o `127.0.0.1` utiliza automáticamente el adaptador PostgreSQL convencional. Comandos disponibles:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name nombre-del-cambio
npm run prisma:deploy
npm run prisma:studio
```

No ejecutar `prisma db push` en producción. Las migraciones versionadas están en `prisma/migrations/`.

## Identidad de CIS Academia

Better Auth gestiona:

- registro con email y contraseña;
- verificación de correo;
- login y logout;
- sesiones de siete días con actualización diaria;
- recuperación y restablecimiento de contraseña;
- revocación de sesiones después del restablecimiento.

Rutas públicas de identidad:

- `/ingresar`
- `/registro`
- `/recuperar-cuenta`
- `/restablecer-clave`

`/academia/mi-academia` requiere una sesión válida. La autorización está centralizada en `src/lib/dal/auth.ts`; ocultar un enlace en la interfaz nunca reemplaza esa verificación de servidor.

Todos los registros reciben el rol `USER`. El campo `role` no se acepta desde formularios ni desde el endpoint público de registro.

### Crear el primer ADMIN

1. Registrar y verificar normalmente la cuenta.
2. Ejecutar desde una terminal segura con `DATABASE_URL` configurada:

```bash
npm run admin:promote -- correo-real@dominio.com
```

El script actualiza una cuenta existente. No existe un endpoint público para elevar roles. En producción, registrar esta operación y rotar las credenciales si se utilizaron desde una máquina temporal.

## Correo transaccional

La implementación utiliza Resend para verificación y recuperación. Es obligatorio configurar un dominio/remitente autorizado en `EMAIL_FROM` y una clave válida en `RESEND_API_KEY`.

Si esas variables faltan, registro, reenvío de verificación y recuperación responden con servicio no disponible; la interfaz no afirma que se haya enviado un correo. Los tests usan un buzón interno disponible únicamente cuando `NODE_ENV=test` y nunca contactan a Resend.

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

Copiar `.env.example` a `.env.local` y completar:

```dotenv
DATABASE_URL=
DIRECT_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=
APP_URL=http://localhost:3000
```

`BETTER_AUTH_SECRET` debe ser criptográficamente aleatorio y tener al menos 32 caracteres. Ninguna de estas variables debe usar el prefijo `NEXT_PUBLIC_`. `.env*` está ignorado por Git, con la única excepción deliberada de `.env.example`.

En Vercel se deben configurar valores separados para Development, Preview y Production. Las URLs de producción deben utilizar HTTPS y coincidir con el dominio real.

## Desplegar en Vercel

1. Subir el proyecto a un repositorio Git.
2. En Vercel, crear un proyecto e importar el repositorio.
3. Mantener el preset Next.js y el comando `npm run build`.
4. Conectar una base Neon y configurar las siete variables del ejemplo.
5. Ejecutar `npm run prisma:deploy` contra la rama de base correspondiente antes de promover el despliegue.
6. Configurar y verificar el dominio remitente en Resend.
7. Configurar el dominio definitivo.
8. Confirmar metadata, sitemap, robots y datos estructurados.
9. Desplegar y revisar móvil, tablet y escritorio.

La carpeta `private-originals/` nunca debe subirse a Vercel ni servirse públicamente.
