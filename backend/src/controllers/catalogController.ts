import { Request, Response } from 'express';
import pool from '../config/db';
import {
  MediaRecord,
  parseLimit,
  parsePage,
  serializeMedia,
} from '../services/catalogService';

interface PlaceRow {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  latitud: string | null;
  longitud: string | null;
  altitud: number | null;
  direccion: string | null;
  info_acceso: string | null;
  horarios: string | null;
  costo: string | null;
  actividades: string | null;
  servicios_disponibles: string | null;
  accesibilidad: string | null;
  recomendaciones: string | null;
  contacto: string | null;
  fuente_verificacion: string | null;
  municipio: string;
  categoria: string;
  media_id: number | null;
  media_tipo: string | null;
  media_url: string | null;
  media_bucket_id: string | null;
  media_object_path: string | null;
  media_alt_text: string | null;
  media_titulo: string | null;
}

interface ServiceRow {
  id: number;
  slug: string | null;
  nombre: string;
  descripcion: string | null;
  rango_precio: string | null;
  contacto: string | null;
  horario: string | null;
  latitud: string | null;
  longitud: string | null;
  tipo_servicio: string | null;
  ubicacion: string | null;
  reservacion: string | null;
  capacidad_requisitos: string | null;
  accesibilidad: string | null;
  lugares_relacionados: string | null;
  fuente_verificacion: string | null;
  prestador: string;
  categoria: string | null;
  lugar: string | null;
  municipio: string | null;
  media_id: number | null;
  media_tipo: string | null;
  media_url: string | null;
  media_bucket_id: string | null;
  media_object_path: string | null;
  media_alt_text: string | null;
  media_titulo: string | null;
}

interface PlaceDetailRow {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  latitud: string | null;
  longitud: string | null;
  altitud: number | null;
  direccion: string | null;
  info_acceso: string | null;
  horarios: string | null;
  costo: string | null;
  actividades: string | null;
  servicios_disponibles: string | null;
  accesibilidad: string | null;
  recomendaciones: string | null;
  contacto: string | null;
  fuente_verificacion: string | null;
  municipio: string;
  categoria: string;
}

const mediaFromRow = (row: PlaceRow | ServiceRow): MediaRecord | null => {
  if (row.media_id === null || row.media_tipo === null) {
    return null;
  }

  return {
    id: row.media_id,
    tipo: row.media_tipo,
    url: row.media_url,
    bucket_id: row.media_bucket_id,
    object_path: row.media_object_path,
    alt_text: row.media_alt_text,
    titulo: row.media_titulo,
  };
};

const asOptionalQuery = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
};

export const listMunicipalities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, latitud, longitud
       FROM public.municipios
       WHERE deleted_at IS NULL
       ORDER BY nombre`,
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error listando municipios:', error);
    res.status(500).json({ error: 'No fue posible consultar los municipios.' });
  }
};

export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, descripcion
       FROM public.categorias
       ORDER BY nombre`,
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error listando categorías:', error);
    res.status(500).json({ error: 'No fue posible consultar las categorías.' });
  }
};

export const listPlaces = async (req: Request, res: Response): Promise<void> => {
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const offset = (page - 1) * limit;
  const municipio = asOptionalQuery(req.query.municipio);
  const categoria = asOptionalQuery(req.query.categoria);
  const search = asOptionalQuery(req.query.q);

  try {
    const filters = [municipio, categoria, search, limit, offset];
    const [items, count] = await Promise.all([
      pool.query<PlaceRow>(
        `SELECT
           l.id, l.nombre, l.slug, l.descripcion, l.latitud, l.longitud,
           l.altitud, l.direccion, l.info_acceso, l.horarios, l.costo,
           l.actividades, l.servicios_disponibles, l.accesibilidad,
           l.recomendaciones, l.contacto, l.fuente_verificacion,
           mu.nombre AS municipio,
           ca.nombre AS categoria,
           media.id AS media_id,
           media.tipo AS media_tipo,
           media.url AS media_url,
           media.bucket_id AS media_bucket_id,
           media.object_path AS media_object_path,
           media.alt_text AS media_alt_text,
           media.titulo AS media_titulo
         FROM public.lugares_turisticos AS l
         JOIN public.municipios AS mu ON mu.id = l.municipio_id
         JOIN public.categorias AS ca ON ca.id = l.categoria_id
         LEFT JOIN LATERAL (
           SELECT m.id, m.tipo, m.url, m.bucket_id, m.object_path, m.alt_text, m.titulo
           FROM public.lugar_multimedia AS lm
           JOIN public.multimedia AS m ON m.id = lm.multimedia_id
           WHERE lm.lugar_id = l.id
             AND m.deleted_at IS NULL
             AND (m.bucket_id = 'xplorasg-public' OR m.url IS NOT NULL)
           ORDER BY lm.es_principal DESC, lm.orden ASC, m.id ASC
           LIMIT 1
         ) AS media ON TRUE
         WHERE l.estado_aprobacion = 'aprobado'
           AND l.deleted_at IS NULL
           AND ($1::TEXT IS NULL OR mu.nombre = $1)
           AND ($2::TEXT IS NULL OR ca.nombre = $2)
           AND ($3::TEXT IS NULL OR l.nombre ILIKE '%' || $3 || '%' OR l.descripcion ILIKE '%' || $3 || '%')
         ORDER BY l.nombre
         LIMIT $4 OFFSET $5`,
        filters,
      ),
      pool.query<{ total: number }>(
        `SELECT COUNT(*)::INT AS total
         FROM public.lugares_turisticos AS l
         JOIN public.municipios AS mu ON mu.id = l.municipio_id
         JOIN public.categorias AS ca ON ca.id = l.categoria_id
         WHERE l.estado_aprobacion = 'aprobado'
           AND l.deleted_at IS NULL
           AND ($1::TEXT IS NULL OR mu.nombre = $1)
           AND ($2::TEXT IS NULL OR ca.nombre = $2)
           AND ($3::TEXT IS NULL OR l.nombre ILIKE '%' || $3 || '%' OR l.descripcion ILIKE '%' || $3 || '%')`,
        [municipio, categoria, search],
      ),
    ]);

    res.status(200).json({
      data: items.rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        slug: row.slug,
        descripcion: row.descripcion,
        latitud: row.latitud,
        longitud: row.longitud,
        altitud: row.altitud,
        direccion: row.direccion,
        infoAcceso: row.info_acceso,
        horarios: row.horarios,
        costo: row.costo,
        actividades: row.actividades,
        serviciosDisponibles: row.servicios_disponibles,
        accesibilidad: row.accesibilidad,
        recomendaciones: row.recomendaciones,
        contacto: row.contacto,
        fuenteVerificacion: row.fuente_verificacion,
        municipio: row.municipio,
        categoria: row.categoria,
        imagenPrincipal: serializeMedia(mediaFromRow(row)),
      })),
      pagination: { page, limit, total: count.rows[0]?.total ?? 0 },
    });
  } catch (error) {
    console.error('Error listando lugares:', error);
    res.status(500).json({ error: 'No fue posible consultar los lugares.' });
  }
};

