import type {
  Category,
  Municipality,
  PaginatedResponse,
  Place,
  TourismService,
} from '../types/catalog';
import { readCatalogCache, writeCatalogCache } from './offlineCatalog';

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

const getJson = async <T>(path: string, signal?: AbortSignal): Promise<WithOffline<T>> => {
  try {
    const response = await fetch(`${API_URL}${path}`, { signal });
    const body = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

    if (!response.ok) {
      throw new CatalogApiError(body?.error || 'No fue posible consultar el catálogo.', response.status);
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


