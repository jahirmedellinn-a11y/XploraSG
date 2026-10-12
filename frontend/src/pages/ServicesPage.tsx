import { useEffect, useMemo, useState } from 'react';
import { ServiceCard } from '../components/ServiceCard';
import { catalogApi } from '../services/catalogApi';
import type { TourismService } from '../types/catalog';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { CloseIcon, PinIcon, SearchIcon } from '../components/brand/icons';
import { ItalicTail } from '../components/home/HomeUi';
import { WhatsAppIcon } from '../components/WhatsAppButton';
import { PageHero } from '../components/ui/PageHero';

const messages = defineMessages({
  title: 'Servicios locales',
  eyebrow: 'Planea tu visita',
  intro: 'Hospedaje, gastronomía, guías y experiencias ofrecidas por prestadores comunitarios verificados. Reserva directamente por WhatsApp.',
  searchLabel: 'Buscar servicio',
  searchPlaceholder: 'Busca hospedaje, comida, guías…',
  municipality: 'Municipio',
  allMunicipalities: 'Todos los municipios',
  offline: (date: string) => `Modo sin conexión · directorio guardado el ${date}`,
  error: 'No fue posible conectar con el catálogo de servicios ni recuperar una versión guardada.',
  count: (shown: number, total: number) => `${shown} de ${total} servicios`,
  noResults: 'Sin resultados',
  emptyDirectory: 'Directorio en preparación',
  noResultsText: 'Prueba con otra palabra o municipio.',
  emptyDirectoryText: 'Los servicios aparecerán aquí cuando sus datos estén capturados y aprobados.',
  type: 'Tipo de servicio',
  allTypes: 'Todos',
  clearFilters: 'Limpiar filtros',
  statServices: 'servicios verificados',
  statMunicipalities: 'municipios',
  directBooking: 'Reserva directa, sin comisiones',
  filtersLabel: 'Filtrar servicios',
}, {
  title: 'Local services',
  eyebrow: 'Plan your visit',
  intro: 'Lodging, food, guides and experiences offered by verified community businesses. Book directly on WhatsApp.',
  searchLabel: 'Search services',
  searchPlaceholder: 'Search lodging, food, guides…',
  municipality: 'Municipality',
  allMunicipalities: 'All municipalities',
  offline: (date: string) => `Offline mode · directory saved on ${date}`,
  error: 'We couldn’t reach the services catalog or load a saved copy.',
  count: (shown: number, total: number) => `${shown} of ${total} ${total === 1 ? 'service' : 'services'}`,
  noResults: 'No results',
  emptyDirectory: 'Directory coming soon',
  noResultsText: 'Try another word or municipality.',
  emptyDirectoryText: 'Services will appear here once their details have been entered and approved.',
  type: 'Service type',
  allTypes: 'All',
  clearFilters: 'Clear filters',
  statServices: 'verified services',
  statMunicipalities: 'municipalities',
  directBooking: 'Direct booking, no fees',
  filtersLabel: 'Filter services',
});

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const ServicesPage = () => {
  const m = useMessages(messages);
  const { lang, locale } = useLanguage();
  usePageTitle(m.title);
  const [services, setServices] = useState<TourismService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storedAt, setStoredAt] = useState('');
  const [query, setQuery] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .services({ limit: 50 }, controller.signal)
      .then((response) => {
        setServices(response.data);
        setStoredAt(response._offline && response._storedAt ? response._storedAt : '');
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const offlineDate = storedAt ? new Date(storedAt).toLocaleString(locale) : '';

  const municipalities = useMemo(
    () => [...new Set(services.map((service) => service.municipio).filter((value): value is string => Boolean(value)))].sort(),
    [services],
  );

  const types = useMemo(
    () => [...new Set(services.map((service) => service.categoria).filter((value): value is string => Boolean(value)))].sort(),
    [services],
  );

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return services.filter((service) =>
      (!municipality || service.municipio === municipality) &&
      (!type || service.categoria === type) &&
      (!term || normalize(`${service.nombre} ${service.tipoServicio ?? ''} ${service.categoria ?? ''} ${service.descripcion ?? ''} ${service.prestador}`).includes(term)));
  }, [services, query, municipality, type]);

  const heroService = useMemo(() => services.find((service) => service.imagenPrincipal?.url), [services]);

  const filtersActive = Boolean(query || municipality || type);
  const clearFilters = () => {
    setQuery('');
    setMunicipality('');
    setType('');
  };

  const tabClass = (active: boolean) =>
    `relative inline-flex shrink-0 items-center whitespace-nowrap py-4 text-sm transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:transition-colors after:duration-300 ${
      active ? 'font-medium text-brand-blue after:bg-brand-blue' : 'text-brand-blue/70 after:bg-transparent hover:text-brand-blue'
    }`;

  return (
    <>
      <PageHero
        eyebrow={m.eyebrow}
        title={<ItalicTail text={m.title} words={1} />}
        subtitle={m.intro}
        image={loading || heroService ? { url: heroService?.imagenPrincipal?.url, alt: '' } : null}
        actions={(
          <p className="inline-flex items-center gap-2 text-sm text-brand-blue/70">
            <WhatsAppIcon className="size-4 text-brand-green" /> {m.directBooking}
          </p>
        )}
        stats={[
          { value: loading ? '—' : services.length, label: m.statServices },
          { value: loading ? '—' : municipalities.length, label: m.statMunicipalities },
        ]}
      />

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-14 lg:px-8 lg:pb-28 lg:pt-20">
        <div role="region" aria-label={m.filtersLabel}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="service-search">{m.searchLabel}</label>
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-brand-blue/40" />
              <input
                id="service-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={m.searchPlaceholder}
                maxLength={80}
                className="field pl-11"
              />
            </div>
            <label className="sr-only" htmlFor="service-municipality">{m.municipality}</label>
            <div className="relative sm:w-60">
              <PinIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-brand-teal" />
              <select
                id="service-municipality"
                value={municipality}
                onChange={(event) => setMunicipality(event.target.value)}
                className="field appearance-none truncate pl-11 pr-10"
              >
                <option value="">{m.allMunicipalities}</option>
                {municipalities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m7 10 5 5 5-5" /></svg>
            </div>
            <div className="flex items-center justify-between gap-4 sm:ml-auto sm:justify-end">
              {!loading && visible.length > 0 ? (
                <p className="whitespace-nowrap text-sm text-brand-blue/70" aria-live="polite">{m.count(visible.length, services.length)}</p>
              ) : <span />}
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-brand-blue/75 underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:text-brand-blue">
                  <CloseIcon className="size-3.5" />
                  {m.clearFilters}
                </button>
              )}
            </div>
          </div>

          {types.length > 1 && (
            <div role="group" aria-label={m.type} className="snap-rail -mx-5 mt-6 flex scroll-px-5 gap-7 overflow-x-auto border-b border-brand-sand px-5 sm:mx-0 sm:scroll-px-0 sm:px-0">
              <button type="button" aria-pressed={!type} onClick={() => setType('')} className={tabClass(!type)}>
                {m.allTypes}
              </button>
              {types.map((item) => {
                const active = type === item;
                return (
                  <button key={item} type="button" aria-pressed={active} onClick={() => setType(active ? '' : item)} className={tabClass(active)}>
                    {categoryLabel(item, lang)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {offlineDate && (
          <p role="status" className="mt-8 inline-flex rounded-full border border-ochre-300 bg-ochre-50 px-4 py-2 text-sm font-medium text-ochre-900">
            {m.offline(offlineDate)}
          </p>
        )}
        {error && <div role="alert" className="mt-8 rounded-lg border border-clay-200 bg-clay-50 p-4 text-sm font-medium text-clay-800">{m.error}</div>}

        {loading ? (
          <div className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
            {[0, 1, 2].map((item) => (
              <div key={item}>
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-brand-sand/60" />
                <div className="mt-4 h-3 w-24 animate-pulse rounded-full bg-brand-sand/60" />
                <div className="mt-3 h-6 w-3/4 animate-pulse rounded-full bg-brand-sand/50" />
              </div>
            ))}
          </div>
        ) : visible.length ? (
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
            {visible.map((service) => (
              <div key={service.id} className="min-w-0">
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        ) : (
          !error && (
            <div className="mt-12 rounded-xl bg-brand-light px-6 py-16 text-center sm:py-20">
              <h2 className="text-3xl leading-tight text-brand-blue sm:text-4xl">{services.length ? m.noResults : m.emptyDirectory}</h2>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-brand-blue/70">
                {services.length ? m.noResultsText : m.emptyDirectoryText}
              </p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="btn btn-primary mt-7 min-h-12 px-7">{m.clearFilters}</button>
              )}
            </div>
          )
        )}
      </section>
    </>
  );
};
