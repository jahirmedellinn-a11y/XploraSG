import { getLang } from '../i18n';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export interface AssistantReference {
  tipo: 'lugar' | 'servicio' | 'actividad';
  id: number;
  nombre: string;
  slug: string | null;
  municipio: string;
  resumen: string | null;
  distanciaKm: number | null;
  /** Lugar con coordenadas verificadas: se puede abrir en el mapa. */
  enMapa?: boolean;
  /** Contacto del servicio (botón Contactar por WhatsApp). */
  contacto?: string | null;
  /** Precio (servicios) o qué hacer (lugares). */
  detalle?: string | null;
}

export interface AssistantWeather {
  municipio: string;
  temperatura: number | null;
  condicion: string;
  codigo: number;
  maxima: number | null;
  minima: number | null;
  probabilidadLluvia: number | null;
}

export interface AssistantResponse {
  data: {
    respuesta: string;
    /** Versión breve para mostrar junto a las tarjetas (puede faltar en versiones anteriores). */
    texto?: string;
    referencias: AssistantReference[];
    sugerencias: string[];
    clima: AssistantWeather | null;
    modo: 'local' | 'openai' | 'anthropic';
    aviso: string;
  };
}

export const askAssistant = async (
  pregunta: string,
  ubicacion?: { latitud: number; longitud: number } | null,
  primera = false,
): Promise<AssistantResponse> => {
  const response = await fetch(`${API_URL}/api/asistente/consulta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pregunta, primera, idioma: getLang(), ...(ubicacion ? { ubicacion } : {}) }),
  });
  const body = (await response.json().catch(() => null)) as (AssistantResponse & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error || (getLang() === 'en' ? 'Chatboot is not available right now.' : 'No fue posible consultar a Chatboot.'));
  return body;
};
