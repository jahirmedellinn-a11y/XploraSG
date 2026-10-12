import { Request, Response } from 'express';
import pool from '../config/db';

// Panel administrativo: indicadores (análisis de datos), moderación de promociones
// y vinculación de cuentas de prestador.

export const getStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totals, byMunicipality, byCategory, topFavorites, usersByRole] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT COUNT(*)::INT FROM public.lugares_turisticos WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS lugares,
           (SELECT COUNT(*)::INT FROM public.servicios WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS servicios,
           (SELECT COUNT(*)::INT FROM public.prestadores WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS prestadores,
           (SELECT COUNT(*)::INT FROM public.eventos WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL AND fecha_fin >= NOW()) AS eventos_proximos,
           (SELECT COUNT(*)::INT FROM public.promociones WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL AND fecha_fin >= NOW()) AS promociones_activas,
           (SELECT COUNT(*)::INT FROM public.promociones WHERE estado_aprobacion = 'en_revision' AND deleted_at IS NULL) AS promociones_pendientes,
           (SELECT COUNT(*)::INT FROM public.usuarios WHERE deleted_at IS NULL) AS usuarios,
           (SELECT COUNT(*)::INT FROM public.favoritos) AS favoritos,
           (SELECT COUNT(*)::INT FROM public.lugares_turisticos WHERE deleted_at IS NULL AND (latitud IS NULL OR longitud IS NULL)) AS lugares_sin_coordenadas`,
      ),
      pool.query(
        `SELECT mu.nombre AS municipio,
                (SELECT COUNT(*)::INT FROM public.lugares_turisticos l
                  WHERE l.municipio_id = mu.id AND l.estado_aprobacion = 'aprobado' AND l.deleted_at IS NULL) AS lugares,
                (SELECT COUNT(*)::INT FROM public.servicios s
                  WHERE s.municipio_id = mu.id AND s.estado_aprobacion = 'aprobado' AND s.deleted_at IS NULL) AS servicios
         FROM public.municipios AS mu
         ORDER BY mu.nombre`,
      ),
      pool.query(
        `SELECT ca.nombre AS categoria, COUNT(l.id)::INT AS lugares
         FROM public.categorias AS ca
         LEFT JOIN public.lugares_turisticos AS l
           ON l.categoria_id = ca.id AND l.estado_aprobacion = 'aprobado' AND l.deleted_at IS NULL
         GROUP BY ca.nombre
         ORDER BY lugares DESC, ca.nombre`,
      ),
      pool.query(
        `SELECT l.nombre, l.slug, COUNT(f.usuario_id)::INT AS favoritos
         FROM public.favoritos AS f
         JOIN public.lugares_turisticos AS l ON l.id = f.lugar_id
         GROUP BY l.id, l.nombre, l.slug
         ORDER BY favoritos DESC, l.nombre
         LIMIT 5`,
      ),
      pool.query(
        `SELECT r.nombre AS rol, COUNT(u.id)::INT AS usuarios
         FROM public.roles AS r
         LEFT JOIN public.usuarios AS u ON u.rol_id = r.id AND u.deleted_at IS NULL
         GROUP BY r.nombre
         ORDER BY r.nombre`,
      ),
    ]);

    res.json({
      data: {
        totales: totals.rows[0],
        porMunicipio: byMunicipality.rows,
        porCategoria: byCategory.rows,
        topFavoritos: topFavorites.rows,
        usuariosPorRol: usersByRole.rows,
        generadoEn: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generando estadísticas:', error);
    res.status(500).json({ error: 'No fue posible generar las estadísticas.' });
  }
};

export const listPromotionsForReview = async (req: Request, res: Response): Promise<void> => {
  const state = typeof req.query.estado === 'string' && req.query.estado ? req.query.estado : 'en_revision';
  try {
    const result = await pool.query(
      `SELECT pr.id, pr.titulo, pr.descripcion, pr.condiciones, pr.fecha_inicio, pr.fecha_fin,
              pr.estado_aprobacion, pr.motivo_revision,
              s.nombre AS servicio_nombre, p.nombre_comercial AS prestador
       FROM public.promociones AS pr
       LEFT JOIN public.servicios AS s ON s.id = pr.servicio_id
       LEFT JOIN public.prestadores AS p ON p.id = pr.prestador_id
       WHERE pr.deleted_at IS NULL AND pr.estado_aprobacion = $1
       ORDER BY pr.created_at DESC
       LIMIT 100`,
      [state],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listando promociones para revisión:', error);
    res.status(500).json({ error: 'No fue posible consultar las promociones.' });
  }
};

export const reviewPromotion = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  const state = req.body?.estado;
  const reason = typeof req.body?.motivo === 'string' ? req.body.motivo.trim().slice(0, 1000) : '';
  if (!Number.isFinite(id) || !['aprobado', 'rechazado'].includes(state)) {
    res.status(400).json({ error: 'Solicitud de revisión inválida.' });
    return;
  }
  if (state === 'rechazado' && !reason) {
    res.status(400).json({ error: 'Escribe el motivo del rechazo para que el prestador sepa qué corregir.' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE public.promociones
       SET estado_aprobacion = $1, motivo_revision = $2, revisado_por = $3,
           revisado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id, estado_aprobacion`,
      [state, reason || null, req.user?.id ?? null, id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Promoción no encontrada.' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error revisando promoción:', error);
    res.status(500).json({ error: 'No fue posible actualizar la promoción.' });
  }
};

