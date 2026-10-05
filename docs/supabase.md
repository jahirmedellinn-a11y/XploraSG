# Configuración de Supabase para XploraSG

## Estado

La Fase 4A quedó verificada contra el proyecto remoto el 2 de octubre de 2026.
La conexión PostgreSQL, las 18 tablas, las 49 políticas RLS, los 9 triggers,
las semillas y el flujo completo de autenticación funcionan correctamente.

El repositorio ya contiene:

- Esquema relacional de 18 tablas.
- Triggers de `updated_at`.
- Sincronización `auth.users → public.usuarios`.
- Eliminación en cascada desde `auth.users`.
- Políticas RLS iniciales para los tres actores.
- Cliente Supabase en React.
- Validación JWT mediante JWKS en Express, con compatibilidad heredada para HS256.

## Variables necesarias

### Backend

- `AUTH_MODE=supabase`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_JWT_AUDIENCE=authenticated`
- `DATABASE_URL`
- `CORS_ORIGINS`, con los orígenes permitidos separados por comas.

`SUPABASE_JWT_SECRET` sólo se utiliza como compatibilidad temporal cuando un proyecto heredado continúa firmando con HS256 y no se configura una publishable/anon key para validar contra el servidor de Auth.

`SUPABASE_SERVICE_ROLE_KEY` no es necesaria para iniciar sesión ni para validar JWTs. Debe permanecer exclusivamente en backend y sólo agregarse cuando una operación administrativa futura la necesite.

### Frontend

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`VITE_SUPABASE_ANON_KEY` continúa admitida para proyectos con la nomenclatura heredada. Una service role o secret key nunca debe utilizar el prefijo `VITE_`.

## Conexión PostgreSQL

La cadena debe copiarse desde **Connect** en el Dashboard. No se debe construir manualmente el host del pooler.

- Backend persistente con IPv6: conexión directa.
- Entorno IPv4 sin complemento: session pooler.
- Entorno serverless: transaction pooler, considerando sus limitaciones.

La conexión remota debe exigir SSL. Para verificación completa del servidor se debe instalar y configurar el certificado raíz entregado por Supabase.

## Migraciones

Ejecutar en el proyecto remoto, en este orden:

1. `001_initial_schema.sql`
2. `002_updated_at_triggers.sql`
3. `003_supabase_auth_user_trigger.sql`
4. `004_supabase_auth_user_delete_sync.sql`
5. `005_supabase_rls_policies.sql`
6. `006_supabase_storage_content.sql`
7. `007_content_fichas_fields.sql`
8. `008_content_review_fields.sql`
9. `009_place_coordinate_provenance.sql`

Las migraciones `003`, `004`, `005` y `006` son exclusivas de Supabase.
`database/00_init.sh` las omite en PostgreSQL local porque dependen de
`auth.users`, `auth.uid()`, `anon`, `authenticated` o `storage`.

## Inicio de la Fase 4B

La migración `006` crea dos buckets con responsabilidades separadas:

- `xplorasg-review`: privado; recibe archivos de prestadores bajo la ruta
  `<auth.uid()>/...` mientras el contenido está pendiente.
- `xplorasg-public`: público; sólo los administradores pueden escribir o retirar
  objetos aprobados.

También agrega propiedad y metadatos de Storage a `public.multimedia`, y limita
las asociaciones de servicios y prestadores a recursos propios. La semilla
`002_tourism_places_draft.sql` registra el inventario nominal inicial. Después,
`003_content_from_fichas.sql` completa los 20 lugares y agrega 16 servicios y
16 perfiles provisionales de prestador desde las fichas DOCX. Todos permanecen
como `borrador` hasta su verificación editorial.

Las 36 imágenes recuperadas no se publican automáticamente. El cargador
`backend/scripts/uploadFichasMedia.js` las destina al bucket privado
`xplorasg-review` y requiere la clave administrativa únicamente al ejecutar
la opción `--apply`.

La migración `008` agrega responsable, fecha y motivo de revisión a lugares y
servicios. La bandeja `/admin/contenido` está protegida por rol administrador y
la API bloquea la aprobación si faltan requisitos de publicación.

La migración `009` diferencia coordenadas pendientes, candidatas y verificadas.
La semilla `004_verified_coordinates.sql` registra las coordenadas oficiales de
las cinco misiones franciscanas publicadas por UNESCO y actualiza la información
operativa de Ranas desde el INAH. Las coordenadas de OpenStreetMap permanecen
como auditoría editorial y no se aplican automáticamente.

## Criterio de cierre de 4A

Se comprobó:

- Registro e inicio de sesión reales.
- Creación automática del perfil en `public.usuarios`.
- Validación de JWT en Express.
- Express conectado a la misma base remota.
- Respuestas `401`, `403` y `200` correctas.
- Acceso administrativo válido.
- Políticas RLS probadas con `anon`, turista, prestador y administrador.
- Eliminación sincronizada de un usuario de prueba.
- Ausencia de secretos en frontend y Git.
- Pruebas de regresión y documentación actualizada.

