# XploraSG

XploraSG es una plataforma web progresiva de turismo inteligente para la Sierra Gorda de Querétaro. La aplicación combina un frontend React, una API Express y PostgreSQL administrado por Supabase, manteniendo un entorno PostgreSQL local para desarrollo reproducible.

## Estado del proyecto

- Fase 0: visión, problema y requisitos — terminada.
- Fase 1: esqueleto técnico — terminada.
- Fase 2: modelo relacional de 18 tablas — terminada.
- Fase 3: autenticación y autorización temporal de desarrollo — terminada como andamiaje local.
- Fase 4A: Supabase y autenticación real — terminada y verificada.
- Fase 4B: Storage y contenido — datos capturados y en revisión. Supabase contiene
  20 lugares, 16 servicios y 16 prestadores como `borrador`. Las 36 imágenes de
  las fichas están extraídas localmente; falta validar derechos y configurar la
  clave administrativa para cargarlas al bucket privado. La bandeja administrativa
  ya permite revisar estados y bloquea publicaciones incompletas.
- Fase 4C: mapa y geolocalización — implementación terminada y verificada con
  los seis municipios; la prueba completa con lugares cercanos se habilitará al
  aprobar fichas con coordenadas reales.
- Fase 4D: rutas y clima — base implementada. Open-Meteo está integrado y las
  rutas quedan preparadas para OpenRouteService; falta configurar su clave y
  contar con destinos aprobados.
- Fase 4E: PWA y consulta offline — terminada y verificada. El catálogo público,
  municipios y categorías se sincronizan en IndexedDB; el Service Worker conserva
  la aplicación, recursos públicos y mapas ya visitados. Existe indicador de
  conectividad y una prueba automatizada navega sin red entre Explorar y Mapa.
- Fases 4F en adelante — pendientes.

El flujo de la Fase 4A fue comprobado de extremo a extremo el 2 de octubre de 2026:

`Supabase Auth → JWT → Express → PostgreSQL de Supabase → public.usuarios → RLS`

La verificación incluyó creación y eliminación sincronizada del perfil, inicio de
sesión real, validación ES256 mediante JWKS, respuestas `200/401/403`, acceso
público `anon`, perfil propio `authenticated` y denegación de escrituras
privilegiadas para un turista. El usuario temporal se eliminó al finalizar.

## Arquitectura

- Frontend: React, Vite, TypeScript y preparación PWA.
- Mapas: Leaflet y OpenStreetMap con geolocalización del navegador.
- Viaje: Open-Meteo para clima y OpenRouteService para rutas desde el backend.
- Backend: Node.js, Express y TypeScript.
- Datos: PostgreSQL local para desarrollo y PostgreSQL de Supabase para integración.
- Autenticación: modo DEV local o Supabase Auth, seleccionado mediante `AUTH_MODE`.
- Seguridad: rol consultado desde `public.usuarios`; el backend no confía en roles enviados por el cliente.

## Preparación local

Requisitos:

- Node.js.
- Docker Desktop y Docker Compose, cuando se utilice el entorno completo.

1. Copia `.env.example` como `.env` en la raíz.
2. Conserva `AUTH_MODE=dev` para trabajar sin Supabase.
3. Instala dependencias si todavía no existen:

```bash
cd backend
npm install
cd ../frontend
npm install
```

4. Inicia los servicios:

```bash
docker compose up --build -d
```

El inicializador local ejecuta únicamente las migraciones compatibles con PostgreSQL independiente. Las migraciones que contienen `_supabase_` se omiten porque dependen de `auth.users` y de los roles administrados por Supabase.

## Configuración de la Fase 4A

Para utilizar Supabase:

