import { Request, Response } from 'express';
import pool from '../config/db';
import {
  approvalRequirements,
  parseReviewContentKind,
  parseReviewState,
  ReviewContentKind,
  ReviewReadiness,
} from '../services/contentReviewService';
import { parseLimit, parsePage } from '../services/catalogService';

interface ReviewRow extends ReviewReadiness {
  id: number;
  nombre: string;
  slug: string | null;
  municipio: string | null;
  categoria: string | null;
  estado_aprobacion: string;
  motivo_revision: string | null;
  updated_at: string;
}

const asSearch = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const search = value.trim();
  return search ? search.slice(0, 120) : null;
};

const placeReviewQuery = `
  SELECT
    l.id, l.nombre, l.slug, mu.nombre AS municipio, ca.nombre AS categoria,
    l.estado_aprobacion, l.motivo_revision, l.updated_at,
    (NULLIF(BTRIM(l.descripcion), '') IS NOT NULL) AS has_description,
    (l.latitud IS NOT NULL AND l.longitud IS NOT NULL
      AND l.estado_coordenadas = 'verificada') AS has_location,
    (NULLIF(BTRIM(l.fuente_verificacion), '') IS NOT NULL) AS has_source,
    TRUE AS has_contact,
    TRUE AS has_provider,
    EXISTS (
      SELECT 1
      FROM public.lugar_multimedia AS lm
      JOIN public.multimedia AS mm ON mm.id = lm.multimedia_id
      WHERE lm.lugar_id = l.id
        AND mm.deleted_at IS NULL
        AND (mm.bucket_id = 'xplorasg-public' OR mm.url IS NOT NULL)
    ) AS has_public_media
  FROM public.lugares_turisticos AS l
  JOIN public.municipios AS mu ON mu.id = l.municipio_id
  JOIN public.categorias AS ca ON ca.id = l.categoria_id
  WHERE l.deleted_at IS NULL
    AND ($1::TEXT IS NULL OR l.estado_aprobacion = $1)
    AND ($2::TEXT IS NULL OR l.nombre ILIKE '%' || $2 || '%')
  ORDER BY l.updated_at DESC, l.nombre
  LIMIT $3 OFFSET $4`;

const serviceReviewQuery = `
  SELECT
    s.id, s.nombre, s.slug, mu.nombre AS municipio, ca.nombre AS categoria,
    s.estado_aprobacion, s.motivo_revision, s.updated_at,
    (NULLIF(BTRIM(s.descripcion), '') IS NOT NULL) AS has_description,
    (s.municipio_id IS NOT NULL) AS has_location,
    (NULLIF(BTRIM(s.fuente_verificacion), '') IS NOT NULL) AS has_source,
    (NULLIF(BTRIM(s.contacto), '') IS NOT NULL) AS has_contact,
    (NULLIF(BTRIM(p.nombre_comercial), '') IS NOT NULL
      AND NULLIF(BTRIM(p.fuente_verificacion), '') IS NOT NULL) AS has_provider,
    EXISTS (
      SELECT 1
      FROM public.servicio_multimedia AS sm
      JOIN public.multimedia AS mm ON mm.id = sm.multimedia_id
      WHERE sm.servicio_id = s.id
        AND mm.deleted_at IS NULL
        AND (mm.bucket_id = 'xplorasg-public' OR mm.url IS NOT NULL)
    ) AS has_public_media
  FROM public.servicios AS s
  JOIN public.prestadores AS p ON p.id = s.prestador_id
  LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
  LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
  WHERE s.deleted_at IS NULL
    AND ($1::TEXT IS NULL OR s.estado_aprobacion = $1)
    AND ($2::TEXT IS NULL OR s.nombre ILIKE '%' || $2 || '%')
  ORDER BY s.updated_at DESC, s.nombre
  LIMIT $3 OFFSET $4`;

