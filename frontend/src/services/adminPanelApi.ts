import { authorizedJson } from './authorizedFetch';

export interface Statistics {
  totales: {
    lugares: number;
    servicios: number;
    prestadores: number;
    eventos_proximos: number;
    promociones_activas: number;
    promociones_pendientes: number;
    usuarios: number;
    favoritos: number;
    lugares_sin_coordenadas: number;
  };
  porMunicipio: Array<{ municipio: string; lugares: number; servicios: number }>;
  porCategoria: Array<{ categoria: string; lugares: number }>;
  topFavoritos: Array<{ nombre: string; slug: string; favoritos: number }>;
  usuariosPorRol: Array<{ rol: string; usuarios: number }>;
  generadoEn: string;
}

export interface PendingPromotion {
  id: number;
  titulo: string;
  descripcion: string | null;
  condiciones: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  servicio_nombre: string | null;
  prestador: string | null;
}

export interface ProviderOption {
  id: number;
  nombre_comercial: string;
  estado_aprobacion: string;
  usuario_email: string | null;
}

export const adminPanelApi = {
  statistics: (token: string) => authorizedJson<{ data: Statistics }>('/api/admin/estadisticas', token),
  pendingPromotions: (token: string) => authorizedJson<{ data: PendingPromotion[] }>('/api/admin/promociones', token),
  reviewPromotion: (token: string, id: number, estado: 'aprobado' | 'rechazado', motivo?: string) =>
    authorizedJson(`/api/admin/promociones/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ estado, motivo }),
    }),
  providers: (token: string) => authorizedJson<{ data: ProviderOption[] }>('/api/admin/prestadores', token),
  linkProvider: (token: string, providerId: number, email: string) =>
    authorizedJson(`/api/admin/prestadores/${providerId}/vincular`, token, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export interface SurveyResults {
  respuestas: number;
  satisfaccion_promedio: number | null;
  facilidad_promedio: number | null;
  utilidad_promedio: number | null;
  aceptacion_pct: number | null;
  satisfaccion_pct: number | null;
  minutos_otros: number | null;
  minutos_xplora: number | null;
  reduccion_tiempo_pct: number | null;
  metas: { respuestas: number; aceptacion_pct: number; satisfaccion_pct: number; reduccion_tiempo_pct: number };
  perfiles: Array<{ perfil: string; total: number }>;
  modulos: Array<{ modulo: string; total: number }>;
  comentarios: Array<{ comentario: string; satisfaccion: number; created_at: string }>;
}

export interface UsageAnalytics {
  totales: Record<string, number>;
  lugaresMasVistos: Array<{ nombre: string; slug: string; total: number }>;
  serviciosMasContactados: Array<{ nombre: string; slug: string; total: number }>;
  busquedasFrecuentes: Array<{ termino: string; total: number }>;
}

export interface AdminEvent {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  horario: string | null;
  contacto: string | null;
  estado_aprobacion: string;
  lugar_id: number | null;
  lugar_nombre: string | null;
}

export type EventInput = Omit<AdminEvent, 'id' | 'lugar_nombre'>;

export const adminInsightsApi = {
  survey: (token: string) => authorizedJson<{ data: SurveyResults }>('/api/admin/encuestas', token),
  usage: (token: string) => authorizedJson<{ data: UsageAnalytics }>('/api/admin/analitica', token),
  events: (token: string) => authorizedJson<{ data: AdminEvent[] }>('/api/admin/eventos', token),
  createEvent: (token: string, event: EventInput) =>
    authorizedJson('/api/admin/eventos', token, { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (token: string, id: number, event: EventInput) =>
    authorizedJson(`/api/admin/eventos/${id}`, token, { method: 'PATCH', body: JSON.stringify(event) }),
  deleteEvent: (token: string, id: number) =>
    authorizedJson(`/api/admin/eventos/${id}`, token, { method: 'DELETE' }),
};