export const listProviders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.nombre_comercial, p.estado_aprobacion, u.email AS usuario_email
       FROM public.prestadores AS p
       LEFT JOIN public.usuarios AS u ON u.id = p.usuario_id
       WHERE p.deleted_at IS NULL
       ORDER BY p.nombre_comercial`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listando prestadores:', error);
    res.status(500).json({ error: 'No fue posible consultar los prestadores.' });
  }
};

export const linkProviderAccount = async (req: Request, res: Response): Promise<void> => {
  const providerId = Number.parseInt(String(req.params.id), 10);
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!Number.isFinite(providerId) || !email.includes('@')) {
    res.status(400).json({ error: 'Indica un prestador y un correo válido.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query(
      `SELECT u.id, r.nombre AS rol
       FROM public.usuarios AS u JOIN public.roles AS r ON r.id = u.rol_id
       WHERE LOWER(u.email) = $1 AND u.deleted_at IS NULL`,
      [email],
    );
    if (!user.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'No existe una cuenta con ese correo. Pide al prestador que se registre primero.' });
      return;
    }
    if (user.rows[0].rol === 'administrador') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Una cuenta de administrador no puede convertirse en prestador.' });
      return;
    }

    const provider = await client.query(
      `UPDATE public.prestadores SET usuario_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, nombre_comercial`,
      [user.rows[0].id, providerId],
    );
    if (!provider.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Prestador no encontrado.' });
      return;
    }

    await client.query(
      `UPDATE public.usuarios
       SET rol_id = (SELECT id FROM public.roles WHERE nombre = 'prestador'), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.rows[0].id],
    );
    await client.query('COMMIT');
    res.json({ data: { prestador: provider.rows[0], email } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error vinculando prestador:', error);
    res.status(500).json({ error: 'No fue posible vincular la cuenta.' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// Validación del prototipo (encuesta) — metas del Anexo 1
// ---------------------------------------------------------------------------
export const getSurveyResults = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [summary, profiles, modules, comments] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::INT AS respuestas,
           ROUND(AVG(satisfaccion)::numeric, 2)::float8 AS satisfaccion_promedio,
           ROUND(AVG(facilidad)::numeric, 2)::float8 AS facilidad_promedio,
           ROUND(AVG(utilidad)::numeric, 2)::float8 AS utilidad_promedio,
           ROUND(100.0 * AVG(CASE WHEN recomendaria THEN 1 ELSE 0 END), 1)::float8 AS aceptacion_pct,
           ROUND(100.0 * AVG(CASE WHEN satisfaccion >= 4 THEN 1 ELSE 0 END), 1)::float8 AS satisfaccion_pct,
           ROUND(AVG(minutos_otros_medios)::numeric, 1)::float8 AS minutos_otros,
           ROUND(AVG(minutos_xplorasg)::numeric, 1)::float8 AS minutos_xplora
         FROM public.encuestas`,
      ),
      pool.query('SELECT perfil, COUNT(*)::INT AS total FROM public.encuestas GROUP BY perfil ORDER BY total DESC'),
      pool.query(`SELECT modulo_favorito AS modulo, COUNT(*)::INT AS total FROM public.encuestas
                  WHERE modulo_favorito IS NOT NULL GROUP BY modulo_favorito ORDER BY total DESC`),
      pool.query(`SELECT comentario, satisfaccion, created_at FROM public.encuestas
                  WHERE comentario IS NOT NULL ORDER BY created_at DESC LIMIT 8`),
    ]);
    const row = summary.rows[0];
    const reduction = row.minutos_otros && row.minutos_xplora !== null && row.minutos_otros > 0
      ? Math.round((1 - row.minutos_xplora / row.minutos_otros) * 1000) / 10
      : null;
    res.json({
      data: {
        ...row,
        reduccion_tiempo_pct: reduction,
        metas: { respuestas: 50, aceptacion_pct: 85, satisfaccion_pct: 80, reduccion_tiempo_pct: 40 },
        perfiles: profiles.rows,
        modulos: modules.rows,
        comentarios: comments.rows,
      },
    });
  } catch (error) {
    console.error('Error consultando encuestas:', error);
    res.status(500).json({ error: 'No fue posible consultar los resultados de la encuesta.' });
  }
};

// ---------------------------------------------------------------------------
// Analítica de uso (últimos 30 días)
// ---------------------------------------------------------------------------
export const getUsageAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totals, places, services, searches] = await Promise.all([
      pool.query(`SELECT tipo, COUNT(*)::INT AS total FROM public.eventos_uso
                  WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY tipo`),
      pool.query(`SELECT l.nombre, l.slug, COUNT(*)::INT AS total
                  FROM public.eventos_uso e JOIN public.lugares_turisticos l ON l.id = e.referencia_id
                  WHERE e.tipo = 'vista_lugar' AND e.created_at >= NOW() - INTERVAL '30 days'
                  GROUP BY l.id, l.nombre, l.slug ORDER BY total DESC LIMIT 5`),
      pool.query(`SELECT s.nombre, s.slug, COUNT(*)::INT AS total
                  FROM public.eventos_uso e JOIN public.servicios s ON s.id = e.referencia_id
                  WHERE e.tipo = 'clic_whatsapp' AND e.created_at >= NOW() - INTERVAL '30 days'
                  GROUP BY s.id, s.nombre, s.slug ORDER BY total DESC LIMIT 5`),
      pool.query(`SELECT termino, COUNT(*)::INT AS total FROM public.eventos_uso
                  WHERE tipo = 'busqueda' AND termino IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'
                  GROUP BY termino ORDER BY total DESC LIMIT 8`),
    ]);
    res.json({
      data: {
        totales: Object.fromEntries(totals.rows.map((row) => [row.tipo, row.total])),
        lugaresMasVistos: places.rows,
        serviciosMasContactados: services.rows,
        busquedasFrecuentes: searches.rows,
      },
    });
  } catch (error) {
    console.error('Error consultando analítica:', error);
    res.status(500).json({ error: 'No fue posible consultar la analítica.' });
  }
};

// ---------------------------------------------------------------------------
// Agenda: alta, edición y baja de eventos culturales
// ---------------------------------------------------------------------------
const EVENT_STATES = ['borrador', 'en_revision', 'aprobado', 'rechazado', 'suspendido'];

const parseEventBody = (body: Record<string, unknown>) => {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim().slice(0, 255) : '';
  const start = typeof body.fecha_inicio === 'string' ? new Date(body.fecha_inicio) : null;
  const end = typeof body.fecha_fin === 'string' ? new Date(body.fecha_fin) : null;
  const lugar = body.lugar_id === null || body.lugar_id === '' || body.lugar_id === undefined ? null : Number(body.lugar_id);
  const estado = typeof body.estado_aprobacion === 'string' && EVENT_STATES.includes(body.estado_aprobacion) ? body.estado_aprobacion : 'aprobado';
  const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
  if (nombre.length < 3 || !start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime()) || end < start) return null;
  if (lugar !== null && (!Number.isInteger(lugar) || lugar <= 0)) return null;
  return {
    nombre, fecha_inicio: start, fecha_fin: end, lugar_id: lugar, estado_aprobacion: estado,
    descripcion: text(body.descripcion, 3000), horario: text(body.horario, 500), contacto: text(body.contacto, 500),
  };
};

export const listEventsAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.nombre, e.descripcion, e.fecha_inicio, e.fecha_fin, e.horario, e.contacto,
              e.estado_aprobacion, e.lugar_id, l.nombre AS lugar_nombre
       FROM public.eventos e LEFT JOIN public.lugares_turisticos l ON l.id = e.lugar_id
       WHERE e.deleted_at IS NULL ORDER BY e.fecha_inicio DESC LIMIT 200`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listando eventos (admin):', error);
    res.status(500).json({ error: 'No fue posible consultar los eventos.' });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const event = parseEventBody(req.body ?? {});
  if (!event) {
    res.status(400).json({ error: 'Revisa el nombre (mín. 3 letras) y que la fecha de fin no sea anterior a la de inicio.' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO public.eventos (nombre, descripcion, lugar_id, fecha_inicio, fecha_fin, horario, contacto, estado_aprobacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [event.nombre, event.descripcion, event.lugar_id, event.fecha_inicio, event.fecha_fin, event.horario, event.contacto, event.estado_aprobacion],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'No fue posible crear el evento.' });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  const event = parseEventBody(req.body ?? {});
  if (!Number.isFinite(id) || !event) {
    res.status(400).json({ error: 'Revisa el nombre (mín. 3 letras) y que la fecha de fin no sea anterior a la de inicio.' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE public.eventos SET nombre = $1, descripcion = $2, lugar_id = $3, fecha_inicio = $4, fecha_fin = $5,
              horario = $6, contacto = $7, estado_aprobacion = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND deleted_at IS NULL RETURNING id`,
      [event.nombre, event.descripcion, event.lugar_id, event.fecha_inicio, event.fecha_fin, event.horario, event.contacto, event.estado_aprobacion, id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Evento no encontrado.' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ error: 'No fue posible actualizar el evento.' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Evento inválido.' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE public.eventos SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Evento no encontrado.' });
      return;
    }
    res.json({ data: { id } });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'No fue posible eliminar el evento.' });
  }
};
