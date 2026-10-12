import { Request, Response } from 'express';
import pool from '../config/db';

const PROFILES = ['turista', 'prestador', 'estudiante', 'docente', 'otro'];
const MODULES = ['explorar', 'mapa', 'rutas', 'asistente', 'agenda', 'servicios', 'favoritos'];

const score = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
};
const minutes = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 600 ? Math.round(parsed) : null;
};

export const submitSurvey = async (req: Request, res: Response): Promise<void> => {
  const body = req.body ?? {};
  const satisfaccion = score(body.satisfaccion);
  const facilidad = score(body.facilidad);
  const utilidad = score(body.utilidad);
  if (!satisfaccion || !facilidad || !utilidad || typeof body.recomendaria !== 'boolean') {
    res.status(400).json({ error: 'Responde las preguntas obligatorias (calificaciones y recomendación).' });
    return;
  }
  const perfil = PROFILES.includes(body.perfil) ? body.perfil : 'otro';
  const modulo = MODULES.includes(body.modulo_favorito) ? body.modulo_favorito : null;
  const comentario = typeof body.comentario === 'string' ? body.comentario.slice(0, 1000) || null : null;

  try {
    await pool.query(
      `INSERT INTO public.encuestas
         (usuario_id, perfil, satisfaccion, facilidad, utilidad, recomendaria, minutos_otros_medios, minutos_xplorasg, modulo_favorito, comentario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [req.user?.id ?? null, perfil, satisfaccion, facilidad, utilidad, body.recomendaria,
        minutes(body.minutos_otros_medios), minutes(body.minutos_xplorasg), modulo, comentario],
    );
    res.status(201).json({ data: { ok: true } });
  } catch (error) {
    console.error('Error guardando encuesta:', error);
    res.status(500).json({ error: 'No fue posible guardar tu respuesta. Inténtalo de nuevo.' });
  }
};