export const getPlaceBySlug = async (req: Request, res: Response): Promise<void> => {
  const rawSlug = req.params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0]?.trim() : rawSlug?.trim();
  if (!slug || slug.length > 255) {
    res.status(400).json({ error: 'Slug de lugar inválido.' });
    return;
  }

  try {
    const place = await pool.query<PlaceDetailRow>(
      `SELECT
         l.id, l.nombre, l.slug, l.descripcion, l.latitud, l.longitud,
         l.altitud, l.direccion, l.info_acceso, l.horarios, l.costo,
         l.actividades, l.servicios_disponibles, l.accesibilidad,
         l.recomendaciones, l.contacto, l.fuente_verificacion,
         mu.nombre AS municipio,
         ca.nombre AS categoria
       FROM public.lugares_turisticos AS l
       JOIN public.municipios AS mu ON mu.id = l.municipio_id
       JOIN public.categorias AS ca ON ca.id = l.categoria_id
       WHERE l.slug = $1
         AND l.estado_aprobacion = 'aprobado'
         AND l.deleted_at IS NULL
       LIMIT 1`,
      [slug],
    );

    if (place.rows.length === 0) {
      res.status(404).json({ error: 'Lugar no encontrado.' });
      return;
    }

    const media = await pool.query<MediaRecord>(
      `SELECT m.id, m.tipo, m.url, m.bucket_id, m.object_path, m.alt_text, m.titulo
       FROM public.lugar_multimedia AS lm
       JOIN public.multimedia AS m ON m.id = lm.multimedia_id
       WHERE lm.lugar_id = $1
         AND m.deleted_at IS NULL
         AND (m.bucket_id = 'xplorasg-public' OR m.url IS NOT NULL)
       ORDER BY lm.es_principal DESC, lm.orden ASC, m.id ASC`,
      [place.rows[0].id],
    );

    const row = place.rows[0];
    res.status(200).json({
      data: {
        ...row,
        infoAcceso: row.info_acceso,
        serviciosDisponibles: row.servicios_disponibles,
        fuenteVerificacion: row.fuente_verificacion,
        info_acceso: undefined,
        servicios_disponibles: undefined,
        fuente_verificacion: undefined,
        multimedia: media.rows.map(serializeMedia),
      },
    });
  } catch (error) {
    console.error('Error consultando lugar:', error);
    res.status(500).json({ error: 'No fue posible consultar el lugar.' });
  }
};

