-- 002_tourism_places_draft.sql
-- Inventario inicial transcrito de las carpetas de imágenes compartidas.
-- Los registros se conservan como borrador: faltan descripción, coordenadas,
-- fuente y revisión editorial antes de poder publicarlos.

WITH catalogo (municipio, categoria, nombre, slug) AS (
  VALUES
    ('Jalpan de Serra', 'Cultura y Arqueología', 'Misión de Jalpan', 'mision-de-jalpan'),
    ('Jalpan de Serra', 'Cultura y Arqueología', 'Misión de Tancoyol', 'mision-de-tancoyol'),
    ('Jalpan de Serra', 'Naturaleza', 'Presa Jalpan', 'presa-jalpan'),
    ('Jalpan de Serra', 'Cultura y Arqueología', 'Tancama', 'tancama'),
    ('Arroyo Seco', 'Naturaleza', 'Las Adjuntas', 'las-adjuntas'),
    ('Arroyo Seco', 'Cultura y Arqueología', 'Misión de San Miguel Concá', 'mision-de-san-miguel-conca'),
    ('Arroyo Seco', 'Naturaleza', 'Sótano del Barro', 'sotano-del-barro'),
    ('Landa de Matamoros', 'Cultura y Arqueología', 'Misión de Landa', 'mision-de-landa'),
    ('Landa de Matamoros', 'Cultura y Arqueología', 'Misión de Tilaco', 'mision-de-tilaco'),
    ('Landa de Matamoros', 'Naturaleza', 'Neblinas', 'neblinas'),
    ('Landa de Matamoros', 'Naturaleza', 'Río Verdito', 'rio-verdito'),
    ('Pinal de Amoles', 'Naturaleza', 'Cuatro Palos', 'cuatro-palos'),
    ('Pinal de Amoles', 'Naturaleza', 'El Chuveje', 'el-chuveje'),
    ('Pinal de Amoles', 'Naturaleza', 'Mirador de Cristal', 'mirador-de-cristal'),
    ('Peñamiller', 'Naturaleza', 'Balneario El Oasis', 'balneario-el-oasis'),
    ('Peñamiller', 'Naturaleza', 'Cañón del Paraíso', 'canon-del-paraiso'),
    ('Peñamiller', 'Cultura y Arqueología', 'Vestigios Prehistóricos', 'vestigios-prehistoricos'),
    ('San Joaquín', 'Naturaleza', 'Cascadas Maravilla', 'cascadas-maravilla'),
    ('San Joaquín', 'Naturaleza', 'Grutas de los Herrera', 'grutas-de-los-herrera'),
    ('San Joaquín', 'Cultura y Arqueología', 'Ranas', 'ranas')
)
INSERT INTO public.lugares_turisticos (
  municipio_id,
  categoria_id,
  nombre,
  slug,
  estado_aprobacion
)
SELECT
  m.id,
  c.id,
  catalogo.nombre,
  catalogo.slug,
  'borrador'
FROM catalogo
JOIN public.municipios AS m ON m.nombre = catalogo.municipio
JOIN public.categorias AS c ON c.nombre = catalogo.categoria
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  total_catalogo INT;
BEGIN
  SELECT COUNT(*)
  INTO total_catalogo
  FROM public.lugares_turisticos
  WHERE slug IN (
    'mision-de-jalpan', 'mision-de-tancoyol', 'presa-jalpan', 'tancama',
    'las-adjuntas', 'mision-de-san-miguel-conca', 'sotano-del-barro',
    'mision-de-landa', 'mision-de-tilaco', 'neblinas', 'rio-verdito',
    'cuatro-palos', 'el-chuveje', 'mirador-de-cristal',
    'balneario-el-oasis', 'canon-del-paraiso', 'vestigios-prehistoricos',
    'cascadas-maravilla', 'grutas-de-los-herrera', 'ranas'
  );

  IF total_catalogo <> 20 THEN
    RAISE EXCEPTION 'Se esperaban 20 lugares del inventario inicial; se encontraron %', total_catalogo;
  END IF;
END;
$$;
