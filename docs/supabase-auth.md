# Sincronización entre Supabase Auth y public usuarios

## Creación de perfiles

La migración `003_supabase_auth_user_trigger.sql` crea `public.handle_new_user()` y el trigger `on_auth_user_created`.

Cuando Supabase inserta una cuenta en `auth.users`, la función:

1. Busca dinámicamente el rol `turista`.
2. Inserta el mismo UUID y correo en `public.usuarios`.
3. Copia el campo opcional `nombre` desde `raw_user_meta_data`.
4. Ignora cualquier rol solicitado por el cliente.
5. Evita duplicados mediante `ON CONFLICT (id) DO NOTHING`.

La función utiliza `SECURITY DEFINER` y fija `search_path = public` para poder escribir desde el contexto de Auth sin permitir que el cliente elija objetos alternativos.

## Eliminación de perfiles

La migración `004_supabase_auth_user_delete_sync.sql` agrega la llave foránea:

`public.usuarios.id → auth.users.id ON DELETE CASCADE`

Por lo tanto, eliminar una cuenta de prueba desde Supabase Auth también elimina el perfil público correspondiente. Las relaciones que usan `ON DELETE RESTRICT` pueden impedir la operación si el usuario ya posee datos dependientes; ese comportamiento debe evaluarse antes de habilitar eliminación de cuentas en producción.

## Validación de tokens

Express selecciona el modo con `AUTH_MODE`:

- `dev`: acepta únicamente tokens HS256 firmados con `DEV_JWT_SECRET`.
- `supabase`: inspecciona el algoritmo del token.
  - `RS256` o `ES256`: descarga y almacena temporalmente las claves públicas del JWKS del proyecto.
  - `HS256` heredado: valida con el servidor de Supabase Auth mediante la publishable/anon key. Sólo si esa clave no existe se admite `SUPABASE_JWT_SECRET` como compatibilidad temporal.

Después de validar firma, emisor, audiencia y vencimiento, el backend consulta `public.usuarios` para obtener el rol real. Nunca utiliza un rol enviado por el frontend para autorizar recursos.

## Prueba E2E requerida

1. Registrar una cuenta turista desde el frontend.
2. Confirmar el registro en `auth.users` y `public.usuarios` con el mismo UUID.
3. Consumir `/api/auth/me` con el access token real.
4. Verificar `200` en una ruta protegida y `403` en la ruta administrativa.
5. Asignar el rol administrador desde un canal administrativo seguro y verificar `200`.
6. Eliminar el usuario de prueba y comprobar la cascada.

