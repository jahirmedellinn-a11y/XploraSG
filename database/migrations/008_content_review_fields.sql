-- 008_content_review_fields.sql
-- Auditoría mínima del flujo editorial sin alterar el modelo de 18 tablas.

ALTER TABLE public.lugares_turisticos
  ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS motivo_revision TEXT;

ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS motivo_revision TEXT;

CREATE INDEX IF NOT EXISTS idx_lugares_revisado_por
  ON public.lugares_turisticos (revisado_por);

CREATE INDEX IF NOT EXISTS idx_servicios_revisado_por
  ON public.servicios (revisado_por);

