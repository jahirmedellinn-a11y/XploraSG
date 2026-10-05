import { useEffect, useState } from 'react';
import { catalogApi } from '../services/catalogApi';
import type { TourismService } from '../types/catalog';

export const ServicesPage = () => {
  const [services, setServices] = useState<TourismService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    catalogApi.services({ limit: 100 }, controller.signal)
      .then((response) => setServices(response.data))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('No fue posible conectar con el catálogo de servicios.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Planea tu visita</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Servicios locales</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">Hospedaje, gastronomía, guías y experiencias ofrecidas por prestadores verificados.</p>

      {error && <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}
      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-[1.75rem] bg-stone-200" />)}</div>
      ) : services.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">{service.categoria || 'Servicio turístico'}</p>
              <h2 className="mt-2 text-xl font-black">{service.nombre}</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">{service.prestador}</p>
              {service.municipio && <p className="mt-1 text-xs font-bold uppercase tracking-wider text-stone-400">{service.municipio}</p>}
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{service.descripcion || 'Información en preparación.'}</p>
              {service.rangoPrecio && <p className="mt-4 text-sm font-bold text-emerald-800">{service.rangoPrecio}</p>}
            </article>
          ))}
        </div>
      ) : !error && (
        <div className="mt-10 rounded-[2rem] border border-dashed border-emerald-900/25 bg-emerald-50/60 px-6 py-16 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-900 text-2xl text-white" aria-hidden="true">✦</div>
          <h2 className="mt-5 text-2xl font-black">Directorio en preparación</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-stone-600">La estructura ya está conectada. Los servicios aparecerán aquí cuando sus datos reales estén capturados y aprobados.</p>
        </div>
      )}
    </section>
  );
};

