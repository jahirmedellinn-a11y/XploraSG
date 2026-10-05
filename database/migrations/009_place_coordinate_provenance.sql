-- 009_place_coordinate_provenance.sql
-- Distingue coordenadas verificadas de aproximaciones o resultados candidatos.

ALTER TABLE public.lugares_turisticos
  ADD COLUMN IF NOT EXISTS estado_coordenadas VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS fuente_coordenadas TEXT,
  ADD COLUMN IF NOT EXISTS coordenadas_verificadas_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lugares_estado_coordenadas_check'
      AND conrelid = 'public.lugares_turisticos'::regclass
  ) THEN
    ALTER TABLE public.lugares_turisticos
      ADD CONSTRAINT lugares_estado_coordenadas_check
      CHECK (estado_coordenadas IN ('pendiente', 'candidata', 'verificada'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_lugares_estado_coordenadas
  ON public.lugares_turisticos (estado_coordenadas);