1. Cambia `AUTH_MODE=supabase`.
2. Configura `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en el backend.
3. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` para el frontend.
4. Sustituye `DATABASE_URL` por la cadena exacta obtenida desde **Connect** en el Dashboard de Supabase.
5. Ejecuta en el proyecto remoto las migraciones `001` a `009` en orden y las semillas `001` a `004`.
6. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY`, contraseñas de base de datos ni secretos JWT en el frontend o en Git.

La validación normal del backend usa el JWKS público de Supabase para tokens asimétricos. Los proyectos heredados con HS256 pueden validarse contra el servidor de Auth mediante la publishable/anon key; `SUPABASE_JWT_SECRET` queda solamente como compatibilidad temporal.

## Verificación

```bash
cd backend
npm run build

cd ../frontend
npm run build
npm run lint
npm run pwa:verify
```

El asistente fundamentado está disponible en `/asistente`. Funciona con el
catálogo aprobado aun sin proveedor externo y sólo usa un modelo cuando
`AI_PROVIDER_URL`, `AI_PROVIDER_MODEL` y `AI_PROVIDER_API_KEY` están configuradas
en el backend. Consulta `docs/asistente-ia.md`.

Con los servicios levantados:

- `GET /api/health` debe responder `200`.
- `GET /api/db-test` debe confirmar la conexión esperada.
- `GET /api/test/protected` sin token debe responder `401`.
- Un turista autenticado debe recibir `200` en la ruta protegida y `403` en la ruta administrativa.
- Un administrador válido debe recibir `200` en la ruta administrativa.

Catálogo público de la Fase 4B:

- `GET /api/catalogo/municipios`
- `GET /api/catalogo/categorias`
- `GET /api/catalogo/lugares?municipio=&categoria=&q=&page=&limit=`
- `GET /api/catalogo/lugares/:slug`
- `GET /api/catalogo/servicios?municipio=&categoria=&q=&page=&limit=`
- `GET /api/catalogo/admin/estado` requiere rol `administrador`.
- `GET /api/catalogo/admin/revision` requiere rol `administrador`.
- `PATCH /api/catalogo/admin/revision/:tipo/:id` requiere rol `administrador`.

Los endpoints públicos sólo devuelven contenido y prestadores aprobados. Los 20
lugares y 16 servicios importados permanecen fuera del catálogo hasta completar
la revisión editorial y aprobarlos.

La ruta protegida `/admin/contenido` muestra los faltantes de cada registro. La
API rechaza con `409` cualquier aprobación sin descripción, ubicación suficiente,
fuente y multimedia pública autorizada; para servicios también exige contacto y
prestador identificado.

Para regenerar el contenido estructurado desde las fichas DOCX:

```bash
python scripts/extract_fichas.py
python scripts/generate_fichas_seed.py
```

La simulación de carga multimedia no modifica Supabase:

```bash
cd backend
npm run content:upload-media
```

La carga real requiere `SUPABASE_SERVICE_ROLE_KEY` y el argumento `--apply`. El
script usa exclusivamente `xplorasg-review`; no publica las imágenes.

Servicios de viaje de las fases 4C y 4D:

- `GET /api/viaje/clima?latitud=&longitud=`
- `POST /api/viaje/ruta` con `origen`, `destino` y `perfil`.

La clave `OPEN_ROUTE_SERVICE_API_KEY` se usa únicamente en el backend. Nunca se
expone mediante una variable `VITE_`.

Verificación de la PWA y su comportamiento sin conexión:

```bash
cd frontend
npm run build
npm run pwa:verify

# Con la compilación de producción servida en http://localhost:5173
npm run test:offline
```

La prueba offline usa Chrome instalado, activa el modo sin red sólo dentro del
navegador de prueba y confirma el indicador, IndexedDB y la navegación
`/explorar → /mapa`.

Consulta también:

- `docs/base-de-datos.md`
- `docs/autenticacion.md`
- `docs/supabase.md`
- `docs/supabase-auth.md`
- `docs/rls.md`
- `docs/contenido-inicial.md`
- `docs/mapa-rutas-clima.md`
- `docs/pwa-offline.md`
