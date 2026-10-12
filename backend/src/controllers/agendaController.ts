import { Request, Response } from 'express';
import pool from '../config/db';
import { getLang, localizeRow } from '../services/i18n';
import { resolvePublicMediaUrl } from '../services/catalogService';

// Tablas reales (ver database/migrations/001_initial_schema.sql):
//   eventos(nombre, descripcion, fecha_inicio, fecha_fin, horario, contacto, lugar_id -> lugares_turisticos)
//   promociones(titulo, descripcion, condiciones, fecha_inicio, fecha_fin, servicio_id -> servicios)
// Los alias mantienen el contrato que espera el frontend (titulo, lugar_nombre, etc.).

const parsePagination = (req: Request) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 12, 1), 100);
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  return { limit, page, offset: (page - 1) * limit };
};

export const listEventos = async (req: Request, res: Response) => {
  const { limit, page, offset } = parsePagination(req);
  const lang = getLang(req);

  try {
    // Solo eventos aprobados que no han terminado, del más próximo al más lejano.
    const where = `e.estado_aprobacion = 'aprobado'
         AND e.deleted_at IS NULL
         AND e.fecha_fin >= NOW()`;

    const [result, countResult] = await Promise.all([
      pool.query(
        `SELECT e.id,
                e.nombre AS titulo,
                e.descripcion,
                e.fecha_inicio,
                e.fecha_fin,
                e.horario,
                e.contacto,
                (to_jsonb(e)->'traducciones') AS traducciones,
                l.nombre AS lugar_nombre,
                l.slug AS lugar_slug,
                mu.nombre AS municipio,
                media.id AS media_id, media.url AS media_url, media.bucket_id AS media_bucket_id, media.object_path AS media_object_path
         FROM public.eventos AS e
         LEFT JOIN public.lugares_turisticos AS l
           ON l.id = e.lugar_id AND l.deleted_at IS NULL AND l.estado_aprobacion = 'aprobado'
         LEFT JOIN public.municipios AS mu ON mu.id = l.municipio_id
         -- Foto principal del lugar del evento (para que la tarjeta de la agenda tenga imagen).
         LEFT JOIN LATERAL (
           SELECT m.id, m.url, m.bucket_id, m.object_path
           FROM public.lugar_multimedia AS lm
           JOIN public.multimedia AS m ON m.id = lm.multimedia_id
           WHERE lm.lugar_id = l.id AND m.deleted_at IS NULL AND m.tipo = 'image'
             AND (m.bucket_id = 'xplorasg-public' OR m.url IS NOT NULL)
           ORDER BY lm.es_principal DESC, lm.orden ASC, m.id ASC
           LIMIT 1
         ) AS media ON TRUE
         WHERE ${where}
         ORDER BY e.fecha_inicio ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query<{ total: number }>(
        `SELECT COUNT(*)::INT AS total FROM public.eventos AS e WHERE ${where}`,
      ),
    ]);

    res.json({
      // En la tabla el campo se llama "nombre"; la API lo expone como "titulo".
      data: result.rows.map(({ traducciones, media_id, media_url, media_bucket_id, media_object_path, ...row }) => {
        const tr = traducciones?.[lang] as Record<string, unknown> | undefined;
        const lugar_imagen = media_id
          ? resolvePublicMediaUrl({ id: media_id, tipo: 'image', url: media_url, bucket_id: media_bucket_id, object_path: media_object_path, alt_text: null, titulo: null })
          : null;
        return localizeRow(
          { ...row, lugar_imagen, traducciones: tr ? { [lang]: { ...tr, titulo: tr.nombre } } : null },
          lang,
        );
      }),
      pagination: { page, limit, total: countResult.rows[0]?.total ?? 0 },
    });
  } catch (err) {
    console.error('Error listando eventos', err);
    res.status(500).json({ error: 'No fue posible consultar los eventos.' });
  }
};

export const listPromociones = async (req: Request, res: Response) => {
  const { limit, page, offset } = parsePagination(req);
  const lang = getLang(req);

  try {
    const where = `p.estado_aprobacion = 'aprobado'
         AND p.deleted_at IS NULL
         AND p.fecha_fin >= NOW()`;

    const [result, countResult] = await Promise.all([
      pool.query(
        `SELECT p.id,
                p.titulo,
                p.descripcion,
                p.condiciones,
                p.fecha_inicio,
                p.fecha_fin,
                (to_jsonb(p)->'traducciones') AS traducciones,
                s.nombre AS servicio_nombre,
                s.slug AS servicio_slug
         FROM public.promociones AS p
         LEFT JOIN public.servicios AS s
           ON s.id = p.servicio_id AND s.deleted_at IS NULL AND s.estado_aprobacion = 'aprobado'
         WHERE ${where}
         ORDER BY p.fecha_fin ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query<{ total: number }>(
        `SELECT COUNT(*)::INT AS total FROM public.promociones AS p WHERE ${where}`,
      ),
    ]);

    res.json({
      data: result.rows.map((row) => localizeRow(row, lang)),
      pagination: { page, limit, total: countResult.rows[0]?.total ?? 0 },
    });
  } catch (err) {
    console.error('Error listando promociones', err);
    res.status(500).json({ error: 'No fue posible consultar las promociones.' });
  }
};
