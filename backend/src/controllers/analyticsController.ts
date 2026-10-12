import { Request, Response } from 'express';
import pool from '../config/db';

const TYPES = ['vista_lugar', 'vista_servicio', 'clic_whatsapp', 'busqueda', 'consulta_asistente', 'ruta', 'compartir'];

// Registro anónimo de uso (no se guarda IP ni usuario).
export const trackUsage = async (req: Request, res: Response): Promise<void> => {
  const tipo = req.body?.tipo;
  if (!TYPES.includes(tipo)) {
    res.status(400).json({ error: 'Tipo de evento inválido.' });
    return;
  }
  const id = Number.parseInt(String(req.body?.referenciaId ?? ''), 10);
  const termino = typeof req.body?.termino === 'string' ? req.body.termino.toLowerCase().slice(0, 120) || null : null;
  try {
    await pool.query(
      'INSERT INTO public.eventos_uso (tipo, referencia_id, termino) VALUES ($1, $2, $3)',
      [tipo, Number.isFinite(id) && id > 0 ? id : null, termino],
    );
    res.status(204).end();
  } catch (error) {
    console.error('Error registrando analítica:', error instanceof Error ? error.message : error);
    res.status(204).end(); // la analítica nunca debe romper la experiencia
  }
};
