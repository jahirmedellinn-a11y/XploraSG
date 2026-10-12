# Seguridad en XploraSG

Este documento resume cómo XploraSG protege los datos y las sesiones. Aplica a la versión desplegada con **Supabase** (PostgreSQL administrado + Supabase Auth), el backend **Node/Express** y el frontend **React/Vite (PWA)**.

## 1. Cifrado de datos en reposo (PostgreSQL en Supabase)

- La base de datos de producción vive en Supabase. Supabase cifra **todos los datos de clientes en reposo con AES-256**: tablas, índices, respaldos y archivos de Storage.
- Las llaves de cifrado las administra el proveedor de infraestructura; ningún archivo del proyecto contiene llaves de disco.
- Secretos de la aplicación (claves de Supabase, OpenRouteService, proveedor de IA) **no se guardan en la base ni en el repositorio**. Viven sólo en variables de entorno (`.env`, ignorado por git y excluido de las imágenes Docker mediante `.dockerignore`).
- La `SUPABASE_SERVICE_ROLE_KEY` sólo la usa el backend en scripts administrativos. Nunca lleva prefijo `VITE_`, por lo que jamás llega al navegador.

## 2. Contraseñas

- XploraSG **no almacena contraseñas**. El registro y el inicio de sesión los gestiona **Supabase Auth**, que guarda únicamente un *hash* **bcrypt** (con sal y factor de costo) en la columna `auth.users.encrypted_password`.
- El backend nunca recibe ni procesa contraseñas: sólo valida el **token JWT** que Supabase emite tras el inicio de sesión.
- El formulario de registro exige un mínimo de 8 caracteres.

## 3. Sesiones, tokens y control de acceso

| Capa | Mecanismo |
|---|---|
| Autenticación | JWT firmado por Supabase. El backend lo verifica con las llaves públicas **JWKS** del proyecto (ES256/RS256) o con el secreto HS256 heredado, validando firma, emisor (`iss`), audiencia (`aud`) y expiración (`exp`). |
| Rol del usuario | **No se confía en el rol del JWT.** En cada petición, `requireAuth` consulta `usuarios` + `roles` en la base de datos. |
| Autorización | `requireRole([...])` protege `/api/admin/*` (sólo **administrador**) y `/api/prestador/*` (sólo **prestador**). Sólo un administrador puede dar de alta o vincular prestadores. Todo registro nuevo nace como **turista** (trigger `handle_new_user`). |
| Propiedad de datos | Un prestador sólo puede editar sus servicios y promociones: la pertenencia se valida en SQL con `prestadores.usuario_id = usuario autenticado`. |
| Base de datos | **Row Level Security (RLS)** activo en Supabase (`005_supabase_rls_policies.sql`): el público sólo puede leer contenido aprobado. |
| Frontend | `ProtectedRoute` bloquea `/admin`, `/mi-negocio` y `/dashboard`: sin sesión o sin rol se redirige a `/unauthorized`. Es una capa de interfaz; la autorización real siempre se aplica en el backend. |
| Inactividad | Cierre de sesión automático tras **15 minutos sin actividad** (configurable con `VITE_IDLE_TIMEOUT_MIN`), sincronizado entre pestañas. |
| Expiración | Cada 30 s se revisa el `exp` del token. Si está por vencer, Supabase intenta renovarlo; si no puede, la sesión se cierra y se avisa al usuario. |

## 4. Validación y saneamiento de entradas

- **Inyección SQL:** todas las consultas usan parámetros posicionales de `pg` (`$1, $2…`). Ningún valor del usuario se concatena en SQL. Los nombres de columnas dinámicos provienen de listas blancas fijas.
- **Middleware `sanitizeInput`** (en todas las rutas):
  - rechaza claves `__proto__`, `constructor`, `prototype` y las que empiezan con `$` (contaminación de prototipos o inyección de operadores);
  - normaliza Unicode y elimina bytes nulos, caracteres de control y etiquetas HTML;
  - limita profundidad, tamaño de arreglos y longitud de textos.
- El cuerpo JSON está limitado a **100 KB**. Un JSON mal formado responde `400`; uno demasiado grande, `413`.
- **XSS:** React escapa todo el contenido dinámico y no se usa `dangerouslySetInnerHTML`.
- **Límite de solicitudes:** el asistente admite 10 preguntas por minuto por usuario o IP.

## 5. Protección en tránsito: SSL/TLS en producción

- **Supabase:** todas las conexiones (API, Auth y PostgreSQL) van cifradas con **TLS**. El backend activa SSL automáticamente cuando `DATABASE_URL` apunta a un host remoto (`config/db.ts`).
- **Despliegue:** el frontend y el backend se publican detrás de HTTPS (por ejemplo Vercel/Netlify para el frontend y Render/Railway, o Nginx con Let's Encrypt, para la API). En producción:
  - `NODE_ENV=production` activa **HSTS** (`Strict-Transport-Security`, 1 año) mediante Helmet y desactiva las rutas de diagnóstico `/api/test` y `/api/db-test`;
  - `TRUST_PROXY=1` permite que Express reconozca HTTPS detrás del proxy;
  - `CORS_ORIGINS` debe listar **sólo** el dominio HTTPS del frontend. Cualquier otro origen recibe `403`.
- **Helmet** añade cabeceras de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Resource-Policy` y otras.
- El GPS del navegador y la instalación como PWA **sólo funcionan en HTTPS**, lo que obliga a desplegar con TLS.

## 6. Lista de verificación antes de producción

- [ ] `AUTH_MODE=supabase` y `NODE_ENV=production` en el backend.
- [ ] `CORS_ORIGINS=https://<dominio-del-frontend>`.
- [ ] Regenerar cualquier clave que se haya compartido fuera del `.env` (OpenRouteService, Supabase).
- [ ] Verificar que RLS esté activo en todas las tablas públicas (Supabase → Database → Policies).
- [ ] Activar la confirmación de correo y la protección contra contraseñas filtradas en Supabase Auth.
- [ ] Mantener `npm audit` sin vulnerabilidades altas.

---
Referencias: [Seguridad en Supabase](https://supabase.com/security) · [Hashing bcrypt en `auth.users`](https://workos.com/docs/migrate/supabase.md)
