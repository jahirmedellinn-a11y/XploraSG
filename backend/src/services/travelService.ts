export const ROUTE_PROFILES = [
  'driving-car',
  'cycling-regular',
  'foot-walking',
  'foot-hiking',
] as const;

export type RouteProfile = (typeof ROUTE_PROFILES)[number];

export interface Coordinate {
  latitud: number;
  longitud: number;
}

export class TravelServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'TravelServiceError';
    this.status = status;
  }
}

export const parseCoordinate = (value: unknown, minimum: number, maximum: number): number | null => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
};

export const parsePoint = (value: unknown): Coordinate | null => {
  if (!value || typeof value !== 'object') return null;
  const point = value as Record<string, unknown>;
  const latitud = parseCoordinate(point.latitud, -90, 90);
  const longitud = parseCoordinate(point.longitud, -180, 180);
  return latitud === null || longitud === null ? null : { latitud, longitud };
};

export const parseRouteProfile = (value: unknown): RouteProfile | null => {
  if (typeof value !== 'string') return null;
  return ROUTE_PROFILES.includes(value as RouteProfile) ? value as RouteProfile : null;
};

const weatherDescriptions: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  71: 'Nieve ligera',
  73: 'Nieve moderada',
  75: 'Nieve intensa',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos intensos',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo ligero',
  99: 'Tormenta con granizo intenso',
};

const weatherDescriptionsEn: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Light showers',
  81: 'Moderate showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with light hail',
  99: 'Thunderstorm with heavy hail',
};

export const describeWeatherCode = (code: number, lang: 'es' | 'en' = 'es'): string => lang === 'en'
  ? weatherDescriptionsEn[code] || 'Variable conditions'
  : weatherDescriptions[code] || 'Condición variable';

const fetchWithTimeout = async (url: string, init?: RequestInit) => {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new TravelServiceError('El proveedor externo tardó demasiado en responder.', 504);
    }
    throw new TravelServiceError('No fue posible conectar con el proveedor externo.', 502);
  }
};

interface OpenMeteoResponse {
  timezone?: string;
  latitude?: number;
  longitude?: number;
  /** Altitud del punto (modelo digital de elevación de Open-Meteo, en metros). */
  elevation?: number;
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    relative_humidity_2m?: number;
    uv_index?: number;
  };
  current_units?: Record<string, string>;
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    uv_index_max?: number[];
  };
}

