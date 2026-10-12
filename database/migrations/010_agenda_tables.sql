-- Migración para crear tablas de Agenda (Eventos y Promociones)

CREATE TABLE IF NOT EXISTS public.eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    lugar_id INTEGER REFERENCES public.lugares(id) ON DELETE SET NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    imagen_url TEXT,
    contacto VARCHAR(255),
    estado_aprobacion VARCHAR(50) DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'aprobado', 'rechazado')),
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.promociones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    servicio_id INTEGER REFERENCES public.servicios(id) ON DELETE SET NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    descuento_texto VARCHAR(100),
    estado_aprobacion VARCHAR(50) DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'aprobado', 'rechazado')),
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Eventos públicos aprobados son visibles para todos"
    ON public.eventos FOR SELECT
    USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);

CREATE POLICY "Promociones públicas aprobadas son visibles para todos"
    ON public.promociones FOR SELECT
    USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);
