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

export const describeWeatherCode = (code: number): string => weatherDescriptions[code] || 'Condición variable';

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
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  current_units?: Record<string, string>;
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

export const getWeather = async (point: Coordinate) => {
  const query = new URLSearchParams({
    latitude: String(point.latitud),
    longitude: String(point.longitud),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
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
    current: {
      time: data.current?.time ?? null,
      temperature: data.current?.temperature_2m ?? null,
      apparentTemperature: data.current?.apparent_temperature ?? null,
      precipitation: data.current?.precipitation ?? null,
      windSpeed: data.current?.wind_speed_10m ?? null,
      weatherCode: currentCode,
      condition: describeWeatherCode(currentCode),
    },
    forecast: dates.map((date, index) => {
      const code = data.daily?.weather_code?.[index] ?? -1;
      return {
        date,
        weatherCode: code,
        condition: describeWeatherCode(code),
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

export const getRoute = async (origin: Coordinate, destination: Coordinate, profile: RouteProfile) => {
  const apiKey = process.env.OPEN_ROUTE_SERVICE_API_KEY?.trim();
  if (!apiKey) {
    throw new TravelServiceError('El servicio de rutas aún no tiene configurada su clave.', 503);
  }

  const response = await fetchWithTimeout(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
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
        language: 'es',
        instructions: true,
      }),
    },
  );

  if (!response.ok) {
    throw new TravelServiceError(
      response.status === 429
        ? 'El servicio de rutas alcanzó temporalmente su límite de consultas.'
        : 'OpenRouteService no pudo calcular esta ruta.',
      response.status === 429 ? 429 : 502,
    );
  }

  const data = await response.json() as OpenRouteResponse;
  const feature = data.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  if (!feature || !coordinates?.length) throw new TravelServiceError('La ruta no devolvió una geometría válida.', 502);

  return {
    profile,
    distanceMeters: feature.properties?.summary?.distance ?? null,
    durationSeconds: feature.properties?.summary?.duration ?? null,
    geometry: { type: 'LineString', coordinates },
  };
};

