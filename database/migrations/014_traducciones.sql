-- 014: Traducciones del contenido turístico (inglés y futuros idiomas).
-- Cada fila guarda sus traducciones en JSONB: {"en": {"descripcion": "...", "horarios": "..."}}.
-- Si falta una traducción, la API devuelve el texto original en español.
ALTER TABLE public.lugares_turisticos ADD COLUMN IF NOT EXISTS traducciones JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.servicios          ADD COLUMN IF NOT EXISTS traducciones JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.eventos            ADD COLUMN IF NOT EXISTS traducciones JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.promociones        ADD COLUMN IF NOT EXISTS traducciones JSONB NOT NULL DEFAULT '{}'::jsonb;
