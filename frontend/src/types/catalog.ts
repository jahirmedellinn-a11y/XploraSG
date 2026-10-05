export interface Municipality {
  id: number;
  nombre: string;
  descripcion: string | null;
  latitud: string | null;
  longitud: string | null;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface MediaItem {
  id: number;
  tipo: string;
  url: string | null;
  altText: string | null;
  titulo: string | null;
}

export interface Place {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  latitud: string | null;
  longitud: string | null;
  altitud: number | null;
  direccion: string | null;
  infoAcceso: string | null;
  horarios: string | null;
  costo: string | null;
  actividades: string | null;
  serviciosDisponibles: string | null;
  accesibilidad: string | null;
  recomendaciones: string | null;
  contacto: string | null;
  fuenteVerificacion: string | null;
  municipio: string;
  categoria: string;
  imagenPrincipal?: MediaItem | null;
  multimedia?: MediaItem[];
}

export interface TourismService {
  id: number;
  slug: string | null;
  nombre: string;
  descripcion: string | null;
  rangoPrecio: string | null;
  contacto: string | null;
  horario: string | null;
  latitud: string | null;
  longitud: string | null;
  tipoServicio: string | null;
  ubicacion: string | null;
  reservacion: string | null;
  capacidadRequisitos: string | null;
  accesibilidad: string | null;
  lugaresRelacionados: string | null;
  fuenteVerificacion: string | null;
  prestador: string;
  categoria: string | null;
  lugar: string | null;
  municipio: string | null;
  imagenPrincipal: MediaItem | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

