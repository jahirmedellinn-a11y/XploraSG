-- 006_supabase_storage_content.sql
-- Fase 4B: propiedad de multimedia, buckets y políticas de Supabase Storage.
-- Esta migración es exclusiva de Supabase y debe ejecutarse después de 005.

ALTER TABLE public.multimedia
  ALTER COLUMN url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS bucket_id TEXT,
  ADD COLUMN IF NOT EXISTS object_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS subido_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'multimedia_origen_valido'
      AND conrelid = 'public.multimedia'::regclass
  ) THEN
    ALTER TABLE public.multimedia
      ADD CONSTRAINT multimedia_origen_valido
      CHECK (
        url IS NOT NULL
        OR (bucket_id IS NOT NULL AND object_path IS NOT NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'multimedia_size_bytes_no_negativo'
      AND conrelid = 'public.multimedia'::regclass
  ) THEN
    ALTER TABLE public.multimedia
      ADD CONSTRAINT multimedia_size_bytes_no_negativo
      CHECK (size_bytes IS NULL OR size_bytes >= 0);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_multimedia_storage_object
  ON public.multimedia (bucket_id, object_path)
  WHERE bucket_id IS NOT NULL AND object_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_multimedia_subido_por
  ON public.multimedia (subido_por);

DROP TRIGGER IF EXISTS update_multimedia_updated_at ON public.multimedia;
CREATE TRIGGER update_multimedia_updated_at
  BEFORE UPDATE ON public.multimedia
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Bucket público: sólo administradores publican aquí contenido ya aprobado.
-- Bucket privado: los prestadores cargan recursos pendientes bajo <auth.uid()>/...
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) VALUES
(
  'xplorasg-public',
  'xplorasg-public',
  TRUE,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']::TEXT[]
),
(
  'xplorasg-review',
  'xplorasg-review',
  FALSE,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.owns_multimedia(target_multimedia_id INT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.multimedia AS m
    WHERE m.id = target_multimedia_id
      AND m.subido_por = (SELECT auth.uid())
      AND m.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.owns_multimedia(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_multimedia(INT) TO authenticated;

DROP POLICY IF EXISTS multimedia_propietario_lectura ON public.multimedia;
CREATE POLICY multimedia_propietario_lectura
ON public.multimedia FOR SELECT TO authenticated
USING (
  subido_por = (SELECT auth.uid())
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS multimedia_propietario_insercion ON public.multimedia;
CREATE POLICY multimedia_propietario_insercion
ON public.multimedia FOR INSERT TO authenticated
WITH CHECK (
  subido_por = (SELECT auth.uid())
  AND public.current_user_role() IN ('prestador', 'administrador')
  AND bucket_id = 'xplorasg-review'
  AND (storage.foldername(object_path))[1] = (SELECT auth.uid()::TEXT)
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS multimedia_propietario_actualizacion ON public.multimedia;
CREATE POLICY multimedia_propietario_actualizacion
ON public.multimedia FOR UPDATE TO authenticated
USING (
  subido_por = (SELECT auth.uid())
  AND bucket_id = 'xplorasg-review'
  AND deleted_at IS NULL
)
WITH CHECK (
  subido_por = (SELECT auth.uid())
  AND bucket_id = 'xplorasg-review'
  AND (storage.foldername(object_path))[1] = (SELECT auth.uid()::TEXT)
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS multimedia_propietario_eliminacion ON public.multimedia;
CREATE POLICY multimedia_propietario_eliminacion
ON public.multimedia FOR DELETE TO authenticated
USING (
  subido_por = (SELECT auth.uid())
  AND bucket_id = 'xplorasg-review'
);

-- Los prestadores sólo pueden asociar sus propios archivos con recursos propios.
DROP POLICY IF EXISTS servicio_multimedia_propios_gestion ON public.servicio_multimedia;
CREATE POLICY servicio_multimedia_propios_gestion
ON public.servicio_multimedia FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.servicios AS s
    WHERE s.id = servicio_multimedia.servicio_id
      AND public.owns_prestador(s.prestador_id)
  )
  AND public.owns_multimedia(multimedia_id)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.servicios AS s
    WHERE s.id = servicio_multimedia.servicio_id
      AND public.owns_prestador(s.prestador_id)
  )
  AND public.owns_multimedia(multimedia_id)
);

DROP POLICY IF EXISTS prestador_multimedia_propios_gestion ON public.prestador_multimedia;
CREATE POLICY prestador_multimedia_propios_gestion
ON public.prestador_multimedia FOR ALL TO authenticated
USING (
  public.owns_prestador(prestador_id)
  AND public.owns_multimedia(multimedia_id)
)
WITH CHECK (
  public.owns_prestador(prestador_id)
  AND public.owns_multimedia(multimedia_id)
);

-- Lectura y carga en Storage. El bucket público se sirve directamente; sólo los
-- administradores pueden escribirlo. El bucket de revisión permanece privado.
DROP POLICY IF EXISTS xplorasg_public_read ON storage.objects;
CREATE POLICY xplorasg_public_read
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'xplorasg-public');

DROP POLICY IF EXISTS xplorasg_review_owner_read ON storage.objects;
CREATE POLICY xplorasg_review_owner_read
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'xplorasg-review'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS xplorasg_review_owner_insert ON storage.objects;
CREATE POLICY xplorasg_review_owner_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'xplorasg-review'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
  AND public.current_user_role() IN ('prestador', 'administrador')
);

DROP POLICY IF EXISTS xplorasg_review_owner_update ON storage.objects;
CREATE POLICY xplorasg_review_owner_update
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'xplorasg-review'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
    OR public.is_admin()
  )
)
WITH CHECK (
  bucket_id = 'xplorasg-review'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS xplorasg_review_owner_delete ON storage.objects;
CREATE POLICY xplorasg_review_owner_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'xplorasg-review'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS xplorasg_public_admin_insert ON storage.objects;
CREATE POLICY xplorasg_public_admin_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'xplorasg-public'
  AND public.is_admin()
);

DROP POLICY IF EXISTS xplorasg_public_admin_update ON storage.objects;
CREATE POLICY xplorasg_public_admin_update
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'xplorasg-public' AND public.is_admin())
WITH CHECK (bucket_id = 'xplorasg-public' AND public.is_admin());

DROP POLICY IF EXISTS xplorasg_public_admin_delete ON storage.objects;
CREATE POLICY xplorasg_public_admin_delete
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'xplorasg-public' AND public.is_admin());
