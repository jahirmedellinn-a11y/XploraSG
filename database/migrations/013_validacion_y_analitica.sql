-- 013_validacion_y_analitica.sql
-- Instrumentos de validación del prototipo (Anexo 1, NTCyT 2026):
--   * encuestas:   satisfacción, aceptación y reducción del tiempo de búsqueda.
--   * eventos_uso: analítica anónima (vistas, búsquedas, clics de contacto, rutas).
-- No se guardan IP ni datos personales; sólo el usuario si la persona tiene sesión iniciada.
-- Idempotente y compatible con PostgreSQL local y Supabase.

CREATE TABLE IF NOT EXISTS public.encuestas (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    perfil VARCHAR(20) NOT NULL DEFAULT 'turista'
        CHECK (perfil IN ('turista', 'prestador', 'estudiante', 'docente', 'otro')),
    satisfaccion SMALLINT NOT NULL CHECK (satisfaccion BETWEEN 1 AND 5),
    facilidad SMALLINT NOT NULL CHECK (facilidad BETWEEN 1 AND 5),
    utilidad SMALLINT NOT NULL CHECK (utilidad BETWEEN 1 AND 5),
    recomendaria BOOLEAN NOT NULL,
    minutos_otros_medios SMALLINT CHECK (minutos_otros_medios BETWEEN 0 AND 600),
    minutos_xplorasg SMALLINT CHECK (minutos_xplorasg BETWEEN 0 AND 600),
    modulo_favorito VARCHAR(30),
    comentario TEXT CHECK (char_length(comentario) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encuestas_created ON public.encuestas (created_at);

CREATE TABLE IF NOT EXISTS public.eventos_uso (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('vista_lugar', 'vista_servicio', 'clic_whatsapp', 'busqueda', 'consulta_asistente', 'ruta', 'compartir')),
    referencia_id INT,
    termino VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_uso_tipo_fecha ON public.eventos_uso (tipo, created_at);

-- En Supabase: RLS activo y sin políticas públicas → sólo el backend (rol de servicio) puede leer/escribir.
ALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_uso ENABLE ROW LEVEL SECURITY;
