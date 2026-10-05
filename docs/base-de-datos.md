# Documentación de la Base de Datos - XploraSG

## 1. Objetivo
El objetivo de esta base de datos relacional (PostgreSQL) es soportar la gestión segura y normalizada de información turística de la Sierra Gorda. Mantiene la integridad referencial y se prepara para integrarse fluídamente con **Supabase Auth**.

## 2. Entidades y Relaciones Clave
- **Usuarios y Roles**: Un usuario tiene **1** rol de manera estricta. El ID del usuario es un `UUID` que referenciará en el futuro a `auth.users` de Supabase, evitando la persistencia de contraseñas propias.
- **Lugares Turísticos**: Un lugar pertenece a **1** municipio y a **1** categoría base.
- **Servicios**: Un servicio es administrado por **1** prestador, pertenece
  directamente a **1** municipio y puede, opcionalmente, ubicarse dentro de
  **1** lugar turístico específico. (Relación 1:N).
- **Actividades y Eventos**: Están ligados directamente a **1** lugar.
- **Favoritos**: Relación N:M entre `Usuarios` y `Lugares Turísticos`, implementada a través de la tabla `favoritos`.

## 3. Estrategia de Usuarios (Supabase)
La migración `003_supabase_auth_user_trigger.sql` implementa la creación automática de perfiles desde `auth.users` hacia `public.usuarios`. La migración `004_supabase_auth_user_delete_sync.sql` agrega la llave foránea con `ON DELETE CASCADE`. Ambas son exclusivas del proyecto remoto de Supabase.

La migración `005_supabase_rls_policies.sql` habilita RLS y define el acceso inicial para visitantes, turistas, prestadores y administradores. Las políticas deben probarse en el proyecto remoto antes de cerrar la Fase 4A.

Los prestadores importados desde fichas pueden existir temporalmente sin
`usuario_id`. La asociación con una cuenta real se completa cuando el negocio
reclama y verifica su perfil.

## 4. Estrategia Multimedia (Intersección Estricta)
En lugar de una relación polimórfica (`entidad_id`, `entidad_tipo`), se utiliza:
- Tabla central `multimedia`.
- Tablas de relación específicas (ej. `lugar_multimedia`, `servicio_multimedia`) para conectar una entidad con sus recursos asociados, incluyendo columnas de `orden` y `es_principal`.

## 5. Auditoría: Updated_at Automático
Se incluye una función genérica de PostgreSQL en `migrations/002_updated_at_triggers.sql` llamada `update_updated_at_column()` que intercepta las actualizaciones (`BEFORE UPDATE`). 
Está aplicada a `usuarios`, `municipios`, `lugares_turisticos`, `prestadores`, `servicios`, `actividades`, `eventos` y `promociones`. `created_at` permanece inalterado.

Las migraciones `007` y `008` agregan los campos completos de las fichas y la
auditoría editorial (`revisado_por`, `revisado_at`, `motivo_revision`) sin crear
tablas adicionales. La migración `009` conserva la fuente y el estado de
validación de cada coordenada. La API sólo permite aprobar registros que
cumplan los requisitos automáticos de publicación y, para un lugar, exige que
sus coordenadas estén marcadas como `verificada`.

## 6. Soft Delete y Cascadas
Las entidades clave poseen un campo `deleted_at`. 
- **Eliminación lógica (`deleted_at IS NOT NULL`):** Representa un borrado visual/funcional. No ejecuta las cláusulas `ON DELETE CASCADE`. Las entidades relacionadas permanecerán intactas pero el Backend deberá filtrar explícitamente (`WHERE deleted_at IS NULL`) al realizar consultas de catálogo.
- **Eliminación física (`DELETE FROM`):** Ejecutará estrictamente las reglas `CASCADE` o `RESTRICT` de PostgreSQL. 

## 7. Desarrollo Local y Ejecución Automática
Al levantar `docker compose up -d` por primera vez (con el volumen `pgdata` vacío), PostgreSQL lee y ejecuta `/database/00_init.sh`.
Este script recorre en orden:
1. `migrations/*.sql`, omitiendo los archivos cuyo nombre contiene `_supabase_`.
2. `seeds/*.sql`

Esta separación impide que PostgreSQL local intente ejecutar migraciones que requieren `auth.users`, `auth.uid()` o los roles internos de Supabase.

**Para configurar el entorno:**
Copia `.env.example` como `.env` en la raíz del proyecto. Estas credenciales son **exclusivas para desarrollo** y protegen la configuración de docker-compose sin exponer contraseñas en Git.
