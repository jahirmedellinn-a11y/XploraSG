/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { agendaApi } from '../services/agendaApi';
import type { Evento, Promocion } from '../services/agendaApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { ArrowRightIcon, CalendarIcon, PinIcon, SparkleIcon } from '../components/brand/icons';
import { PageHero } from '../components/ui/PageHero';
import { ItalicTail, Photo } from '../components/home/HomeUi';

type Tab = 'eventos' | 'promociones';

const agendaMessages = defineMessages({
  pageTitle: 'Agenda cultural',
  loadError: 'No pudimos cargar la agenda. Revisa tu conexión e inténtalo de nuevo.',
  eyebrow: 'Tradición viva',
  title: 'Agenda Sierra Gorda',
  intro: 'Fiestas patronales, huapango y tradiciones de las misiones, además de promociones de prestadores locales.',
  tabsLabel: 'Secciones de la agenda',
  eventsTab: 'Eventos culturales',
  promotionsTab: 'Promociones',
  offline: 'Sin conexión: mostrando la última agenda guardada.',
  loading: 'Cargando agenda…',
  errorTitle: 'Algo salió mal',
  noEvents: 'No hay eventos próximos',
  noPromotions: 'No hay promociones activas',
  emptyMessage: 'Vuelve más tarde para descubrir nuevas experiencias en la Sierra Gorda.',
  exploreCatalog: 'Explorar el catálogo',
  schedule: (value: string) => `Horario: ${value}`,
  promotion: 'Promoción',
  validUntil: (date: string) => `Válida hasta el ${date}`,
  viewPlace: 'Ver lugar',
  viewService: 'Ver prestador',
  conditions: 'Condiciones',
  validLabel: 'Vigencia',
  upcoming: (n: number) => `${n} ${n === 1 ? 'evento próximo' : 'eventos próximos'}`,
}, {
  pageTitle: 'Cultural events',
  loadError: 'We couldn’t load the events. Check your connection and try again.',
  eyebrow: 'Living tradition',
  title: 'Sierra Gorda events',
  intro: 'Patron saint festivals, huapango music and mission traditions, plus deals from local businesses.',
  tabsLabel: 'Events sections',
  eventsTab: 'Cultural events',
  promotionsTab: 'Deals',
  offline: 'Offline: showing the last saved events.',
  loading: 'Loading events…',
  errorTitle: 'Something went wrong',
  noEvents: 'No upcoming events',
  noPromotions: 'No active deals',
  emptyMessage: 'Check back later to discover new experiences in the Sierra Gorda.',
  exploreCatalog: 'Explore the catalog',
  schedule: (value: string) => `Hours: ${value}`,
  promotion: 'Deal',
  validUntil: (date: string) => `Valid until ${date}`,
  viewPlace: 'View place',
  viewService: 'View business',
  conditions: 'Conditions',
  validLabel: 'Valid',
  upcoming: (n: number) => `${n} upcoming ${n === 1 ? 'event' : 'events'}`,
});

const formatters = (locale: string) => ({
  day: new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'America/Mexico_City' }),
  month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'America/Mexico_City' }),
  weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'America/Mexico_City' }),
  long: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }),
});

const useFormatters = () => {
  const { locale } = useLanguage();
  return useMemo(() => formatters(locale), [locale]);
};

const formatRange = (longFormatter: Intl.DateTimeFormat, start: string, end: string) => {
  const a = longFormatter.format(new Date(start));
  const b = longFormatter.format(new Date(end));
  return a === b ? a : `${a} – ${b}`;
};

const ClockIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
  </svg>
);

const clean = (value: string) => value.replace('.', '');

