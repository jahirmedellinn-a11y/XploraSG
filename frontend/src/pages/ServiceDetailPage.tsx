import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogApiError, catalogApi } from '../services/catalogApi';
import type { TourismService } from '../types/catalog';
import { WeatherCard } from '../components/WeatherCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { usePageTitle } from '../hooks/usePageTitle';
import { trackEvent } from '../services/feedbackApi';
import { ShareButton } from '../components/ShareButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { CompassIcon, MapIcon, PinIcon } from '../components/brand/icons';
import { AccessIcon, ClockIcon, TicketIcon, UsersIcon } from '../components/ui/LineIcons';
import { AmenityGrid, BlockTitle, DetailHero, DetailSkeleton, DetailUnavailable, HeroFact, InfoBlock, PracticalItem, SectionHeading } from '../components/ui/DetailParts';
import { RelatedRail } from '../components/ui/RelatedRail';
import { activityIcon } from '../components/ui/activityIcons';
import { activityTags } from '../utils/text';
import type { Place } from '../types/catalog';

const messages = defineMessages({
  notPublished: 'Este servicio todavía no está publicado.',
  loadError: 'No fue posible cargar la información del servicio.',
  loading: 'Cargando servicio…',
  unavailable: 'Información no disponible',
  backToServices: 'Volver a servicios',
  back: 'Volver',
  fallbackType: 'Servicio',
  about: 'Acerca del servicio',
  noDescription: 'La descripción verificada estará disponible próximamente.',
  capacity: 'Capacidad y Requisitos',
  accessibility: 'Accesibilidad',
  generalLocation: 'Ubicación general',
  relatedPlaces: 'Lugares Relacionados',
  whatsappHint: 'Te abrirá WhatsApp con un mensaje listo para enviar.',
  practicalInfo: 'Datos prácticos',
  municipality: 'Municipio',
  provider: 'Prestador',
  schedule: 'Horario',
  priceRange: 'Rango de precio',
  booking: 'Reservación',
  contact: 'Contacto',
  openLocation: 'Abrir ubicación en el mapa',
  currentWeather: 'Clima actual',
  offers: 'Lo que ofrece',
  goodToKnow: 'Antes de reservar',
  keepExploring: 'Completa tu viaje',
  nearbyPlaces: (municipio: string) => `Qué visitar en ${municipio}`,
}, {
  notPublished: 'This service has not been published yet.',
  loadError: 'We couldn’t load the information for this service.',
  loading: 'Loading service…',
  unavailable: 'Information unavailable',
  backToServices: 'Back to services',
  back: 'Back',
  fallbackType: 'Service',
  about: 'About this service',
  noDescription: 'A verified description will be available soon.',
  capacity: 'Capacity & requirements',
  accessibility: 'Accessibility',
  generalLocation: 'General location',
  relatedPlaces: 'Related places',
  whatsappHint: 'Opens WhatsApp with a message ready to send.',
  practicalInfo: 'Practical info',
  municipality: 'Municipality',
  provider: 'Provider',
  schedule: 'Hours',
  priceRange: 'Price range',
  booking: 'Booking',
  contact: 'Contact',
  openLocation: 'Open location on the map',
  currentWeather: 'Current weather',
  offers: 'What it offers',
  goodToKnow: 'Before you book',
  keepExploring: 'Round out your trip',
  nearbyPlaces: (municipio: string) => `What to see in ${municipio}`,
});

