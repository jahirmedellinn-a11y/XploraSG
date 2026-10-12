import { Request, Response } from 'express';
import pool from '../config/db';

// Panel "Mi negocio": un prestador ve y edita SOLO sus propios servicios y promociones.
// La pertenencia siempre se valida en SQL con prestadores.usuario_id = usuario autenticado.

const cleanText = (value: unknown, max = 2000): string | null | undefined => {
  if (value === undefined) return undefined; // no se envió: no se modifica
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, max);
  return text || null;
};

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00-06:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getMyBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const providers = await pool.query(
      `SELECT p.id, p.nombre_comercial, p.descripcion, p.telefono, p.correo, p.estado_aprobacion
       FROM public.prestadores AS p
       WHERE p.usuario_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.nombre_comercial`,
      [req.user!.id],
    );
    const ids = providers.rows.map((row) => row.id);

    const [services, promotions] = ids.length
      ? await Promise.all([
          pool.query(
            `SELECT s.id, s.prestador_id, s.nombre, s.slug, s.descripcion, s.horario, s.rango_precio,
                    s.contacto, s.reservacion, s.estado_aprobacion, s.updated_at,
                    COALESCE(mu.nombre, '') AS municipio
             FROM public.servicios AS s
             LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
             WHERE s.prestador_id = ANY($1::int[]) AND s.deleted_at IS NULL
             ORDER BY s.nombre`,
            [ids],
          ),
          pool.query(
            `SELECT pr.id, pr.prestador_id, pr.servicio_id, pr.titulo, pr.descripcion, pr.condiciones,
                    pr.fecha_inicio, pr.fecha_fin, pr.estado_aprobacion, pr.motivo_revision,
                    s.nombre AS servicio_nombre
             FROM public.promociones AS pr
             LEFT JOIN public.servicios AS s ON s.id = pr.servicio_id
             WHERE pr.prestador_id = ANY($1::int[]) AND pr.deleted_at IS NULL
             ORDER BY pr.fecha_fin DESC`,
            [ids],
          ),
        ])
      : [{ rows: [] }, { rows: [] }];

    res.json({ data: { prestadores: providers.rows, servicios: services.rows, promociones: promotions.rows } });
  } catch (error) {
    console.error('Error consultando el negocio del prestador:', error);
    res.status(500).json({ error: 'No fue posible cargar la información de tu negocio.' });
  }
};

export const updateMyService = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Servicio inválido.' });
    return;
  }

  const fields = {
    descripcion: cleanText(req.body?.descripcion, 4000),
    horario: cleanText(req.body?.horario, 500),
    rango_precio: cleanText(req.body?.rango_precio, 500),
    contacto: cleanText(req.body?.contacto, 500),
    reservacion: cleanText(req.body?.reservacion, 1000),
  };
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    res.status(400).json({ error: 'No hay cambios para guardar.' });
    return;
  }

  const sets = entries.map(([column], index) => `${column} = $${index + 1}`);
  const values = entries.map(([, value]) => value);

  try {
    const result = await pool.query(
      `UPDATE public.servicios AS s
       SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
       FROM public.prestadores AS p
       WHERE s.id = $${values.length + 1}
         AND p.id = s.prestador_id
         AND p.usuario_id = $${values.length + 2}
         AND s.deleted_at IS NULL
       RETURNING s.id, s.descripcion, s.horario, s.rango_precio, s.contacto, s.reservacion, s.updated_at`,
      [...values, id, req.user!.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No encontramos ese servicio en tu negocio.' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando servicio del prestador:', error);
    res.status(500).json({ error: 'No fue posible guardar los cambios.' });
  }
};

export const createMyPromotion = async (req: Request, res: Response): Promise<void> => {
  const serviceId = Number.parseInt(String(req.body?.servicio_id), 10);
  const title = cleanText(req.body?.titulo, 255);
  const description = cleanText(req.body?.descripcion, 2000) ?? null;
  const conditions = cleanText(req.body?.condiciones, 2000) ?? null;
  const start = parseDate(req.body?.fecha_inicio);
  const end = parseDate(req.body?.fecha_fin);

  if (!Number.isFinite(serviceId) || !title || title.length < 3 || !start || !end) {
    res.status(400).json({ error: 'Completa el servicio, el título y las fechas de la promoción.' });
    return;
  }
  const endOfDay = new Date(end.getTime() + (24 * 60 * 60 * 1000) - 60_000);
  if (endOfDay < start) {
    res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la de inicio.' });
    return;
  }
  if (endOfDay < new Date()) {
    res.status(400).json({ error: 'La promoción ya terminó; elige una fecha de fin futura.' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.promociones
         (prestador_id, servicio_id, titulo, descripcion, condiciones, fecha_inicio, fecha_fin, estado_aprobacion)
       SELECT p.id, s.id, $1, $2, $3, $4, $5, 'en_revision'
       FROM public.servicios AS s
       JOIN public.prestadores AS p ON p.id = s.prestador_id
       WHERE s.id = $6 AND p.usuario_id = $7 AND s.deleted_at IS NULL
       RETURNING id, titulo, estado_aprobacion`,
      [title, description, conditions, start, endOfDay, serviceId, req.user!.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No encontramos ese servicio en tu negocio.' });
      return;
    }
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creando promoción:', error);
    res.status(500).json({ error: 'No fue posible registrar la promoción.' });
  }
};

export const deleteMyPromotion = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Promoción inválida.' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE public.promociones AS pr
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       FROM public.prestadores AS p
       WHERE pr.id = $1 AND p.id = pr.prestador_id AND p.usuario_id = $2 AND pr.deleted_at IS NULL
       RETURNING pr.id`,
      [id, req.user!.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No encontramos esa promoción en tu negocio.' });
      return;
    }
    res.json({ data: { id } });
  } catch (error) {
    console.error('Error eliminando promoción:', error);
    res.status(500).json({ error: 'No fue posible eliminar la promoción.' });
  }
};
