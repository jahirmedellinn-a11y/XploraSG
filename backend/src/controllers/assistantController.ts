import { Request, Response } from 'express';
import pool from '../config/db';
import { askAiProvider } from '../services/aiProviders';
import { detectMunicipality, runAssistantEngine, type EngineEvent, type EnginePlace, type EngineWeather } from '../services/assistantEngine';
import { getWeather, parsePoint } from '../services/travelService';
import { getLang, type Lang } from '../services/i18n';

// ---- Límite de solicitudes en memoria: 10 preguntas por minuto por usuario/IP ----
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map<string, { count: number; start: number }>();
const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { count: 1, start: now });
    if (hits.size > 5_000) hits.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
};

// ---- Caché de clima por municipio (10 minutos) ----
const weatherCache = new Map<string, { at: number; value: EngineWeather }>();
const weatherFor = async (municipio: string, latitud: number, longitud: number, lang: Lang): Promise<EngineWeather | null> => {
  const cacheKey = `${lang}:${municipio}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.value;
  try {
    const data = await getWeather({ latitud, longitud }, lang);
    const today = data.forecast[0];
    const value: EngineWeather = {
      municipio,
      temperatura: data.current.temperature,
      condicion: data.current.condition,
      codigo: data.current.weatherCode,
      maxima: today?.temperatureMax ?? null,
      minima: today?.temperatureMin ?? null,
      probabilidadLluvia: today?.precipitationProbability ?? null,
    };
    weatherCache.set(cacheKey, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error('Clima no disponible para el asistente:', error instanceof Error ? error.message : error);
    return null;
  }
};

// Sólo contenido aprobado: el asistente nunca usa borradores.
const catalogQuery = `
  SELECT 'lugar' AS tipo, l.id, l.nombre, l.slug, mu.nombre AS municipio, ca.nombre AS categoria,
         l.descripcion, l.actividades, l.horarios, l.contacto, l.costo AS precio, l.info_acceso AS acceso,
         l.latitud::float8 AS latitud, l.longitud::float8 AS longitud,
         (to_jsonb(l)->'traducciones') || jsonb_build_object('en', ((to_jsonb(l)->'traducciones')->'en') || jsonb_strip_nulls(jsonb_build_object('precio', (to_jsonb(l)->'traducciones')->'en'->'costo'))) AS traducciones
  FROM public.lugares_turisticos AS l
  JOIN public.municipios AS mu ON mu.id = l.municipio_id
  JOIN public.categorias AS ca ON ca.id = l.categoria_id
  WHERE l.estado_aprobacion = 'aprobado' AND l.deleted_at IS NULL
  UNION ALL
  SELECT 'servicio' AS tipo, s.id, s.nombre, s.slug, COALESCE(mu.nombre, mul.nombre, '') AS municipio,
         CONCAT_WS(' ', ca.nombre, s.tipo_servicio) AS categoria,
         s.descripcion, NULL AS actividades, s.horario AS horarios, s.contacto, s.rango_precio AS precio, NULL AS acceso,
         s.latitud::float8 AS latitud, s.longitud::float8 AS longitud,
         (to_jsonb(s)->'traducciones') || jsonb_build_object('en', ((to_jsonb(s)->'traducciones')->'en') || jsonb_strip_nulls(jsonb_build_object('precio', (to_jsonb(s)->'traducciones')->'en'->'rango_precio', 'horarios', (to_jsonb(s)->'traducciones')->'en'->'horario'))) AS traducciones
  FROM public.servicios AS s
  JOIN public.prestadores AS p ON p.id = s.prestador_id AND p.estado_aprobacion = 'aprobado' AND p.deleted_at IS NULL
  LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
  LEFT JOIN public.lugares_turisticos AS ls ON ls.id = s.lugar_id
  LEFT JOIN public.municipios AS mul ON mul.id = ls.municipio_id
  LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
  WHERE s.estado_aprobacion = 'aprobado' AND s.deleted_at IS NULL`;

const nearestMunicipality = (
  origin: { latitud: number; longitud: number },
  municipalities: Array<{ nombre: string; latitud: number | null; longitud: number | null }>,
) => municipalities
  .filter((item) => item.latitud !== null && item.longitud !== null)
  .map((item) => ({ item, d: (item.latitud! - origin.latitud) ** 2 + (item.longitud! - origin.longitud) ** 2 }))
  .sort((a, b) => a.d - b.d)[0]?.item ?? null;

export const answerAssistantQuestion = async (req: Request, res: Response): Promise<void> => {
  const rawQuestion = req.body?.pregunta ?? req.body?.message;
  const question = typeof rawQuestion === 'string' ? rawQuestion.trim().slice(0, 500) : '';
  if (question.length < 2) {
    res.status(400).json({ error: 'Escribe una pregunta para Chatboot.' });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const key = req.user?.id || (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || req.socket.remoteAddress || 'anon';
  if (isRateLimited(String(key))) {
    res.status(429).json({ error: 'Demasiadas preguntas seguidas. Espera un minuto e inténtalo de nuevo.' });
    return;
  }

  const origin = parsePoint(req.body?.ubicacion);
  const lang = req.body?.idioma === 'en' ? 'en' : getLang(req);
  const firstMessage = req.body?.primera === true;

  try {
    const [catalog, municipalities, events] = await Promise.all([
      pool.query<EnginePlace>(catalogQuery),
      pool.query<{ nombre: string; latitud: number | null; longitud: number | null }>(
        'SELECT nombre, latitud::float8 AS latitud, longitud::float8 AS longitud FROM public.municipios ORDER BY nombre',
      ),
      pool.query<EngineEvent>(
        `SELECT CASE WHEN $1 = 'en' THEN COALESCE((to_jsonb(e)->'traducciones')->'en'->>'nombre', e.nombre) ELSE e.nombre END AS titulo, e.fecha_inicio, l.nombre AS lugar_nombre, mu.nombre AS municipio
         FROM public.eventos AS e
         LEFT JOIN public.lugares_turisticos AS l ON l.id = e.lugar_id
         LEFT JOIN public.municipios AS mu ON mu.id = l.municipio_id
         WHERE e.estado_aprobacion = 'aprobado' AND e.deleted_at IS NULL AND e.fecha_fin >= NOW()
         ORDER BY e.fecha_inicio LIMIT 6`,
        [lang],
      ),
    ]);

    const names = municipalities.rows.map((row) => row.nombre);
    const mentioned = detectMunicipality(question, names);

    // Clima del municipio mencionado, el más cercano al usuario o Jalpan de Serra como referencia.
    const target = (mentioned && municipalities.rows.find((row) => row.nombre === mentioned))
      || (origin && nearestMunicipality(origin, municipalities.rows))
      || municipalities.rows.find((row) => row.nombre === 'Jalpan de Serra')
      || null;
    const weather = target?.latitud != null && target.longitud != null ? await weatherFor(target.nombre, target.latitud, target.longitud, lang) : null;

    const result = runAssistantEngine({ question, items: catalog.rows, municipalities: names, weather, events: events.rows, origin, firstMessage, lang });

    let respuesta = result.respuesta;
    let modo: 'local' | 'openai' | 'anthropic' = 'local';
    try {
      const ai = await askAiProvider(question, {
        idiomaDeRespuesta: lang === 'en' ? 'English' : 'español',
        clima: weather,
        agenda: events.rows,
        recomendacionesDelCatalogo: result.referencias,
        borradorDelMotorLocal: result.respuesta,
      });
      if (ai) {
        respuesta = ai.text;
        modo = ai.provider;
      }
    } catch (aiError) {
      console.error('Proveedor de IA no disponible; se usa el motor local:', aiError instanceof Error ? aiError.message : aiError);
    }

    res.status(200).json({
      data: {
        respuesta,
        // Texto para la interfaz: sin la lista cuando responde el motor local (los lugares van como tarjetas).
        texto: modo === 'local' ? result.texto : respuesta,
        referencias: result.referencias,
        sugerencias: result.sugerencias,
        clima: weather,
        modo,
        aviso: lang === 'en'
          ? 'Answers based on the verified XploraSG catalog and the Open-Meteo forecast.'
          : 'Respuestas basadas en el catálogo verificado de XploraSG y el pronóstico de Open-Meteo.',
      },
    });
  } catch (error) {
    console.error('Error en el asistente:', error);
    res.status(500).json({ error: 'No fue posible consultar a Chatboot en este momento. Inténtalo de nuevo.' });
  }
};
