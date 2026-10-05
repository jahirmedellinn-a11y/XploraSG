-- 003_supabase_auth_user_trigger.sql
-- Migración exclusiva para Supabase.
-- ATENCIÓN: Este script asume la existencia del esquema "auth" propio de Supabase.
-- Por lo tanto, fallará si se intenta ejecutar en el PostgreSQL local de Docker, 
-- el cual no posee la funcionalidad interna de Supabase Auth.

-- 1. Crear la función que sincroniza el usuario
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  turista_role_id INT;
BEGIN
  -- Obtener dinámicamente el ID del rol 'turista'
  SELECT id INTO turista_role_id FROM public.roles WHERE nombre = 'turista';

  -- Si por alguna razón crítica no existe el rol, el insert fallará protegiendo la BD.
  IF turista_role_id IS NULL THEN
    RAISE EXCEPTION 'El rol "turista" no existe en la base de datos.';
  END IF;

  -- Insertar el nuevo usuario forzando siempre el rol 'turista'.
  -- Evitar duplicados si el UUID ya fue sincronizado por reintentos.
  INSERT INTO public.usuarios (id, email, rol_id, nombre)
  VALUES (
    NEW.id, 
    NEW.email, 
    turista_role_id,
    -- En Supabase, los metadatos se pueden extraer del raw_user_meta_data si existen.
    -- Extraer el nombre si fue provisto en el registro, o dejar en nulo.
    NEW.raw_user_meta_data->>'nombre'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Crear el trigger vinculado a auth.users de Supabase
-- Se elimina primero por si se está re-ejecutando.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