const serializeReviewRow = (kind: ReviewContentKind, row: ReviewRow) => ({
  id: row.id,
  tipo: kind,
  nombre: row.nombre,
  slug: row.slug,
  municipio: row.municipio,
  categoria: row.categoria,
  estado: row.estado_aprobacion,
  motivoRevision: row.motivo_revision,
  updatedAt: row.updated_at,
  faltantes: approvalRequirements(kind, row),
});

export const listReviewContent = async (req: Request, res: Response): Promise<void> => {
  const kind = parseReviewContentKind(req.query.tipo) || 'lugar';
  const requestedState = req.query.estado;
  const state = requestedState === undefined || requestedState === '' ? null : parseReviewState(requestedState);
  if (requestedState !== undefined && requestedState !== '' && state === null) {
    res.status(400).json({ error: 'Estado editorial inválido.' });
    return;
  }

  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const offset = (page - 1) * limit;
  const search = asSearch(req.query.q);
  const table = kind === 'lugar' ? 'lugares_turisticos' : 'servicios';

  try {
    const [items, count] = await Promise.all([
      pool.query<ReviewRow>(kind === 'lugar' ? placeReviewQuery : serviceReviewQuery, [state, search, limit, offset]),
      pool.query<{ total: number }>(
        `SELECT COUNT(*)::INT AS total
         FROM public.${table}
         WHERE deleted_at IS NULL
           AND ($1::TEXT IS NULL OR estado_aprobacion = $1)
           AND ($2::TEXT IS NULL OR nombre ILIKE '%' || $2 || '%')`,
        [state, search],
      ),
    ]);

    res.status(200).json({
      data: items.rows.map((row) => serializeReviewRow(kind, row)),
      pagination: { page, limit, total: count.rows[0]?.total ?? 0 },
    });
  } catch (error) {
    console.error('Error listando contenido para revisión:', error);
    res.status(500).json({ error: 'No fue posible consultar la bandeja editorial.' });
  }
};

export const updateReviewState = async (req: Request, res: Response): Promise<void> => {
  const kind = parseReviewContentKind(req.params.tipo);
  const id = Number.parseInt(String(req.params.id), 10);
  const state = parseReviewState(req.body?.estado);
  const reason = typeof req.body?.motivo === 'string' ? req.body.motivo.trim().slice(0, 1000) : '';

  if (!kind || !Number.isFinite(id) || id <= 0 || !state) {
    res.status(400).json({ error: 'Solicitud de revisión inválida.' });
    return;
  }
  if ((state === 'rechazado' || state === 'suspendido') && !reason) {
    res.status(400).json({ error: 'El motivo es obligatorio para rechazar o suspender contenido.' });
    return;
  }

  const table = kind === 'lugar' ? 'lugares_turisticos' : 'servicios';
  const query = kind === 'lugar' ? placeReviewQuery : serviceReviewQuery;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const item = await client.query<ReviewRow>(
      `SELECT * FROM (${query.replace('LIMIT $3 OFFSET $4', '')}) AS content WHERE id = $3 LIMIT 1`,
      [null, null, id],
    );
    if (!item.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Contenido no encontrado.' });
      return;
    }

    const missing = approvalRequirements(kind, item.rows[0]);
    if (state === 'aprobado' && missing.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        error: 'El contenido todavía no cumple los requisitos de publicación.',
        faltantes: missing,
      });
      return;
    }

    const updated = await client.query(
      `UPDATE public.${table}
       SET estado_aprobacion = $1,
           motivo_revision = $2,
           revisado_por = $3,
           revisado_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id, estado_aprobacion, motivo_revision, revisado_at`,
      [state, reason || null, req.user?.id, id],
    );

    if (kind === 'servicio' && state === 'aprobado') {
      await client.query(
        `UPDATE public.prestadores AS p
         SET estado_aprobacion = 'aprobado', updated_at = CURRENT_TIMESTAMP
         FROM public.servicios AS s
         WHERE s.id = $1 AND p.id = s.prestador_id`,
        [id],
      );
    }
    await client.query('COMMIT');
    res.status(200).json({ data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error actualizando estado editorial:', error);
    res.status(500).json({ error: 'No fue posible actualizar el estado editorial.' });
  } finally {
    client.release();
  }
};

