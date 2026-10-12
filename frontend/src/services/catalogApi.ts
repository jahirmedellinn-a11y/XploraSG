import type {
  Category,
  Municipality,
  PaginatedResponse,
  Place,
  TourismService,
} from '../types/catalog';
import { readCatalogCache, writeCatalogCache } from './offlineCatalog';
import { getLang } from '../i18n';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class CatalogApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CatalogApiError';
    this.status = status;
  }
}

type WithOffline<T> = T & { _offline?: boolean; _storedAt?: string };

/** Agrega ?lang=en cuando el sitio está en inglés (la caché sin conexión queda separada por idioma). */
const withLang = (path: string) => {
  const lang = getLang();
  if (lang === 'es') return path;
  return `${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
};

export const getJson = async <T>(rawPath: string, signal?: AbortSignal): Promise<WithOffline<T>> => {
  const path = withLang(rawPath);
  try {
    const response = await fetch(`${API_URL}${path}`, { signal });
    const body = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

    if (!response.ok) {
      throw new CatalogApiError(body?.error || (getLang() === 'en' ? 'The catalog could not be loaded.' : 'No fue posible consultar el catálogo.'), response.status);
    }

    await writeCatalogCache(path, body as T);
    return body as WithOffline<T>;
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw error;
    }
    if (error instanceof CatalogApiError) {
      throw error;
    }

    const cached = await readCatalogCache<T>(path);
    if (cached !== null) {
      const result = cached.value as WithOffline<T>;
      result._offline = true;
      result._storedAt = cached.storedAt;
      return result;
    }
    throw error;
  }
};

const queryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : '';
};

export const catalogApi = {
  municipalities: (signal?: AbortSignal) =>
    getJson<{ data: Municipality[] }>('/api/catalogo/municipios', signal),

  categories: (signal?: AbortSignal) =>
    getJson<{ data: Category[] }>('/api/catalogo/categorias', signal),

  places: (
    filters: { municipio?: string; categoria?: string; q?: string; page?: number; limit?: number },
    signal?: AbortSignal,
  ) =>
    getJson<PaginatedResponse<Place>>(
      `/api/catalogo/lugares${queryString(filters)}`,
      signal,
    ),

  place: (slug: string, signal?: AbortSignal) =>
    getJson<{ data: Place }>(`/api/catalogo/lugares/${encodeURIComponent(slug)}`, signal),

  services: (
    filters: { municipio?: string; categoria?: string; q?: string; page?: number; limit?: number },
    signal?: AbortSignal,
  ) =>
    getJson<PaginatedResponse<TourismService>>(
      `/api/catalogo/servicios${queryString(filters)}`,
      signal,
    ),

  service: (slug: string, signal?: AbortSignal) =>
    getJson<{ data: TourismService }>(`/api/catalogo/servicios/${encodeURIComponent(slug)}`, signal),
};


