import { useEffect, useState } from 'react';
import { travelApi, type WeatherData } from '../services/travelApi';

const weatherSymbol = (code: number) => {
  if (code === 0) return '☀';
  if (code <= 3) return '◑';
  if (code === 45 || code === 48) return '≋';
  if (code >= 95) return 'ϟ';
  if (code >= 51 && code <= 82) return '☂';
  return '○';
};

export const WeatherCard = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    travelApi.weather(latitude, longitude, controller.signal)
      .then((response) => setWeather(response.data))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('El clima no está disponible en este momento.');
      });
    return () => controller.abort();
  }, [latitude, longitude]);

  if (error) return <p className="mt-3 text-sm text-stone-500">{error}</p>;
  if (!weather) return <div className="mt-4 h-24 animate-pulse rounded-2xl bg-stone-100" />;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-sky-100 text-3xl text-sky-800" aria-hidden="true">{weatherSymbol(weather.current.weatherCode)}</span>
        <div>
          <p className="text-3xl font-black">{weather.current.temperature === null ? '—' : `${Math.round(weather.current.temperature)}°`}</p>
          <p className="text-sm font-semibold text-stone-600">{weather.current.condition}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-stone-600">
        <span className="rounded-xl bg-stone-50 p-2">Sensación {weather.current.apparentTemperature === null ? '—' : `${Math.round(weather.current.apparentTemperature)}°`}</span>
        <span className="rounded-xl bg-stone-50 p-2">Viento {weather.current.windSpeed === null ? '—' : `${Math.round(weather.current.windSpeed)} km/h`}</span>
      </div>
      <p className="mt-3 text-[11px] leading-4 text-stone-400">Pronóstico de Open-Meteo. Puede cambiar; verifica las condiciones antes de viajar.</p>
    </div>
  );
};

