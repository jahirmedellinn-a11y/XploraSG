-- 007_content_fichas_fields.sql
-- Campos editoriales requeridos por las fichas reales de lugares y servicios.
-- Todo el contenido importado se mantiene en borrador hasta su validación.

-- Compatibilidad local: 006 es exclusiva de Supabase y se omite en Docker,
-- pero la API comparte estas columnas de catálogo multimedia.
ALTER TABLE public.multimedia
  ALTER COLUMN url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS bucket_id TEXT,
  ADD COLUMN IF NOT EXISTS object_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS subido_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_multimedia_storage_object
  ON public.multimedia (bucket_id, object_path)
  WHERE bucket_id IS NOT NULL AND object_path IS NOT NULL;

ALTER TABLE public.lugares_turisticos
  ADD COLUMN IF NOT EXISTS horarios TEXT,
  ADD COLUMN IF NOT EXISTS costo TEXT,
  ADD COLUMN IF NOT EXISTS actividades TEXT,
  ADD COLUMN IF NOT EXISTS servicios_disponibles TEXT,
  ADD COLUMN IF NOT EXISTS accesibilidad TEXT,
  ADD COLUMN IF NOT EXISTS recomendaciones TEXT,
  ADD COLUMN IF NOT EXISTS contacto TEXT,
  ADD COLUMN IF NOT EXISTS fuente_verificacion TEXT;

-- Las fichas editoriales pueden existir antes de que el prestador cree una
-- cuenta. El vínculo se completa cuando el negocio reclama y valida su perfil.
ALTER TABLE public.prestadores
  ALTER COLUMN usuario_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fuente_verificacion TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_prestadores_slug
  ON public.prestadores (slug)
  WHERE slug IS NOT NULL;

ALTER TABLE public.servicios
  ALTER COLUMN rango_precio TYPE TEXT,
  ADD COLUMN IF NOT EXISTS municipio_id INT REFERENCES public.municipios(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tipo_servicio TEXT,
  ADD COLUMN IF NOT EXISTS ubicacion TEXT,
  ADD COLUMN IF NOT EXISTS reservacion TEXT,
  ADD COLUMN IF NOT EXISTS capacidad_requisitos TEXT,
  ADD COLUMN IF NOT EXISTS accesibilidad TEXT,
  ADD COLUMN IF NOT EXISTS lugares_relacionados TEXT,
  ADD COLUMN IF NOT EXISTS fuente_verificacion TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_servicios_slug
  ON public.servicios (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_servicios_municipio
  ON public.servicios (municipio_id);

