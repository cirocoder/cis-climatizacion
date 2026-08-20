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

El esquema se encuentra en `prisma/schema.prisma`. Además de la identidad (`User`, `Session`, `Account`, `Verification`, `RateLimit`), el catálogo y los pagos utilizan `Product`, `Entitlement`, `Purchase`, `PurchaseItem` y `PaymentEvent`.

Para Neon deben utilizarse dos conexiones:

- `DATABASE_URL`: URL con pooling (`-pooler` en el hostname), utilizada por la aplicación mediante `@prisma/adapter-neon`.
- `DIRECT_URL`: URL directa sin pooler, utilizada por Prisma CLI para migraciones.

En desarrollo local, una URL con hostname `localhost` o `127.0.0.1` utiliza automáticamente el adaptador PostgreSQL convencional. Comandos disponibles:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name nombre-del-cambio
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

No ejecutar `prisma db push` en producción. Las migraciones versionadas están en `prisma/migrations/`.

### Base exclusiva para tests

Los tests de autenticación crean y eliminan usuarios, sesiones, cuentas, verificaciones y contadores de rate limiting. Nunca deben ejecutarse contra la base de la aplicación ni contra Neon.

1. Crear una base PostgreSQL local cuyo nombre incluya `test`, por ejemplo `cis_academia_test`.
2. Copiar `.env.test.example` a `.env.test.local` y completar únicamente `TEST_DATABASE_URL` con esa base local.
3. Ejecutar:

```bash
npm test
```

El hook `pretest` valida que el hostname sea `localhost`, `127.0.0.1` o `::1`, que el nombre de la base contenga `test` y aplica las migraciones antes de iniciar Vitest. No carga `DATABASE_URL` desde `.env` ni admite bases remotas. Si la configuración segura o PostgreSQL faltan, el comando falla con una explicación; la suite nunca se convierte silenciosamente en `skipped`.

### Auditoría de dependencias

PostCSS se fija mediante `overrides` en una versión 8.5.x corregida porque Next.js, Tailwind y Vite lo incorporan transitivamente con rangos distintos. Cualquier cambio de ese override debe validarse con `npm ls postcss`, build, lint, typecheck y tests.

Prisma 7.9.1 incorpora `deepmerge-ts@7.1.5` a través de `prisma > @prisma/config`. Ese paquete se utiliza al cargar `prisma.config.ts` desde el CLI para generar el cliente, aplicar migraciones o abrir Studio; la aplicación no importa `@prisma/config` en sus rutas de servidor. Mientras Prisma no publique una versión 7 estable que actualice oficialmente esa dependencia, no debe forzarse `deepmerge-ts@8`, degradarse Prisma 6 ni instalarse Prisma 8 RC. Revisar nuevamente este árbol al actualizar Prisma.

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

### Catálogo y accesos de Academia

El Kit CIS 5P se crea o actualiza de forma idempotente mediante:

```bash
npm run prisma:seed
```

El seed sólo incorpora `kit-cis-5p`; no asigna precio ni crea cursos ficticios. La página `/academia/kit-5p` continúa siendo pública y comercial. El contenido asociado a una cuenta vive bajo `/academia/mi-academia/productos/[slug]` y exige sesión más un `Entitlement` utilizable comprobado en servidor.

Un acceso es utilizable sólo cuando está `ACTIVE`, ya comenzó, no venció y no fue revocado. Los productos `DRAFT` o `ARCHIVED` tampoco se entregan. Ante un producto inexistente o una cuenta sin acceso, la ruta privada responde con la misma página neutral de contenido no disponible.

La restricción única `userId + productId + sourceType` mantiene una sola concesión equivalente por origen. Así, el grant administrativo reactiva la misma fila y los futuros orígenes `PURCHASE` y `SUBSCRIPTION` pueden mantenerse separados. Cuando se incorporen pagos, sus identificadores externos se guardarán en `sourceId`; `Entitlement` continuará siendo la única fuente de autorización.

Concesión y revocación manual, disponibles sólo desde terminal:

```bash
npm run entitlement:grant -- correo@dominio.com kit-cis-5p
npm run entitlement:revoke -- correo@dominio.com kit-cis-5p
```

Ambos comandos validan los argumentos, buscan un usuario y producto existentes, son idempotentes y no exponen endpoints HTTP. El grant usa `sourceType=ADMIN` y acceso permanente; el revoke marca `REVOKED` y completa `revokedAt`.

Los recursos mostrados dentro del producto privado continúan como `Próximamente`. Sprint 2 no incorpora archivos premium en `public/`; el almacenamiento y la descarga protegida quedan reservados para un sprint posterior.

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

Después de aceptar un registro, la interfaz solicita explícitamente el correo de verificación mediante Better Auth para poder distinguir un envío aceptado de un fallo real del proveedor. Conserva el correo sólo en el estado local del formulario y ofrece `Reenviar correo de verificación`; no se realizan envíos automáticos duplicados al registrarse o intentar ingresar. Better Auth responde de forma neutra tanto para cuentas verificadas como para correos inexistentes y sólo envía cuando existe una cuenta pendiente. El endpoint está limitado a tres solicitudes por minuto e IP; el contador se guarda en la tabla PostgreSQL `rateLimit`, por lo que funciona de manera consistente en despliegues serverless. Aplicá la migración `20260819000000_auth_rate_limit` antes de desplegar este cambio.

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

