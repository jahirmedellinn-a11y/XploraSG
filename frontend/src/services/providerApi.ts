import { authorizedJson } from './authorizedFetch';

export type ApprovalState = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'suspendido';

export interface ProviderProfile {
  id: number;
  nombre_comercial: string;
  descripcion: string | null;
  telefono: string | null;
  correo: string | null;
  estado_aprobacion: ApprovalState;
}

export interface ProviderService {
  id: number;
  prestador_id: number;
  nombre: string;
  slug: string | null;
  descripcion: string | null;
  horario: string | null;
  rango_precio: string | null;
  contacto: string | null;
  reservacion: string | null;
  estado_aprobacion: ApprovalState;
  municipio: string;
  updated_at: string;
}

export interface ProviderPromotion {
  id: number;
  servicio_id: number | null;
  servicio_nombre: string | null;
  titulo: string;
  descripcion: string | null;
  condiciones: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado_aprobacion: ApprovalState;
  motivo_revision: string | null;
}

export interface MyBusiness {
  prestadores: ProviderProfile[];
  servicios: ProviderService[];
  promociones: ProviderPromotion[];
}

export type ServiceChanges = Partial<Pick<ProviderService, 'descripcion' | 'horario' | 'rango_precio' | 'contacto' | 'reservacion'>>;

export interface NewPromotion {
  servicio_id: number;
  titulo: string;
  descripcion: string;
  condiciones: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export const providerApi = {
  myBusiness: (token: string) => authorizedJson<{ data: MyBusiness }>('/api/prestador/mi-negocio', token),
  updateService: (token: string, id: number, changes: ServiceChanges) =>
    authorizedJson<{ data: ProviderService }>(`/api/prestador/servicios/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
  createPromotion: (token: string, promotion: NewPromotion) =>
    authorizedJson<{ data: { id: number } }>('/api/prestador/promociones', token, {
      method: 'POST',
      body: JSON.stringify(promotion),
    }),
  deletePromotion: (token: string, id: number) =>
    authorizedJson<{ data: { id: number } }>(`/api/prestador/promociones/${id}`, token, { method: 'DELETE' }),
};
