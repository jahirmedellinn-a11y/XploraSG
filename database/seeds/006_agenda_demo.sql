-- 006_agenda_demo.sql
-- Eventos culturales y promociones de ejemplo para la Agenda.
-- Los eventos son fiestas y tradiciones reales de la Sierra Gorda, pero las FECHAS SON
-- APROXIMADAS: confírmalas con la Dirección de Turismo de cada municipio antes de publicar.
-- Las promociones son de DEMOSTRACIÓN: se ligan a un prestador ficticio "XploraSG (demostración)"
-- (en borrador, no aparece en el catálogo) porque Supabase exige dueño en cada promoción
-- (constraint promociones_propietario_requerido). Así no se atribuyen descuentos a negocios reales.
-- Idempotente: no duplica registros si se ejecuta más de una vez.
-- Las horas usan -06:00 (America/Mexico_City).

BEGIN;

INSERT INTO public.eventos (lugar_id, nombre, descripcion, fecha_inicio, fecha_fin, horario, contacto, estado_aprobacion)
SELECT
  (SELECT id FROM public.lugares_turisticos WHERE slug = v.lugar_slug AND deleted_at IS NULL LIMIT 1),
  v.nombre, v.descripcion, v.fecha_inicio::timestamptz, v.fecha_fin::timestamptz, v.horario, v.contacto, 'aprobado'
FROM (VALUES
  (
    'mision-de-jalpan',
    'Día de Muertos en la Sierra Gorda',
    'Altares, ofrendas y arcos de flor de cempasúchil en plazas y panteones de la región. Una de las tradiciones más vivas de las comunidades serranas, con visitas familiares a los difuntos y comida típica.',
    '2026-10-31 00:00:00-06', '2026-11-02 23:59:00-06',
    'Todo el día; las ofrendas lucen mejor por la tarde y noche.',
    'Dirección de Turismo municipal (confirmar programa)'
  ),
  (
    'mision-de-landa',
    'Fiesta de la Purísima Concepción en la Misión de Landa',
    'Fiesta patronal de la misión franciscana de Santa María de la Purísima Concepción del Agua de Landa, Patrimonio Mundial. Celebración religiosa con procesión, música tradicional y feria en la plaza.',
    '2026-12-07 00:00:00-06', '2026-12-08 23:59:00-06',
    'Día principal: 8 de diciembre.',
    'Dirección de Turismo de Landa de Matamoros (confirmar programa)'
  ),
  (
    NULL,
    'Concurso Nacional de Huapango en San Joaquín',
    'Encuentro de parejas de baile de huapango de todo el país, acompañado por tríos huastecos. Es el evento más emblemático de San Joaquín y se celebra tradicionalmente en Semana Santa.',
    '2027-03-25 00:00:00-06', '2027-03-28 23:59:00-06',
    'Semana Santa (fechas por confirmar en la convocatoria oficial).',
    'Presidencia Municipal de San Joaquín (confirmar convocatoria)'
  ),
  (
    'mision-de-jalpan',
    'Fiesta de Santiago Apóstol en Jalpan de Serra',
    'Fiesta patronal de la Misión de Santiago de Jalpan, la primera de las cinco misiones franciscanas fundadas por fray Junípero Serra. Incluye celebraciones religiosas, danzas, huapango y feria.',
    '2027-07-24 00:00:00-06', '2027-07-25 23:59:00-06',
    'Día principal: 25 de julio.',
    'Dirección de Turismo de Jalpan de Serra (confirmar programa)'
  ),
  (
    'mision-de-san-miguel-conca',
    'Fiesta de San Miguel Arcángel en Concá',
    'Fiesta patronal de la Misión de San Miguel Concá, en Arroyo Seco. La comunidad celebra con misa, procesión, música de huapango y gastronomía local.',
    '2027-09-28 00:00:00-06', '2027-09-29 23:59:00-06',
    'Día principal: 29 de septiembre.',
    'Dirección de Turismo de Arroyo Seco (confirmar programa)'
  )
) AS v(lugar_slug, nombre, descripcion, fecha_inicio, fecha_fin, horario, contacto)
WHERE NOT EXISTS (
  SELECT 1 FROM public.eventos e WHERE e.nombre = v.nombre AND e.deleted_at IS NULL
);

-- Prestador de demostración (sin usuario dueño; usuario_id es opcional desde la migración 007).
INSERT INTO public.prestadores (usuario_id, nombre_comercial, slug, descripcion, estado_aprobacion)
SELECT NULL, 'XploraSG (demostración)', 'xplorasg-demo',
       'Prestador ficticio para mostrar promociones de ejemplo en el prototipo.', 'borrador'
WHERE NOT EXISTS (SELECT 1 FROM public.prestadores WHERE slug = 'xplorasg-demo');

INSERT INTO public.promociones (prestador_id, servicio_id, titulo, descripcion, condiciones, fecha_inicio, fecha_fin, estado_aprobacion)
SELECT (SELECT id FROM public.prestadores WHERE slug = 'xplorasg-demo'), NULL, v.titulo, v.descripcion, v.condiciones, v.fecha_inicio::timestamptz, v.fecha_fin::timestamptz, 'aprobado'
FROM (VALUES
  (
    'Ruta de las Misiones: tarifa grupal',
    'Recorrido guiado por las misiones franciscanas con tarifa preferente para grupos de 6 personas o más.',
    'Promoción de demostración del prototipo XploraSG. Sujeta a disponibilidad del prestador.',
    '2026-10-01 00:00:00-06', '2026-12-15 23:59:00-06'
  ),
  (
    'Temporada de Día de Muertos: noche extra',
    'Hospedaje en la Sierra Gorda con noche adicional a precio especial durante la temporada de Día de Muertos.',
    'Promoción de demostración del prototipo XploraSG. Aplica en estancias de 2 noches o más.',
    '2026-10-20 00:00:00-06', '2026-11-03 23:59:00-06'
  ),
  (
    'Sabores de la Sierra: menú regional',
    'Degustación de cocina serrana (enchiladas huastecas, zacahuil y pan de pulque) con bebida incluida.',
    'Promoción de demostración del prototipo XploraSG. Válida de lunes a jueves.',
    '2026-10-01 00:00:00-06', '2027-01-31 23:59:00-06'
  )
) AS v(titulo, descripcion, condiciones, fecha_inicio, fecha_fin)
WHERE EXISTS (SELECT 1 FROM public.prestadores WHERE slug = 'xplorasg-demo')
  AND NOT EXISTS (
  SELECT 1 FROM public.promociones p WHERE p.titulo = v.titulo AND p.deleted_at IS NULL
);

COMMIT;

SELECT
  (SELECT COUNT(*) FROM public.eventos     WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS eventos_aprobados,
  (SELECT COUNT(*) FROM public.promociones WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS promociones_aprobadas;
