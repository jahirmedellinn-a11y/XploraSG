-- 012_promociones_revision.sql
-- Alinea el esquema local con Supabase para el flujo de promociones de prestadores:
-- campos de revisión editorial y la regla de que toda promoción tenga dueño.
-- Idempotente: en Supabase (donde ya existen) no cambia nada.

ALTER TABLE public.promociones
  ADD COLUMN IF NOT EXISTS motivo_revision TEXT,
  ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS motivo_revision TEXT,
  ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promociones_propietario_requerido') THEN
    ALTER TABLE public.promociones
      ADD CONSTRAINT promociones_propietario_requerido
      CHECK (prestador_id IS NOT NULL OR servicio_id IS NOT NULL) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_promociones_estado ON public.promociones (estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_prestadores_usuario ON public.prestadores (usuario_id);
