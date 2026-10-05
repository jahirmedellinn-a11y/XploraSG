-- 001_initial_schema.sql
-- Creación del esquema relacional base para XploraSG

-- Habilitar extensión para UUIDs (compatible con Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);

-- 2. USUARIOS
-- Compatible con auth.users de Supabase
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. MUNICIPIOS
CREATE TABLE municipios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. CATEGORÍAS
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

-- 5. LUGARES TURÍSTICOS
CREATE TABLE lugares_turisticos (
    id SERIAL PRIMARY KEY,
    municipio_id INT NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    altitud INT,
    direccion TEXT,
    info_acceso TEXT,
    estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. PRESTADORES
CREATE TABLE prestadores (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    nombre_comercial VARCHAR(255) NOT NULL,
    descripcion TEXT,
    telefono VARCHAR(50),
    correo VARCHAR(255),
    redes_sociales JSONB,
    direccion TEXT,
    estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 7. SERVICIOS
CREATE TABLE servicios (
    id SERIAL PRIMARY KEY,
    prestador_id INT NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    lugar_id INT REFERENCES lugares_turisticos(id) ON DELETE SET NULL,
    categoria_id INT REFERENCES categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    rango_precio VARCHAR(100),
    contacto TEXT,
    horario TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. ACTIVIDADES
CREATE TABLE actividades (
    id SERIAL PRIMARY KEY,
    lugar_id INT NOT NULL REFERENCES lugares_turisticos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    duracion VARCHAR(100),
    dificultad VARCHAR(50),
    recomendaciones TEXT,
    estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 9. EVENTOS
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    lugar_id INT REFERENCES lugares_turisticos(id) ON DELETE SET NULL,
    prestador_id INT REFERENCES prestadores(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    horario TEXT,
    contacto TEXT,
    estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 10. PROMOCIONES
CREATE TABLE promociones (
    id SERIAL PRIMARY KEY,
    servicio_id INT REFERENCES servicios(id) ON DELETE CASCADE,
    prestador_id INT REFERENCES prestadores(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    condiciones TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 11. FAVORITOS (Tabla de relación N:M)
CREATE TABLE favoritos (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    lugar_id INT NOT NULL REFERENCES lugares_turisticos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, lugar_id)
);

-- 12. MULTIMEDIA (Catálogo centralizado)
CREATE TABLE multimedia (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('image', 'video', '360', '3d')),
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    titulo VARCHAR(255),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. RELACIONES DE MULTIMEDIA (Tablas de intersección)
CREATE TABLE lugar_multimedia (
    lugar_id INT NOT NULL REFERENCES lugares_turisticos(id) ON DELETE CASCADE,
    multimedia_id INT NOT NULL REFERENCES multimedia(id) ON DELETE CASCADE,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (lugar_id, multimedia_id)
);

CREATE TABLE servicio_multimedia (
    servicio_id INT NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    multimedia_id INT NOT NULL REFERENCES multimedia(id) ON DELETE CASCADE,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (servicio_id, multimedia_id)
);

CREATE TABLE actividad_multimedia (
    actividad_id INT NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    multimedia_id INT NOT NULL REFERENCES multimedia(id) ON DELETE CASCADE,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (actividad_id, multimedia_id)
);

CREATE TABLE evento_multimedia (
    evento_id INT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    multimedia_id INT NOT NULL REFERENCES multimedia(id) ON DELETE CASCADE,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (evento_id, multimedia_id)
);

CREATE TABLE promocion_multimedia (
    promocion_id INT NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    multimedia_id INT NOT NULL REFERENCES multimedia(id) ON DELETE CASCADE,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (promocion_id, multimedia_id)
);

CREATE TABLE prestador_multimedia (
    prestador_id INT NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    multimedia_id INT NOT NULL REFERENCES multimedia(id) ON DELETE CASCADE,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (prestador_id, multimedia_id)
);

-- 14. ÍNDICES para optimizar consultas frecuentes
CREATE INDEX idx_lugares_municipio ON lugares_turisticos(municipio_id);
CREATE INDEX idx_lugares_categoria ON lugares_turisticos(categoria_id);
CREATE INDEX idx_lugares_estado ON lugares_turisticos(estado_aprobacion);
CREATE INDEX idx_servicios_prestador ON servicios(prestador_id);
CREATE INDEX idx_servicios_lugar ON servicios(lugar_id);
CREATE INDEX idx_eventos_fechas ON eventos(fecha_inicio, fecha_fin);
CREATE INDEX idx_promociones_fechas ON promociones(fecha_inicio, fecha_fin);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
