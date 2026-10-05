import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CatalogApiError, catalogApi } from '../services/catalogApi';
import type { Place } from '../types/catalog';
import { WeatherCard } from '../components/WeatherCard';

export const PlaceDetailPage = () => {
  const { slug = '' } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .place(slug, controller.signal)
      .then((response) => setPlace(response.data))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof CatalogApiError && requestError.status === 404
          ? 'Este lugar todavía no está publicado.'
          : 'No fue posible cargar la información del lugar.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-5xl px-5 py-24 text-center font-bold text-stone-600">Cargando lugar…</div>;

  if (error || !place) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-6xl" aria-hidden="true">⌁</p>
        <h1 className="mt-5 text-3xl font-black">Información no disponible</h1>
        <p className="mt-3 text-stone-600">{error}</p>
        <Link to="/explorar" className="mt-7 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white">Volver a explorar</Link>
      </section>
    );
  }

  const media = place.multimedia || [];
  const coordinates = place.latitud && place.longitud
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(place.latitud)}&mlon=${encodeURIComponent(place.longitud)}#map=15/${encodeURIComponent(place.latitud)}/${encodeURIComponent(place.longitud)}`
    : null;
  const latitude = place.latitud ? Number(place.latitud) : null;
  const longitude = place.longitud ? Number(place.longitud) : null;
  const visitDetails = [
    ['Actividades', place.actividades],
    ['Servicios disponibles', place.serviciosDisponibles],
    ['Accesibilidad', place.accesibilidad],
    ['Recomendaciones', place.recomendaciones],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <article>
      <div className="relative min-h-[420px] overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700 text-white">
        {media[0]?.url && <img src={media[0].url} alt={media[0].altText || place.nombre} className="absolute inset-0 size-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col justify-end px-5 py-12 lg:px-8">
          <Link to="/explorar" className="mb-auto self-start rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/20">← Volver</Link>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">{place.categoria} · {place.municipio}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{place.nombre}</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_300px] lg:px-8 lg:py-16">
        <div>
          <h2 className="text-2xl font-black">Acerca de este lugar</h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-8 text-stone-600">{place.descripcion || 'La descripción verificada estará disponible próximamente.'}</p>
          {place.infoAcceso && <><h2 className="mt-10 text-2xl font-black">Cómo visitarlo</h2><p className="mt-4 whitespace-pre-line leading-7 text-stone-600">{place.infoAcceso}</p></>}
          {visitDetails.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {visitDetails.map(([title, value]) => (
                <section key={title} className="rounded-2xl bg-stone-100 p-5">
                  <h2 className="font-black">{title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{value}</p>
                </section>
              ))}
            </div>
          )}
        </div>
        <aside className="h-fit rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-black">Datos prácticos</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div><dt className="font-bold text-stone-500">Municipio</dt><dd className="mt-1 font-semibold">{place.municipio}</dd></div>
            {place.direccion && <div><dt className="font-bold text-stone-500">Dirección</dt><dd className="mt-1 font-semibold">{place.direccion}</dd></div>}
            {place.horarios && <div><dt className="font-bold text-stone-500">Horario</dt><dd className="mt-1 font-semibold">{place.horarios}</dd></div>}
            {place.costo && <div><dt className="font-bold text-stone-500">Costo</dt><dd className="mt-1 font-semibold">{place.costo}</dd></div>}
            {place.contacto && <div><dt className="font-bold text-stone-500">Contacto</dt><dd className="mt-1 font-semibold">{place.contacto}</dd></div>}
            {place.altitud && <div><dt className="font-bold text-stone-500">Altitud</dt><dd className="mt-1 font-semibold">{place.altitud.toLocaleString('es-MX')} m s. n. m.</dd></div>}
          </dl>
          {coordinates && <a href={coordinates} target="_blank" rel="noreferrer" className="mt-6 block rounded-full bg-emerald-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-emerald-800">Abrir ubicación en el mapa</a>}
          {latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude) && (
            <div className="mt-7 border-t border-stone-200 pt-6">
              <h2 className="font-black">Clima actual</h2>
              <WeatherCard latitude={latitude} longitude={longitude} />
            </div>
          )}
        </aside>
      </div>
    </article>
  );
};

