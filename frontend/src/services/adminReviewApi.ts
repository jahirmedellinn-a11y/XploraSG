import type { PaginatedResponse } from '../types/catalog';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export type ReviewKind = 'lugar' | 'servicio';
export type ReviewState = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'suspendido';

export interface ReviewItem {
  id: number;
  tipo: ReviewKind;
  nombre: string;
  slug: string | null;
  municipio: string | null;
  categoria: string | null;
  estado: ReviewState;
  motivoRevision: string | null;
  updatedAt: string;
  faltantes: string[];
}

const authorizedJson = async <T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => null) as ({ error?: string; faltantes?: string[] } & T) | null;
  if (!response.ok) {
    const missing = body?.faltantes?.length ? ` Faltan: ${body.faltantes.join(', ')}.` : '';
    throw new Error(`${body?.error || 'No fue posible completar la revisión.'}${missing}`);
  }
  return body as T;
};

export const adminReviewApi = {
  list: (token: string, kind: ReviewKind, state?: ReviewState | '') => {
    const query = new URLSearchParams({ tipo: kind, limit: '100' });
    if (state) query.set('estado', state);
    return authorizedJson<PaginatedResponse<ReviewItem>>(`/api/catalogo/admin/revision?${query}`, token);
  },
  update: (token: string, item: ReviewItem, state: ReviewState, reason?: string) =>
    authorizedJson<{ data: { id: number; estado_aprobacion: ReviewState } }>(
      `/api/catalogo/admin/revision/${item.tipo}/${item.id}`,
      token,
      { method: 'PATCH', body: JSON.stringify({ estado: state, motivo: reason }) },
    ),
};

