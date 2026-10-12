import { getJson } from './catalogApi';

export interface Evento {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  horario: string | null;
  contacto: string | null;
  lugar_nombre: string | null;
  lugar_slug: string | null;
  municipio: string | null;
  /** Foto principal del lugar donde ocurre el evento (si existe). */
  lugar_imagen?: string | null;
}

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string | null;
  condiciones: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  servicio_nombre: string | null;
  servicio_slug: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const agendaApi = {
  eventos: (page: number = 1, signal?: AbortSignal) =>
    getJson<PaginatedResponse<Evento>>(`/api/agenda/eventos?page=${page}&limit=12`, signal),

  promociones: (page: number = 1, signal?: AbortSignal) =>
    getJson<PaginatedResponse<Promocion>>(`/api/agenda/promociones?page=${page}&limit=12`, signal),
};
