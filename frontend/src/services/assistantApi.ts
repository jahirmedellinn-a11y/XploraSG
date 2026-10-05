const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export interface AssistantReference {
  tipo: 'lugar' | 'servicio' | 'actividad';
  id: number;
  nombre: string;
  slug: string | null;
  municipio: string;
  resumen: string | null;
  distanciaKm: number | null;
}

export interface AssistantResponse {
  data: {
    respuesta: string;
    referencias: AssistantReference[];
    modo: 'catalogo' | 'modelo';
    aviso: string;
  };
}

export const askAssistant = async (
  pregunta: string,
  ubicacion?: { latitud: number; longitud: number } | null,
): Promise<AssistantResponse> => {
  const response = await fetch(`${API_URL}/api/asistente/consulta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pregunta, ...(ubicacion ? { ubicacion } : {}) }),
  });
  const body = await response.json().catch(() => null) as (AssistantResponse & { error?: string }) | null;
  if (!response.ok) throw new Error(body?.error || 'No fue posible consultar el asistente.');
  return body as AssistantResponse;
};