export const listServices = async (req: Request, res: Response): Promise<void> => {
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const offset = (page - 1) * limit;
  const municipio = asOptionalQuery(req.query.municipio);
  const categoria = asOptionalQuery(req.query.categoria);
  const search = asOptionalQuery(req.query.q);

  try {
    const filters = [municipio, categoria, search, limit, offset];
    const [items, count] = await Promise.all([
      pool.query<ServiceRow>(
        `SELECT
           s.id, s.slug, s.nombre, s.descripcion, s.rango_precio, s.contacto,
           s.horario, s.latitud, s.longitud, s.tipo_servicio, s.ubicacion,
           s.reservacion, s.capacidad_requisitos, s.accesibilidad,
           s.lugares_relacionados, s.fuente_verificacion,
           p.nombre_comercial AS prestador,
           ca.nombre AS categoria,
           l.nombre AS lugar,
           mu.nombre AS municipio,
           media.id AS media_id,
           media.tipo AS media_tipo,
           media.url AS media_url,
           media.bucket_id AS media_bucket_id,
           media.object_path AS media_object_path,
           media.alt_text AS media_alt_text,
           media.titulo AS media_titulo
         FROM public.servicios AS s
         JOIN public.prestadores AS p ON p.id = s.prestador_id
         LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
         LEFT JOIN public.lugares_turisticos AS l ON l.id = s.lugar_id
         LEFT JOIN public.municipios AS mu ON mu.id = COALESCE(s.municipio_id, l.municipio_id)
         LEFT JOIN LATERAL (
           SELECT m.id, m.tipo, m.url, m.bucket_id, m.object_path, m.alt_text, m.titulo
           FROM public.servicio_multimedia AS sm
           JOIN public.multimedia AS m ON m.id = sm.multimedia_id
           WHERE sm.servicio_id = s.id
             AND m.deleted_at IS NULL
             AND (m.bucket_id = 'xplorasg-public' OR m.url IS NOT NULL)
           ORDER BY sm.es_principal DESC, sm.orden ASC, m.id ASC
           LIMIT 1
         ) AS media ON TRUE
         WHERE s.estado_aprobacion = 'aprobado'
           AND s.deleted_at IS NULL
           AND p.estado_aprobacion = 'aprobado'
           AND p.deleted_at IS NULL
           AND ($1::TEXT IS NULL OR mu.nombre = $1)
           AND ($2::TEXT IS NULL OR ca.nombre = $2)
           AND ($3::TEXT IS NULL OR s.nombre ILIKE '%' || $3 || '%' OR s.descripcion ILIKE '%' || $3 || '%')
         ORDER BY s.nombre
         LIMIT $4 OFFSET $5`,
        filters,
      ),
      pool.query<{ total: number }>(
        `SELECT COUNT(*)::INT AS total
         FROM public.servicios AS s
         JOIN public.prestadores AS p ON p.id = s.prestador_id
         LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
         LEFT JOIN public.lugares_turisticos AS l ON l.id = s.lugar_id
         LEFT JOIN public.municipios AS mu ON mu.id = COALESCE(s.municipio_id, l.municipio_id)
         WHERE s.estado_aprobacion = 'aprobado'
           AND s.deleted_at IS NULL
           AND p.estado_aprobacion = 'aprobado'
           AND p.deleted_at IS NULL
           AND ($1::TEXT IS NULL OR mu.nombre = $1)
           AND ($2::TEXT IS NULL OR ca.nombre = $2)
           AND ($3::TEXT IS NULL OR s.nombre ILIKE '%' || $3 || '%' OR s.descripcion ILIKE '%' || $3 || '%')`,
        [municipio, categoria, search],
      ),
    ]);

    res.status(200).json({
      data: items.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        nombre: row.nombre,
        descripcion: row.descripcion,
        rangoPrecio: row.rango_precio,
        contacto: row.contacto,
        horario: row.horario,
        latitud: row.latitud,
        longitud: row.longitud,
        tipoServicio: row.tipo_servicio,
        ubicacion: row.ubicacion,
        reservacion: row.reservacion,
        capacidadRequisitos: row.capacidad_requisitos,
        accesibilidad: row.accesibilidad,
        lugaresRelacionados: row.lugares_relacionados,
        fuenteVerificacion: row.fuente_verificacion,
        prestador: row.prestador,
        categoria: row.categoria,
        lugar: row.lugar,
        municipio: row.municipio,
        imagenPrincipal: serializeMedia(mediaFromRow(row)),
      })),
      pagination: { page, limit, total: count.rows[0]?.total ?? 0 },
    });
  } catch (error) {
    console.error('Error listando servicios:', error);
    res.status(500).json({ error: 'No fue posible consultar los servicios.' });
  }
};

export const getContentStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::INT FROM public.lugares_turisticos WHERE deleted_at IS NULL) AS lugares_total,
         (SELECT COUNT(*)::INT FROM public.lugares_turisticos WHERE estado_aprobacion = 'borrador' AND deleted_at IS NULL) AS lugares_borrador,
         (SELECT COUNT(*)::INT FROM public.lugares_turisticos WHERE estado_aprobacion = 'aprobado' AND deleted_at IS NULL) AS lugares_aprobados,
         (SELECT COUNT(*)::INT FROM public.lugares_turisticos WHERE (descripcion IS NULL OR latitud IS NULL OR longitud IS NULL) AND deleted_at IS NULL) AS lugares_incompletos,
         (SELECT COUNT(*)::INT FROM public.servicios WHERE deleted_at IS NULL) AS servicios_total,
         (SELECT COUNT(*)::INT FROM public.multimedia WHERE deleted_at IS NULL) AS multimedia_total`,
    );
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error consultando estado del contenido:', error);
    res.status(500).json({ error: 'No fue posible consultar el estado del contenido.' });
  }
};
