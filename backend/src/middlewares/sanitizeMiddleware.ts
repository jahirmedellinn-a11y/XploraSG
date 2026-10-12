import { NextFunction, Request, Response } from 'express';

// Saneamiento de entradas para todos los endpoints.
// - Bloquea claves peligrosas (contaminación de prototipos y operadores tipo "$where").
// - Limpia cadenas: normaliza Unicode, elimina bytes nulos/caracteres de control y etiquetas HTML.
// - Limita profundidad, tamaño de arreglos y longitud de textos.
// La protección contra inyección SQL se garantiza además con consultas parametrizadas ($1, $2…)
// en todos los controladores: ningún valor del usuario se concatena en el SQL.

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 6;
const MAX_ARRAY = 200;
const MAX_STRING = 5_000;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-z!][^>]*>/gi;

export class UnsafeInputError extends Error {}

export const sanitizeString = (value: string): string =>
  value
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(HTML_TAGS, '')
    .slice(0, MAX_STRING)
    .trim();

export const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) throw new UnsafeInputError('La solicitud tiene demasiados niveles anidados.');
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) throw new UnsafeInputError('La solicitud contiene demasiados elementos.');
    return value.map((item) => sanitizeValue(item, depth + 1));
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = Object.create(null);
    for (const [key, item] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key) || key.startsWith('$')) {
        throw new UnsafeInputError(`Campo no permitido en la solicitud: ${key.slice(0, 40)}`);
      }
      clean[key] = sanitizeValue(item, depth + 1);
    }
    return { ...clean };
  }
  return value;
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
    // En Express 5 req.query es un getter; se redefine con la versión saneada.
    const query = sanitizeValue(req.query ?? {});
    Object.defineProperty(req, 'query', { value: query, writable: true, configurable: true, enumerable: true });
    if (req.params) {
      for (const key of Object.keys(req.params)) {
        const param = req.params[key];
        if (typeof param === 'string') req.params[key] = sanitizeString(param);
      }
    }
    next();
  } catch (error) {
    if (error instanceof UnsafeInputError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
};
