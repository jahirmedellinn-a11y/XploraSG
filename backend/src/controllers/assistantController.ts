import { Request, Response } from 'express';
import pool from '../config/db';
import {
  askConfiguredModel,
  AssistantCatalogItem,
  buildCatalogAnswer,
  selectGroundedItems,
} from '../services/assistantService';
import { parsePoint } from '../services/travelService';

const requestLog = new Map<string, number[]>();

const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((timestamp) => now - timestamp < 10 * 60_000);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > 20;
};

const catalogQuery = `
  SELECT 'lugar'::TEXT AS tipo, l.id, l.nombre, l.slug, mu.nombre AS municipio,
         l.descripcion, l.actividades AS detalle, l.latitud, l.longitud
  FROM public.lugares_turisticos AS l
  JOIN public.municipios AS mu ON mu.id = l.municipio_id
  WHERE l.estado_aprobacion = 'aprobado' AND l.deleted_at IS NULL
  UNION ALL
  SELECT 'servicio'::TEXT AS tipo, s.id, s.nombre, s.slug, mu.nombre AS municipio,
         s.descripcion, COALESCE(s.tipo_servicio, s.horario) AS detalle,
         s.latitud, s.longitud
  FROM public.servicios AS s
  JOIN public.municipios AS mu ON mu.id = s.municipio_id
  JOIN public.prestadores AS p ON p.id = s.prestador_id
  WHERE s.estado_aprobacion = 'aprobado' AND p.estado_aprobacion = 'aprobado'
    AND s.deleted_at IS NULL AND p.deleted_at IS NULL
  UNION ALL
  SELECT 'actividad'::TEXT AS tipo, a.id, a.nombre, NULL::TEXT AS slug, mu.nombre AS municipio,
         a.descripcion, CONCAT_WS(' · ', a.duracion, a.dificultad, a.recomendaciones) AS detalle,
         l.latitud, l.longitud
  FROM public.actividades AS a
  JOIN public.lugares_turisticos AS l ON l.id = a.lugar_id
  JOIN public.municipios AS mu ON mu.id = l.municipio_id
  WHERE a.estado_aprobacion = 'aprobado' AND l.estado_aprobacion = 'aprobado'
    AND a.deleted_at IS NULL AND l.deleted_at IS NULL
  LIMIT 300`;

export const answerAssistantQuestion = async (req: Request, res: Response): Promise<void> => {
  const question = typeof req.body?.pregunta === 'string' ? req.body.pregunta.trim() : '';
  if (question.length < 3 || question.length > 500) {
    res.status(400).json({ error: 'La pregunta debe tener entre 3 y 500 caracteres.' });
    return;
  }
  if (isRateLimited(req.ip || 'unknown')) {
    res.status(429).json({ error: 'Se alcanzó el límite temporal de consultas. Intenta más tarde.' });
    return;
  }

  const suppliedLocation = req.body?.ubicacion;
  const location = suppliedLocation === undefined ? null : parsePoint(suppliedLocation);
  if (suppliedLocation !== undefined && location === null) {
    res.status(400).json({ error: 'La ubicación enviada no contiene coordenadas válidas.' });
    return;
  }

  try {
    const result = await pool.query<AssistantCatalogItem>(catalogQuery);
    const references = selectGroundedItems(question, result.rows, location);
    let answer = buildCatalogAnswer(references);
    let mode: 'catalogo' | 'modelo' = 'catalogo';
    try {
      const modelAnswer = await askConfiguredModel(question, references);
      if (modelAnswer) {
        answer = modelAnswer;
        mode = 'modelo';
      }
    } catch (modelError) {
      console.error('El proveedor de IA no respondió; se utilizó la respuesta de catálogo:', modelError);
    }

    res.status(200).json({
      data: {
        respuesta: answer,
        referencias: references,
        modo: mode,
        aviso: references.length
          ? 'Respuesta limitada al contenido publicado de XploraSG.'
          : 'No se utilizaron datos externos ni se inventó contenido.',
      },
    });
  } catch (error) {
    console.error('Error consultando el asistente:', error);
    res.status(500).json({ error: 'No fue posible consultar el asistente en este momento.' });
  }
};