export const ServiceDetailPage = () => {
  const { slug = '' } = useParams();
  const [service, setService] = useState<TourismService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'' | 'notPublished' | 'loadError'>('');
  const [nearby, setNearby] = useState<Place[]>([]);
  const { lang } = useLanguage();
  const m = useMessages(messages);
  usePageTitle(service?.nombre, service?.descripcion);

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .service(slug, controller.signal)
      .then((response) => {
        setService(response.data);
        if (!response._offline) trackEvent('vista_servicio', { referenciaId: response.data.id });
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof CatalogApiError && requestError.status === 404
          ? 'notPublished'
          : 'loadError');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  const serviceMunicipality = service?.municipio;
  useEffect(() => {
    if (!serviceMunicipality) return undefined;
    const controller = new AbortController();
    catalogApi
      .places({ municipio: serviceMunicipality, limit: 12 }, controller.signal)
      .then((response) => setNearby(response.data))
      .catch(() => setNearby([]));
    return () => controller.abort();
  }, [serviceMunicipality]);

  if (loading) return <DetailSkeleton label={m.loading} />;

  if (error || !service) {
    return <DetailUnavailable title={m.unavailable} text={error ? m[error] : ''} to="/servicios" cta={m.backToServices} />;
  }

  const media = service.imagenPrincipal ? [service.imagenPrincipal] : [];
  const latitude = service.latitud ? Number(service.latitud) : null;
  const longitude = service.longitud ? Number(service.longitud) : null;
  const coordinates = latitude !== null && longitude !== null
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=15/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`
    : null;

  const details = ([
    [m.capacity, service.capacidadRequisitos, UsersIcon, 'teal'],
    [m.accessibility, service.accesibilidad, AccessIcon, 'teal'],
    [m.generalLocation, service.ubicacion, PinIcon, 'green'],
    [m.relatedPlaces, service.lugaresRelacionados, CompassIcon, 'gold'],
  ] as const).filter((item) => Boolean(item[1]));
  const typeText = service.tipoServicio || categoryLabel(service.categoria, lang) || m.fallbackType;
  const hasCoordinates = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const offers = [...new Set(activityTags(service.tipoServicio, 6))];
  const highlights = ([
    [TicketIcon, m.priceRange, service.rangoPrecio],
    [ClockIcon, m.schedule, service.horario],
    [UsersIcon, m.provider, service.prestador],
  ] as const).filter((item) => Boolean(item[2]));

  return (
    <article>
      <DetailHero
        images={media}
        categoria={service.categoria ?? service.tipoServicio}
        categoryText={categoryLabel(service.categoria, lang) || typeText}
        title={service.nombre}
        municipio={service.municipio}
        backTo="/servicios"
        backLabel={m.back}
        seed={service.id}
        actions={(
          <>
            <WhatsAppButton serviceName={service.nombre} serviceId={service.id} contacto={service.contacto} className="min-h-12 px-6" />
            <ShareButton title={service.nombre} text={service.descripcion ?? undefined} className="min-h-12 px-5" />
          </>
        )}
        highlights={highlights.length > 0 && (
          <div>
            {highlights.map(([Icon, label, value]) => <HeroFact key={label} icon={Icon} label={label}>{value}</HeroFact>)}
          </div>
        )}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-14 px-5 py-16 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-24">
        <div className="min-w-0 lg:col-span-7">
          <SectionHeading title={m.about} />
          <p className="mt-7 max-w-[40rem] whitespace-pre-line text-[17px] leading-8 text-brand-blue/75 sm:text-lg sm:leading-9">{service.descripcion || m.noDescription}</p>

          {service.rangoPrecio && (
            <div className="mt-10 max-w-[40rem] border-y border-brand-sand py-6">
              <p className="text-xs font-medium text-brand-gold">{m.priceRange}</p>
              <p className="font-display mt-2 text-xl leading-snug text-brand-blue sm:text-2xl">{service.rangoPrecio}</p>
            </div>
          )}

          {offers.length > 0 && (
            <section className="mt-16">
              <BlockTitle>{m.offers}</BlockTitle>
              <div className="mt-6">
                <AmenityGrid label={m.offers} items={offers.map((tag) => ({ icon: activityIcon(tag), text: tag }))} />
              </div>
            </section>
          )}

          {details.length > 0 && (
            <section className="mt-16">
              <BlockTitle>{m.goodToKnow}</BlockTitle>
              <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {details.map(([title, value, Icon, accent]) => (
                  <InfoBlock key={title} icon={Icon} title={title} accent={accent}>{value}</InfoBlock>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9">
          <div className="rounded-xl bg-brand-light p-6 sm:p-7">
            <WhatsAppButton serviceName={service.nombre} serviceId={service.id} contacto={service.contacto} size="lg" className="w-full" />
            <p className="mt-3 text-center text-xs text-brand-blue/70">{m.whatsappHint}</p>
          </div>

          <h2 className="mt-10 text-[1.75rem] leading-tight text-brand-blue">{m.practicalInfo}</h2>
          <dl className="mt-6 border-t border-brand-sand">
            {service.municipio && <PracticalItem label={m.municipality}>{service.municipio}</PracticalItem>}
            {service.prestador && <PracticalItem label={m.provider}>{service.prestador}</PracticalItem>}
            {service.horario && <PracticalItem label={m.schedule}>{service.horario}</PracticalItem>}
            {service.reservacion && <PracticalItem label={m.booking}>{service.reservacion}</PracticalItem>}
            {service.contacto && <PracticalItem label={m.contact}><span className="whitespace-pre-line">{service.contacto}</span></PracticalItem>}
          </dl>
          {coordinates && (
            <a href={coordinates} target="_blank" rel="noreferrer" className="btn btn-secondary mt-7 min-h-12 w-full">
              <MapIcon className="size-4" />
              {m.openLocation}
            </a>
          )}
          {hasCoordinates && (
            <div className="mt-12">
              <h2 className="text-xl leading-tight text-brand-blue">{m.currentWeather}</h2>
              <WeatherCard latitude={latitude} longitude={longitude} />
            </div>
          )}
        </aside>
      </div>

      {service.municipio && (
        <div className="pb-20 lg:pb-28">
          <RelatedRail
            eyebrow={m.keepExploring}
            title={m.nearbyPlaces(service.municipio)}
            items={nearby.map((item) => ({
              key: item.id,
              to: `/lugares/${item.slug}`,
              title: item.nombre,
              subtitle: item.municipio,
              categoria: item.categoria,
              categoryText: categoryLabel(item.categoria, lang),
              image: item.imagenPrincipal,
              seed: item.id,
            }))}
          />
        </div>
      )}
    </article>
  );
};
