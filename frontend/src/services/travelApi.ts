import { getLang } from '../i18n';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export type RouteProfile = 'driving-car' | 'cycling-regular' | 'foot-walking' | 'foot-hiking';

export interface WeatherData {
  timezone: string | null;
  location?: { latitude: number; longitude: number; elevation: number | null };
  current: {
    time: string | null;
    temperature: number | null;
    apparentTemperature: number | null;
    precipitation: number | null;
    windSpeed: number | null;
    humidity?: number | null;
    uvIndex?: number | null;
    weatherCode: number;
    condition: string;
  };
  forecast: Array<{
    date: string;
    weatherCode: number;
    condition: string;
    temperatureMax: number | null;
    temperatureMin: number | null;
    precipitationProbability: number | null;
  }>;
}

export interface RouteData {
  profile: RouteProfile;
  distanceMeters: number | null;
  durationSeconds: number | null;
  geometry: { type: 'LineString'; coordinates: number[][] };
  isFallback?: boolean;
  fallbackNotice?: string;
}

const request = async <T>(rawPath: string, init?: RequestInit): Promise<T> => {
  const lang = getLang();
  const path = lang === 'es' ? rawPath : `${rawPath}${rawPath.includes('?') ? '&' : '?'}lang=${lang}`;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error || (lang === 'en' ? 'The travel service is not available.' : 'El servicio de viaje no está disponible.'));
  return body as T;
};

export const travelApi = {
  weather: (latitud: number, longitud: number, signal?: AbortSignal) =>
    request<{ data: WeatherData }>(
      `/api/viaje/clima?latitud=${encodeURIComponent(latitud)}&longitud=${encodeURIComponent(longitud)}`,
      { signal },
    ),

  route: (
    origen: { latitud: number; longitud: number },
    destino: { latitud: number; longitud: number },
    perfil: RouteProfile,
  ) => request<{ data: RouteData }>('/api/viaje/ruta', {
    method: 'POST',
    body: JSON.stringify({ origen, destino, perfil }),
  }),
};

