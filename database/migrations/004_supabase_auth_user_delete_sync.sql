-- 004_supabase_auth_user_delete_sync.sql
-- Migración exclusiva para Supabase.
-- ATENCIÓN: Este script asume la existencia del esquema "auth" propio de Supabase.
-- Establece la integridad referencial para evitar perfiles huérfanos.

-- En lugar de crear un trigger AFTER DELETE (que consume más recursos), 
-- la mejor práctica en Supabase es establecer una llave foránea directa
-- hacia auth.users con la política ON DELETE CASCADE.

ALTER TABLE public.usuarios
  ADD CONSTRAINT fk_auth_users
  FOREIGN KEY (id)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;