## Compra única con Mercado Pago Checkout Pro

Sprint 3 incorpora Checkout Pro únicamente para productos `PUBLISHED`, `ONE_TIME`, con precio positivo y moneda `ARS`. El Kit conserva `price = null`, por lo que la interfaz mantiene el estado `Próximamente` hasta que el propietario defina el valor real. El precio nunca se recibe ni se acepta desde el navegador.

Para habilitar la compra:

1. Abrir `npm run prisma:studio` sobre el entorno correspondiente.
2. Editar el producto `kit-cis-5p` y completar `price` con el importe final en ARS; mantener `currency = ARS`.
3. Completar las variables de Mercado Pago y utilizar una `APP_URL` HTTPS pública.
4. Configurar en Mercado Pago el webhook de pagos hacia `https://DOMINIO/api/webhooks/mercadopago` y copiar su clave secreta.
5. Aplicar migraciones con `npm run prisma:deploy` antes del despliegue.

El seed crea el Kit con precio nulo sólo cuando aún no existe. Las ejecuciones posteriores actualizan su contenido público sin sobrescribir un precio configurado.

Flujo implementado:

1. `POST /api/checkout/mercadopago` exige sesión, valida el producto y crea `Purchase` + `PurchaseItem` con snapshot de precio/título.
2. El servidor crea la preferencia en Mercado Pago y devuelve sólo la URL de Checkout Pro.
3. Las páginas `/academia/compra/exito`, `/academia/compra/pendiente` y `/academia/compra/error` son informativas y nunca conceden acceso.
4. `POST /api/webhooks/mercadopago` valida `x-signature`, consulta el pago directamente en Mercado Pago y coteja referencia, importe, moneda, pago y collector.
5. Una transacción marca la compra `APPROVED`, crea o reactiva el `Entitlement` `PURCHASE` permanente y finaliza el evento idempotente.

Los estados `pending`/`in_process`, `rejected` y `cancelled` no conceden acceso. Un reembolso completo pasa la compra a `REFUNDED` y revoca sólo el entitlement cuyo `sourceId` coincide con esa compra. Los eventos repetidos están protegidos por una clave única de proveedor/evento, el pago por una clave única y el entitlement por `user + product + sourceType`. Una clave de checkout activo y un límite de tres intentos nuevos por quince minutos reducen compras pendientes accidentales y abuso.

Para reconciliar compras `PENDING` antiguas que ya tengan `providerPaymentId`:

```bash
npm run payments:reconcile
```

El comando reutiliza exactamente la misma consulta al proveedor y el mismo procesamiento idempotente del webhook. No hay cron de producción en este sprint.

### Credenciales y pruebas de Mercado Pago

Crear una aplicación de prueba en el panel de Mercado Pago y obtener:

- Access Token de prueba del vendedor;
- Collector ID de esa cuenta vendedora;
- clave secreta generada al configurar Webhooks para el evento `Payments`.

Checkout Pro por redirección no utiliza Public Key en el frontend, por eso Sprint 3 no define `MERCADOPAGO_PUBLIC_KEY`. Tampoco necesita `MERCADOPAGO_APP_ID` en runtime. No deben utilizarse credenciales ni dinero real durante las pruebas.

Mercado Pago no admite `localhost` como URL pública de retorno/notificación. Para una compra de prueba usar una Preview de Vercel, staging o un túnel HTTPS seguro; configurar esa URL como `APP_URL`. Crear vendedor y comprador de prueba separados, abrir el checkout en incógnito y usar los datos de prueba oficiales. Confirmar primero que la redirección sola no habilita el Kit y luego verificar el webhook, la compra y el entitlement en la base de staging.

Los tests automatizados mockean Mercado Pago y sólo usan PostgreSQL local. Nunca realizan llamadas reales ni permiten una base Neon como base destructiva de tests.

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
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_COLLECTOR_ID=
MERCADOPAGO_ENVIRONMENT=TEST
```

`BETTER_AUTH_SECRET` debe ser criptográficamente aleatorio y tener al menos 32 caracteres. Access Token y secreto de webhook son exclusivamente server-side y nunca deben usar `NEXT_PUBLIC_`. `MERCADOPAGO_ENVIRONMENT` admite `TEST` o `PRODUCTION`; mantener `TEST` hasta completar toda la validación sandbox. `.env*` está ignorado por Git, con la única excepción deliberada de `.env.example`.

En Vercel se deben configurar valores separados para Development, Preview y Production. Las URLs de producción deben utilizar HTTPS y coincidir con el dominio real.

## Desplegar en Vercel

1. Subir el proyecto a un repositorio Git.
2. En Vercel, crear un proyecto e importar el repositorio.
3. Mantener el preset Next.js y el comando `npm run build`.
4. Conectar una base Neon y configurar las variables del ejemplo para el entorno correspondiente.
5. Ejecutar `npm run prisma:deploy` contra la rama de base correspondiente antes de promover el despliegue.
6. Configurar y verificar el dominio remitente en Resend.
7. Configurar el dominio definitivo.
8. Confirmar metadata, sitemap, robots y datos estructurados.
9. Desplegar y revisar móvil, tablet y escritorio.

La carpeta `private-originals/` nunca debe subirse a Vercel ni servirse públicamente.
