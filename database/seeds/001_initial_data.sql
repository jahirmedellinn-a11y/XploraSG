-- 001_initial_data.sql
-- Inserción de datos iniciales estructurales (Semillas)

-- 1. ROLES
INSERT INTO roles (nombre, descripcion) VALUES
('turista', 'Usuario estándar que explora la plataforma y guarda favoritos.'),
('prestador', 'Dueño de negocio turístico, puede solicitar agregar servicios y lugares.'),
('administrador', 'Gestor de la plataforma, aprueba o rechaza solicitudes de prestadores.')
ON CONFLICT (nombre) DO NOTHING;

-- 2. MUNICIPIOS (Sierra Gorda de Querétaro)
INSERT INTO municipios (nombre, descripcion, latitud, longitud) VALUES
('Jalpan de Serra', 'Corazón de la Sierra Gorda y Pueblo Mágico.', 21.2186, -99.4722),
('Pinal de Amoles', 'Municipio boscoso y montañoso con atractivos naturales.', 21.1378, -99.6267),
('Arroyo Seco', 'Zona de ríos y valles en la Sierra Gorda.', 21.5475, -99.6897),
('Landa de Matamoros', 'Tierra de fósiles y misiones franciscanas.', 21.1861, -99.3183),
('San Joaquín', 'Pueblo Mágico famoso por sus grutas y huapango.', 20.9167, -99.5667),
('Peñamiller', 'La puerta a la Sierra Gorda.', 21.0500, -99.8167)
ON CONFLICT (nombre) DO NOTHING;

-- 3. CATEGORÍAS BASE
INSERT INTO categorias (nombre, descripcion) VALUES
('Naturaleza', 'Ríos, cascadas, bosques y reservas naturales.'),
('Cultura y Arqueología', 'Misiones, museos y zonas arqueológicas.'),
('Aventura', 'Tirolesas, cuatrimotos y turismo activo.'),
('Gastronomía', 'Restaurantes, fondas y comida típica.'),
('Hospedaje', 'Cabañas, hoteles y campamentos.'),
('Servicios Comunitarios', 'Servicios ofrecidos por la comunidad local.')
ON CONFLICT (nombre) DO NOTHING;