export const getWeather = async (point: Coordinate, lang: 'es' | 'en' = 'es') => {
  const query = new URLSearchParams({
    latitude: String(point.latitud),
    longitude: String(point.longitud),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max',
    forecast_days: '3',
    timezone: 'auto',
  });
  const response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${query}`);
  if (!response.ok) throw new TravelServiceError('Open-Meteo rechazó la consulta del clima.', 502);

  const data = await response.json() as OpenMeteoResponse;
  const currentCode = data.current?.weather_code ?? -1;
  const dates = data.daily?.time ?? [];

  return {
    timezone: data.timezone ?? null,
    // Coordenadas consultadas (exactas) y altitud del terreno según Open-Meteo.
    location: {
      latitude: point.latitud,
      longitude: point.longitud,
      elevation: typeof data.elevation === 'number' ? Math.round(data.elevation) : null,
    },
    current: {
      time: data.current?.time ?? null,
      temperature: data.current?.temperature_2m ?? null,
      apparentTemperature: data.current?.apparent_temperature ?? null,
      precipitation: data.current?.precipitation ?? null,
      windSpeed: data.current?.wind_speed_10m ?? null,
      humidity: data.current?.relative_humidity_2m ?? null,
      uvIndex: data.current?.uv_index ?? data.daily?.uv_index_max?.[0] ?? null,
      weatherCode: currentCode,
      condition: describeWeatherCode(currentCode, lang),
    },
    forecast: dates.map((date, index) => {
      const code = data.daily?.weather_code?.[index] ?? -1;
      return {
        date,
        weatherCode: code,
        condition: describeWeatherCode(code, lang),
        temperatureMax: data.daily?.temperature_2m_max?.[index] ?? null,
        temperatureMin: data.daily?.temperature_2m_min?.[index] ?? null,
        precipitationProbability: data.daily?.precipitation_probability_max?.[index] ?? null,
      };
    }),
    units: data.current_units ?? {},
  };
};

interface OpenRouteFeature {
  geometry?: { type?: string; coordinates?: number[][] };
  properties?: { summary?: { distance?: number; duration?: number } };
}

interface OpenRouteResponse {
  features?: OpenRouteFeature[];
}

const haversineDistanceMeters = (origin: Coordinate, destination: Coordinate): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(destination.latitud - origin.latitud);
  const longitudeDelta = radians(destination.longitud - origin.longitud);
  const firstLatitude = radians(origin.latitud);
  const secondLatitude = radians(destination.latitud);
  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
};

const estimateDurationSeconds = (distanceMeters: number, profile: RouteProfile): number => {
  const km = distanceMeters / 1000;
  const speedKmH = profile === 'driving-car' ? 50 : profile === 'cycling-regular' ? 15 : profile === 'foot-hiking' ? 3.5 : 4.5;
  return Math.round((km / speedKmH) * 3600);
};

const ORS_PRIMARY_URL = 'https://api.openrouteservice.org';
const ORS_SECONDARY_URL = 'https://api.heigit.org/openrouteservice';

export const getRoute = async (origin: Coordinate, destination: Coordinate, profile: RouteProfile, lang: 'es' | 'en' = 'es') => {
  const distanceMeters = haversineDistanceMeters(origin, destination);
  const estimatedSeconds = estimateDurationSeconds(distanceMeters, profile);
  const fallbackGeometry = {
    type: 'LineString' as const,
    coordinates: [
      [origin.longitud, origin.latitud],
      [destination.longitud, destination.latitud],
    ],
  };

  const apiKey = process.env.OPEN_ROUTE_SERVICE_API_KEY?.trim();

  // Si no hay API Key o falla el proveedor externo, devolvemos una ruta de resiliencia (GeoJSON directo con distancia real)
  if (!apiKey) {
    return {
      profile,
      distanceMeters: Math.round(distanceMeters),
      durationSeconds: estimatedSeconds,
      geometry: fallbackGeometry,
      isFallback: true,
      fallbackNotice: lang === 'en'
        ? 'Direct reference route displayed. Open in Google Maps for turn-by-turn navigation.'
        : 'Se muestra la ruta directa de referencia. Abre Google Maps para navegación giro a giro.',
    };
  }

  const customBase = process.env.ORS_BASE_URL?.trim();
  const endpoints = customBase ? [customBase.replace(/\/+$/, '')] : [ORS_PRIMARY_URL, ORS_SECONDARY_URL];

  for (const baseUrl of endpoints) {
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}/v2/directions/${profile}/geojson`,
        {
          method: 'POST',
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/geo+json, application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [origin.longitud, origin.latitud],
              [destination.longitud, destination.latitud],
            ],
            language: lang,
            instructions: true,
            radiuses: [3000, 3000],
          }),
        },
      );

      if (response.ok) {
        const data = await response.json() as OpenRouteResponse;
        const feature = data.features?.[0];
        const coordinates = feature?.geometry?.coordinates;
        if (feature && coordinates?.length) {
          return {
            profile,
            distanceMeters: feature.properties?.summary?.distance ?? Math.round(distanceMeters),
            durationSeconds: feature.properties?.summary?.duration ?? estimatedSeconds,
            geometry: { type: 'LineString' as const, coordinates },
            isFallback: false,
          };
        }
      }
    } catch (err) {
      console.warn(`Intento de conexión a ${baseUrl} falló:`, err instanceof Error ? err.message : String(err));
    }
  }

  // Si todas las llamadas a la API fallan por red, límite de cuota o 404 de caminos, devolvemos el fallback resiliente sin congelar la app
  return {
    profile,
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: estimatedSeconds,
    geometry: fallbackGeometry,
    isFallback: true,
    fallbackNotice: lang === 'en'
      ? 'Route calculated with local fallback. Tap Google Maps for detailed turn-by-turn routing.'
      : 'Ruta trazada con respaldo local. Toca "Abrir en Google Maps" para navegación detallada.',
  };
};


