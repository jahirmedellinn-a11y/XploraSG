-- 004_verified_coordinates.sql
-- Coordenadas oficiales de las cinco misiones franciscanas publicadas por
-- UNESCO en la decisión 27 COM 8C.26. La conversión DMS -> decimal conserva
-- la precisión de décimas de segundo de la fuente.

WITH coordenadas (slug, latitud, longitud) AS (
  VALUES
    ('mision-de-jalpan', 21.20438889, -99.46411111),
    ('mision-de-landa', 21.16922222, -99.31083333),
    ('mision-de-tilaco', 21.16119444, -99.19263889),
    ('mision-de-tancoyol', 21.40041667, -99.32802778),
    ('mision-de-san-miguel-conca', 21.44469444, -99.63694444)
)
UPDATE public.lugares_turisticos AS lugar
SET latitud = coordenadas.latitud,
    longitud = coordenadas.longitud,
    estado_coordenadas = 'verificada',
    fuente_coordenadas = 'https://whc.unesco.org/en/decisions/721',
    coordenadas_verificadas_at = TIMESTAMP WITH TIME ZONE '2026-10-03 00:00:00-06',
    updated_at = CURRENT_TIMESTAMP
FROM coordenadas
WHERE lugar.slug = coordenadas.slug;

-- La ficha de Las Adjuntas contiene números, pero no una fuente cartográfica
-- comprobable. Se conserva en el mapa de trabajo y no cuenta como verificada.
UPDATE public.lugares_turisticos
SET estado_coordenadas = 'candidata',
    fuente_coordenadas = 'Ficha DOCX entregada; pendiente de validación cartográfica',
    coordenadas_verificadas_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'las-adjuntas'
  AND latitud IS NOT NULL
  AND longitud IS NOT NULL;

-- Datos operativos vigentes en la ficha oficial del INAH, actualizada el
-- 12 de enero de 2026. El registro permanece en borrador.
UPDATE public.lugares_turisticos
SET horarios = 'Miércoles a domingo de 09:00 a 17:00 h.',
    costo = 'Visitantes nacionales: $80 MXN. Visitantes extranjeros: $145 MXN.',
    fuente_verificacion = 'INAH, Zona Arqueológica Las Ranas (actualización oficial del 12 de enero de 2026): https://www.inah.gob.mx/zonas/zona-arqueologica-de-ranas',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'ranas';

DO $$
DECLARE
  total_verificadas INT;
BEGIN
  SELECT COUNT(*) INTO total_verificadas
  FROM public.lugares_turisticos
  WHERE slug IN (
    'mision-de-jalpan',
    'mision-de-landa',
    'mision-de-tilaco',
    'mision-de-tancoyol',
    'mision-de-san-miguel-conca'
  )
    AND estado_coordenadas = 'verificada'
    AND latitud IS NOT NULL
    AND longitud IS NOT NULL;

  IF total_verificadas <> 5 THEN
    RAISE EXCEPTION 'Se esperaban 5 misiones con coordenadas verificadas; se encontraron %', total_verificadas;
  END IF;
END;
$$;
