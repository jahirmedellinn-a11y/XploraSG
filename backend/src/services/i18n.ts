import { Request } from 'express';

// Idiomas que la API sabe servir. El español es el original de la base de datos.
export type Lang = 'es' | 'en';

/** Idioma pedido por el cliente: ?lang=en (preferido) o cabecera Accept-Language. */
export const getLang = (req: Request): Lang => {
  const fromQuery = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : '';
  if (fromQuery === 'en' || fromQuery === 'es') return fromQuery;
  return 'es';
};

// Nota: las consultas leen la columna como (to_jsonb(tabla)->'traducciones') para que la API
// siga funcionando aunque la migración 014 todavía no se haya aplicado (devuelve null → español).
type Translations = Record<string, Record<string, unknown>> | null | undefined;

/**
 * Sustituye los campos traducidos de una fila. `traducciones` tiene la forma
 * {"en": {"descripcion": "..."}}. Si falta un campo, se conserva el español.
 * Siempre elimina la columna `traducciones` de la respuesta.
 */
// Marcadores que quedaron de las fichas originales ("[Enlace a Google Maps]") y no deben verse.
const PLACEHOLDER = /\s*\[(?:enlace a google maps|google maps link|enlace)\]\.?/gi;

/** Quita marcadores de plantilla de los textos de una fila. */
export const cleanPlaceholders = <T extends Record<string, unknown>>(row: T): T => {
  const out: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === 'string' && PLACEHOLDER.test(value)) {
      PLACEHOLDER.lastIndex = 0;
      out[key] = value.replace(PLACEHOLDER, '').trim();
    }
    PLACEHOLDER.lastIndex = 0;
  }
  return out as T;
};

export const localizeRow = <T extends { traducciones?: Translations }>(
  row: T,
  lang: Lang,
): Omit<T, 'traducciones'> => {
  const { traducciones, ...rest } = row;
  if (lang === 'es' || !traducciones) return cleanPlaceholders(rest);
  const tr = traducciones[lang];
  if (!tr || typeof tr !== 'object') return cleanPlaceholders(rest);
  const out: Record<string, unknown> = { ...rest };
  for (const [key, value] of Object.entries(tr)) {
    if (key in out && typeof value === 'string' && value.trim()) out[key] = value;
  }
  return cleanPlaceholders(out) as Omit<T, 'traducciones'>;
};
