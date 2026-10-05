import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CatalogApiError, catalogApi } from '../services/catalogApi';
import type { TourismService } from '../types/catalog';
import { WeatherCard } from '../components/WeatherCard';

export const ServiceDetailPage = () => {
  const { slug = '' } = useParams();
  const [service, setService] = useState<TourismService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .service(slug, controller.signal)
      .then((response) => setService(response.data))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof CatalogApiError && requestError.status === 404
          ? 'Este servicio todavía no está publicado.'
          : 'No fue posible cargar la información del servicio.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-5xl px-5 py-24 text-center font-bold text-stone-600">Cargando servicio…</div>;

  if (error || !service) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-6xl" aria-hidden="true">⌁</p>
        <h1 className="mt-5 text-3xl font-black">Información no disponible</h1>
        <p className="mt-3 text-stone-600">{error}</p>
        <Link to="/servicios" className="mt-7 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white">Volver a servicios</Link>
      </section>
    );
  }

  const media = service.imagenPrincipal ? [service.imagenPrincipal] : [];
  const latitude = service.latitud ? Number(service.latitud) : null;
  const longitude = service.longitud ? Number(service.longitud) : null;
  const coordinates = latitude !== null && longitude !== null
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=15/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`
    : null;

  const details = [
    ['Capacidad y Requisitos', service.capacidadRequisitos],
    ['Accesibilidad', service.accesibilidad],
    ['Ubicación general', service.ubicacion],
    ['Lugares Relacionados', service.lugaresRelacionados],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <article>
      <div className="relative min-h-[420px] overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700 text-white">
        {media[0]?.url && <img src={media[0].url} alt={media[0].altText || service.nombre} className="absolute inset-0 size-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col justify-end px-5 py-12 lg:px-8">
          <Link to="/servicios" className="mb-auto self-start rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/20">← Volver</Link>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">{service.tipoServicio || service.categoria || 'Servicio'} · {service.municipio}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{service.nombre}</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_300px] lg:px-8 lg:py-16">
        <div>
          <h2 className="text-2xl font-black">Acerca del servicio</h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-8 text-stone-600">{service.descripcion || 'La descripción verificada estará disponible próximamente.'}</p>
          
          {details.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {details.map(([title, value]) => (
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
            <div><dt className="font-bold text-stone-500">Municipio</dt><dd className="mt-1 font-semibold">{service.municipio}</dd></div>
            {service.prestador && <div><dt className="font-bold text-stone-500">Prestador</dt><dd className="mt-1 font-semibold">{service.prestador}</dd></div>}
            {service.horario && <div><dt className="font-bold text-stone-500">Horario</dt><dd className="mt-1 font-semibold">{service.horario}</dd></div>}
            {service.rangoPrecio && <div><dt className="font-bold text-stone-500">Rango de precio</dt><dd className="mt-1 font-semibold">{service.rangoPrecio}</dd></div>}
            {service.reservacion && <div><dt className="font-bold text-stone-500">Reservación</dt><dd className="mt-1 font-semibold">{service.reservacion}</dd></div>}
            {service.contacto && <div><dt className="font-bold text-stone-500">Contacto</dt><dd className="mt-1 font-semibold whitespace-pre-line">{service.contacto}</dd></div>}
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
