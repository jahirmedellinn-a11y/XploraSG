# Arquitectura de autenticación de XploraSG

## Modos de ejecución

La aplicación mantiene dos modos explícitos:

- `AUTH_MODE=dev`: andamiaje local de la Fase 3.
- `AUTH_MODE=supabase`: autenticación real de la Fase 4A.

Si `AUTH_MODE` no está definido, el backend selecciona Supabase cuando existe `SUPABASE_URL`; en caso contrario utiliza DEV. En producción se recomienda definir el modo explícitamente.

## Modo DEV

Los endpoints temporales `POST /api/auth/register` y `POST /api/auth/login` trabajan con PostgreSQL local y `DEV_JWT_SECRET`.

- El registro siempre asigna el rol `turista`.
- El cliente no puede seleccionar un rol privilegiado.
- No se almacenan contraseñas locales.
- Los tokens sólo aceptan el algoritmo HS256.

Este modo no debe desplegarse como autenticación de producción.

## Modo Supabase

1. React registra o inicia sesión mediante `@supabase/supabase-js`.
2. Supabase devuelve una sesión y un access token.
3. React envía el token a Express mediante `Authorization: Bearer`.
4. Express valida el token con el JWKS público del proyecto cuando la firma es asimétrica.
5. Para proyectos HS256 heredados, Express consulta `/auth/v1/user` utilizando la publishable/anon key.
6. Express consulta `public.usuarios` y obtiene el rol real de la base de datos.
7. `requireRole` aplica la autorización del endpoint.

La validación exige la audiencia configurada en `SUPABASE_JWT_AUDIENCE` y el emisor `${SUPABASE_URL}/auth/v1`.

## Sesión en frontend

`AuthContext`:

- Restaura la sesión existente.
- Sincroniza el access token con `/api/auth/me` antes de considerar autenticado al usuario.
- Limpia la sesión si el token es inválido o si el perfil no existe en la base consultada por Express.
- Maneja el registro con confirmación de correo sin navegar prematuramente al dashboard.
- Conserva el fallback DEV cuando no existen variables públicas de Supabase.

## Autorización

Ocultar elementos de interfaz no constituye seguridad. Cada endpoint sensible debe usar `requireAuth` y, cuando corresponda, `requireRole`. La propiedad de recursos debe verificarse en backend y reforzarse con RLS.

## Verificación de la Fase 4A

El 2 de octubre de 2026 se verificó:

- Variables locales configuradas y excluidas de Git.
- Migraciones remotas `001` a `005` y semillas aplicadas.
- `DATABASE_URL` y Supabase Auth operando sobre el mismo proyecto.
- Alta sincronizada en `public.usuarios` con rol inicial `turista`.
- Inicio de sesión y validación de JWT ES256 mediante JWKS.
- Respuestas `200`, `401` y `403` correctas en Express.
- Lectura pública `anon`, acceso al perfil propio y denegación de cambios
  privilegiados mediante RLS.
- Eliminación en cascada de `auth.users` hacia `public.usuarios`.

La prueba administrativa completa deberá repetirse cuando exista el primer
administrador funcional de la aplicación; la denegación de acceso administrativo
para un turista sí quedó verificada.

