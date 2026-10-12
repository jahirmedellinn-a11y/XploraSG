-- 015_supabase_administrador_xplorasg.sql
-- Migración exclusiva para Supabase (usa el esquema "auth").
--
-- Cambia la cuenta administradora del panel:
--   antes: hermelindarojasrubio@gmail.com  ->  ahora: xplora.sg8@gmail.com (cuenta oficial de XploraSG)
-- La cuenta personal no se borra: sólo deja de ser administradora y queda como turista.
--
-- Funciona aunque xplora.sg8@gmail.com YA esté registrada como turista: no hace falta volver a
-- registrarla (la app dirá "ya está registrado" y es normal). Basta con:
--   1. Que la cuenta tenga el correo confirmado (enlace que llega a esa bandeja).
--   2. Ejecutar este script en Supabase → SQL Editor.
-- La contraseña nunca va en este archivo.
--
-- Por seguridad sólo se promueve la cuenta si su correo ya está confirmado.
-- La cuenta anterior sólo pierde el rol si la nueva quedó como administradora (nunca te quedas sin acceso).
-- Es seguro ejecutarlo varias veces. Lee los mensajes (NOTICE) en la pestaña de resultados.

DO $$
DECLARE
  admin_role_id INT;
  turista_role_id INT;
  cuenta RECORD;
BEGIN
  SELECT id INTO admin_role_id FROM public.roles WHERE nombre = 'administrador';
  SELECT id INTO turista_role_id FROM public.roles WHERE nombre = 'turista';
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'El rol "administrador" no existe en la base de datos.';
  END IF;

  SELECT id, email, email_confirmed_at, raw_user_meta_data->>'nombre' AS nombre
    INTO cuenta
    FROM auth.users
   WHERE lower(email) = 'xplora.sg8@gmail.com'
   ORDER BY created_at DESC
   LIMIT 1;

  IF cuenta.id IS NULL THEN
    RAISE NOTICE 'No existe ninguna cuenta con xplora.sg8@gmail.com. Regístrala en la app y vuelve a ejecutar este script.';
    RETURN;
  END IF;

  IF cuenta.email_confirmed_at IS NULL THEN
    RAISE NOTICE 'La cuenta xplora.sg8@gmail.com existe pero su correo NO está confirmado. Ábrelo desde el enlace de confirmación (o en la app intenta iniciar sesión y toca "Reenviar correo de confirmación") y vuelve a ejecutar este script. hermelindarojasrubio@gmail.com sigue como administradora.';
    RETURN;
  END IF;

  -- La cuenta ya registrada (turista) pasa a administradora. Si por algún motivo no tenía fila en
  -- public.usuarios (por ejemplo, se registró antes de crear el trigger), se crea aquí.
  INSERT INTO public.usuarios (id, email, rol_id, nombre)
  VALUES (cuenta.id, lower(cuenta.email), admin_role_id, cuenta.nombre)
  ON CONFLICT (id) DO UPDATE
    SET rol_id = admin_role_id,
        deleted_at = NULL;

  UPDATE public.usuarios
     SET rol_id = turista_role_id
   WHERE rol_id = admin_role_id
     AND lower(email) = 'hermelindarojasrubio@gmail.com';

  RAISE NOTICE 'Listo: xplora.sg8@gmail.com es la administradora y hermelindarojasrubio@gmail.com pasó a turista. Cierra sesión y vuelve a entrar.';
END $$;

-- Verificación: debe aparecer sólo xplora.sg8@gmail.com con rol "administrador".
SELECT u.email, r.nombre AS rol
  FROM public.usuarios AS u
  JOIN public.roles AS r ON r.id = u.rol_id
 WHERE r.nombre = 'administrador'
 ORDER BY u.email;