export const AgendaPage = () => {
  const m = useMessages(agendaMessages);
  usePageTitle(m.pageTitle);
  const [tab, setTab] = useState<Tab>('eventos');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [heroImage, setHeroImage] = useState<{ url: string; alt: string } | null>(null);
  const [heroChecked, setHeroChecked] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    const request = tab === 'eventos'
      ? agendaApi.eventos(1, controller.signal).then((res) => {
        setEventos(res.data);
        setOffline(Boolean(res._offline));
        const withPhoto = res.data.find((evento) => evento.lugar_imagen);
        if (withPhoto?.lugar_imagen) setHeroImage((current) => current ?? { url: withPhoto.lugar_imagen!, alt: withPhoto.lugar_nombre ?? '' });
      })
      : agendaApi.promociones(1, controller.signal).then((res) => { setPromociones(res.data); setOffline(Boolean(res._offline)); });

    request
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(m.loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHeroChecked(true);
        }
      });

    return () => controller.abort();
  }, [tab, m.loadError]);

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'eventos', label: m.eventsTab },
    { value: 'promociones', label: m.promotionsTab },
  ];

  const isEmpty = tab === 'eventos' ? eventos.length === 0 : promociones.length === 0;
  // Mientras llega la primera respuesta se reserva el espacio de la foto (bloque beige) para que la página no salte.
  const hero = heroImage ?? (heroChecked ? null : { url: null });

  return (
    <>
    <PageHero
      eyebrow={m.eyebrow}
      title={<ItalicTail text={m.title} words={2} />}
      subtitle={m.intro}
      image={hero}
    />
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-12 lg:px-8 lg:pb-28 lg:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-brand-sand">
        <div role="tablist" aria-label={m.tabsLabel} className="flex gap-8">
          {tabs.map(({ value, label }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={`relative -mb-px inline-flex min-h-12 items-center whitespace-nowrap border-b py-3 text-[15px] transition-colors duration-300 ${
                  active ? 'border-brand-blue font-medium text-brand-blue' : 'border-transparent text-brand-blue/70 hover:text-brand-blue'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {!loading && tab === 'eventos' && eventos.length > 0 && (
          <p className="pb-3.5 text-sm text-brand-blue/70">{m.upcoming(eventos.length)}</p>
        )}
      </div>

      {offline && !loading && (
        <p role="status" className="mt-8 flex items-center gap-2 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm font-medium text-ochre-900">
          <i className="size-2 shrink-0 rounded-full bg-ochre-600" aria-hidden="true" />
          {m.offline}
        </p>
      )}

      <div className="mt-4">
        {loading ? (
          <div aria-live="polite">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 border-b border-brand-sand py-8 sm:grid-cols-[6rem_minmax(0,1fr)]">
                <div className="h-16 animate-pulse rounded-lg bg-brand-sand/60" />
                <div className="space-y-3">
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-brand-sand/60" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-brand-sand/50" />
                  <div className="h-3 w-5/6 animate-pulse rounded-full bg-brand-sand/40" />
                </div>
              </div>
            ))}
            <span className="sr-only">{m.loading}</span>
          </div>
        ) : error ? (
          <EmptyState title={m.errorTitle} message={error} />
        ) : isEmpty ? (
          <EmptyState title={tab === 'eventos' ? m.noEvents : m.noPromotions} message={m.emptyMessage} />
        ) : tab === 'eventos' ? (
          <div>
            {eventos.map((e) => (
              <div key={e.id} className="min-w-0">
                <EventoCard evento={e} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
            {promociones.map((p) => (
              <div key={p.id} className="min-w-0">
                <PromocionCard promocion={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    </>
  );
};

const EmptyState = ({ title, message }: { title: string; message: string }) => {
  const m = useMessages(agendaMessages);
  return (
    <div className="mt-8 rounded-xl bg-brand-light px-6 py-16 text-center sm:py-20">
      <h2 className="text-3xl leading-tight text-brand-blue sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-brand-blue/70">{message}</p>
      <Link to="/explorar" className="btn btn-primary mt-7 min-h-12 px-7">
        {m.exploreCatalog}
      </Link>
    </div>
  );
};

const EventoCard = ({ evento }: { evento: Evento }) => {
  const m = useMessages(agendaMessages);
  const format = useFormatters();
  const start = new Date(evento.fecha_inicio);
  return (
    <article className="group relative grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-5 gap-y-6 border-b border-brand-sand py-9 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[7rem_minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-12 lg:py-12">
      <div className={`col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 ${evento.lugar_imagen ? '' : 'max-lg:hidden'}`}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg lg:aspect-[4/3]">
          <Photo src={evento.lugar_imagen} name={evento.lugar_nombre ?? evento.titulo} alt={evento.lugar_nombre ?? ''} imgClassName="img-zoom" nameClassName="text-xl" />
        </div>
      </div>

      <p className="flex flex-col lg:col-start-1 lg:row-start-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-gold">{clean(format.weekday.format(start))}</span>
        <span className="font-display mt-1 text-5xl leading-none tabular-nums text-brand-blue sm:text-6xl">{format.day.format(start)}</span>
        <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-blue/70">{clean(format.month.format(start))}</span>
      </p>

      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <h3 className="font-display text-2xl leading-tight text-brand-blue underline-offset-4 sm:text-[1.9rem] lg:group-hover:underline">{evento.titulo}</h3>
        <ul className="mt-4 grid gap-1.5 text-sm text-brand-blue/75">
          <li className="flex items-start gap-2.5">
            <CalendarIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
            <span>{formatRange(format.long, evento.fecha_inicio, evento.fecha_fin)}</span>
          </li>
          {(evento.lugar_nombre || evento.municipio) && (
            <li className="flex items-start gap-2.5">
              <PinIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
              <span>{[evento.lugar_nombre, evento.municipio].filter(Boolean).join(' · ')}</span>
            </li>
          )}
          {evento.horario && (
            <li className="flex items-start gap-2.5">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
              <span>{m.schedule(evento.horario)}</span>
            </li>
          )}
        </ul>
        {evento.descripcion && <p className="mt-4 max-w-xl text-[15px] leading-7 text-brand-blue/75">{evento.descripcion}</p>}
        {evento.lugar_slug && (
          <Link
            to={`/lugares/${evento.lugar_slug}`}
            aria-label={`${m.viewPlace}: ${evento.lugar_nombre ?? evento.titulo}`}
            className="mt-6 inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:border-brand-green group-hover:text-brand-green"
          >
            {m.viewPlace}
            <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
};

const PromocionCard = ({ promocion }: { promocion: Promocion }) => {
  const m = useMessages(agendaMessages);
  const format = useFormatters();
  return (
    <article className="relative flex h-full flex-col rounded-xl border border-brand-sand bg-white">
      <div className="px-6 pb-6 pt-6 sm:px-7 sm:pt-7">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-gold">
          <SparkleIcon className="size-3.5" />
          {m.promotion}
        </p>
        <h3 className="font-display mt-3 text-2xl leading-tight text-brand-blue">{promocion.titulo}</h3>
        {promocion.servicio_nombre && (
          <p className="mt-1.5 text-sm text-brand-blue/70">
            {promocion.servicio_slug
              ? <Link to={`/servicios/${promocion.servicio_slug}`} className="underline decoration-brand-blue/25 underline-offset-4 transition-colors duration-300 hover:text-brand-green">{promocion.servicio_nombre}</Link>
              : promocion.servicio_nombre}
          </p>
        )}
        {promocion.descripcion && <p className="mt-4 text-[15px] leading-7 text-brand-blue/75">{promocion.descripcion}</p>}
        {promocion.condiciones && (
          <p className="mt-3 text-xs leading-5 text-brand-blue/70">
            <span className="font-medium text-brand-blue/70">{m.conditions}: </span>
            {promocion.condiciones}
          </p>
        )}
      </div>

      {/* Talón del cupón: línea punteada con muescas */}
      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-dashed border-brand-gold/70 px-6 py-4 sm:px-7">
        <span aria-hidden="true" className="absolute -left-px top-0 h-5 w-2.5 -translate-y-1/2 rounded-r-full border border-l-0 border-brand-sand bg-brand-paper" />
        <span aria-hidden="true" className="absolute -right-px top-0 h-5 w-2.5 -translate-y-1/2 rounded-l-full border border-r-0 border-brand-sand bg-brand-paper" />
        <p className="text-xs text-brand-blue/75">
          <span className="mr-2 label-quiet">{m.validLabel}</span>
          {m.validUntil(format.long.format(new Date(promocion.fecha_fin)))}
        </p>
        {promocion.servicio_slug && (
          <Link
            to={`/servicios/${promocion.servicio_slug}`}
            aria-label={`${m.viewService}: ${promocion.servicio_nombre ?? promocion.titulo}`}
            className="group inline-flex items-center gap-1.5 border-b border-brand-blue/25 pb-0.5 text-[13px] font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green"
          >
            {m.viewService}
            <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
};
