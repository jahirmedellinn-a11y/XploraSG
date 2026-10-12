-- 005_aprobar_contenido_demo.sql
-- Publica en el catálogo público los lugares, prestadores y servicios cargados desde las fichas.
-- El catálogo público solo muestra registros con estado_aprobacion = 'aprobado', y los
-- servicios además requieren que su prestador esté aprobado.
--
-- IMPORTANTE: 003_content_from_fichas.sql vuelve a poner todo en 'borrador' si se re-ejecuta.
-- Por eso este archivo va DESPUÉS (005) y se debe volver a correr si se re-ejecuta 003.
-- Es idempotente: se puede correr varias veces sin problema.

BEGIN;

UPDATE public.lugares_turisticos
SET estado_aprobacion = 'aprobado',
    revisado_at = CURRENT_TIMESTAMP,
    motivo_revision = 'Aprobación masiva para el prototipo (verificar fichas antes de producción).',
    updated_at = CURRENT_TIMESTAMP
WHERE estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL;

UPDATE public.prestadores
SET estado_aprobacion = 'aprobado',
    updated_at = CURRENT_TIMESTAMP
WHERE estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
  AND slug IS DISTINCT FROM 'xplorasg-demo'; -- prestador ficticio de 006

UPDATE public.servicios
SET estado_aprobacion = 'aprobado',
    revisado_at = CURRENT_TIMESTAMP,
    motivo_revision = 'Aprobación masiva para el prototipo (verificar fichas antes de producción).',
    updated_at = CURRENT_TIMESTAMP
WHERE estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL;

COMMIT;

-- Verificación rápida (debería dar 20 lugares y 16 servicios aprobados):
SELECT
  (SELECT COUNT(*) FROM public.lugares_turisticos WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS lugares_aprobados,
  (SELECT COUNT(*) FROM public.prestadores        WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS prestadores_aprobados,
  (SELECT COUNT(*) FROM public.servicios          WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS servicios_aprobados;
