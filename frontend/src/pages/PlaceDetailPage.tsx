import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogApiError, catalogApi } from '../services/catalogApi';
import type { Place } from '../types/catalog';
import { FavoriteButton } from '../components/FavoriteButton';
import { WeatherCard } from '../components/WeatherCard';
import { activityTags, isClosedNotice } from '../utils/text';
import { usePageTitle } from '../hooks/usePageTitle';
import { trackEvent } from '../services/feedbackApi';
import { ShareButton } from '../components/ShareButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel, common } from '../i18n/common';
import { AdventureIcon, LodgingIcon, MapIcon, RouteIcon, SparkleIcon, WifiOffIcon } from '../components/brand/icons';
import { AccessIcon, ClockIcon, ExternalIcon, MountainIcon, NavigationIcon, TicketIcon } from '../components/ui/LineIcons';
import { AmenityGrid, BlockTitle, DetailHero, DetailSkeleton, DetailUnavailable, HeroFact, InfoBlock, PracticalItem, SectionHeading } from '../components/ui/DetailParts';
import { RelatedRail } from '../components/ui/RelatedRail';
import { activityIcon } from '../components/ui/activityIcons';

const messages = defineMessages({
  notPublished: 'Este lugar todavía no está publicado.',
  loadError: 'No fue posible cargar la información del lugar.',
  loading: 'Cargando lugar…',
  unavailable: 'Información no disponible',
  back: 'Volver',
  offline: (date: string) => `Sin conexión (Actualizado: ${date})`,
  about: 'Acerca de este lugar',
  noDescription: 'La descripción verificada estará disponible próximamente.',
  notice: 'Aviso:',
  activities: 'Actividades',
  howToVisit: 'Cómo visitarlo',
  availableServices: 'Servicios disponibles',
  accessibility: 'Accesibilidad',
  recommendations: 'Recomendaciones',
  practicalInfo: 'Datos prácticos',
  municipality: 'Municipio',
  address: 'Dirección',
  schedule: 'Horario',
  cost: 'Costo',
  contact: 'Contacto',
  altitude: 'Altitud',
  altitudeUnit: 'm s. n. m.',
  directions: 'Cómo llegar (GPS)',
  openStreetMap: 'Ver en OpenStreetMap',
  currentWeather: 'Clima actual',
  whatToDo: 'Qué puedes hacer',
  goodToKnow: 'Antes de ir',
  directionsShort: 'Cómo llegar',
  keepExploring: 'Sigue explorando',
  otherPlaces: (municipio: string) => `Otros lugares en ${municipio}`,
}, {
  notPublished: 'This place has not been published yet.',
  loadError: 'We couldn’t load the information for this place.',
  loading: 'Loading place…',
  unavailable: 'Information unavailable',
  back: 'Back',
  offline: (date: string) => `Offline (Updated: ${date})`,
  about: 'About this place',
  noDescription: 'A verified description will be available soon.',
  notice: 'Notice:',
  activities: 'Activities',
  howToVisit: 'How to visit',
  availableServices: 'Available services',
  accessibility: 'Accessibility',
  recommendations: 'Recommendations',
  practicalInfo: 'Practical info',
  municipality: 'Municipality',
  address: 'Address',
  schedule: 'Hours',
  cost: 'Cost',
  contact: 'Contact',
  altitude: 'Altitude',
  altitudeUnit: 'm above sea level',
  directions: 'Get directions (GPS)',
  openStreetMap: 'View on OpenStreetMap',
  currentWeather: 'Current weather',
  whatToDo: 'Things to do',
  goodToKnow: 'Before you go',
  directionsShort: 'Get directions',
  keepExploring: 'Keep exploring',
  otherPlaces: (municipio: string) => `More places in ${municipio}`,
});

export const PlaceDetailPage = () => {
  const { slug = '' } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'' | 'notPublished' | 'loadError'>('');
  const [offline, setOffline] = useState(false);
  const [storedAt, setStoredAt] = useState('');
  const [related, setRelated] = useState<Place[]>([]);
  const { lang, locale } = useLanguage();
  const m = useMessages(messages);
  const c = useMessages(common);
  usePageTitle(place?.nombre, place?.descripcion);

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .place(slug, controller.signal)
      .then((response) => {
        setPlace(response.data);
        if (!response._offline) trackEvent('vista_lugar', { referenciaId: response.data.id });
        if (response._offline) {
          setOffline(true);
          setStoredAt(response._storedAt!);
        } else {
          setOffline(false);
        }
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

  const placeId = place?.id;
  const placeMunicipality = place?.municipio;
  useEffect(() => {
    if (!placeMunicipality) return undefined;
    const controller = new AbortController();
    catalogApi
      .places({ municipio: placeMunicipality, limit: 12 }, controller.signal)
      .then((response) => setRelated(response.data.filter((item) => item.id !== placeId)))
      .catch(() => setRelated([]));
    return () => controller.abort();
  }, [placeId, placeMunicipality]);

  if (loading) return <DetailSkeleton label={m.loading} />;

  if (error || !place) {
    return <DetailUnavailable title={m.unavailable} text={error ? m[error] : ''} to="/explorar" cta={c.backToExplore} />;
  }

  const offlineDate = storedAt ? new Date(storedAt).toLocaleString(locale) : '';
  const media = place.multimedia?.length ? place.multimedia : place.imagenPrincipal ? [place.imagenPrincipal] : [];
  const coordinates = place.latitud && place.longitud
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(place.latitud)}&mlon=${encodeURIComponent(place.longitud)}#map=15/${encodeURIComponent(place.latitud)}/${encodeURIComponent(place.longitud)}`
    : null;
  const latitude = place.latitud ? Number(place.latitud) : null;
  const longitude = place.longitud ? Number(place.longitud) : null;
  const tags = activityTags(place.actividades, 6);
  const visitDetails = ([
    [m.activities, tags.length ? null : place.actividades, AdventureIcon, 'green'],
    [m.availableServices, place.serviciosDisponibles, LodgingIcon, 'teal'],
    [m.accessibility, place.accesibilidad, AccessIcon, 'teal'],
    [m.recommendations, place.recomendaciones, SparkleIcon, 'gold'],
  ] as const).filter((item) => Boolean(item[1]));
  const hasCoordinates = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const directionsUrl = hasCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` : null;
  const category = categoryLabel(place.categoria, lang);
  const highlights = ([
    [ClockIcon, m.schedule, place.horarios],
    [TicketIcon, m.cost, place.costo],
    [MountainIcon, m.altitude, place.altitud ? `${place.altitud.toLocaleString(locale)} ${m.altitudeUnit}` : null],
    [MapIcon, m.address, place.direccion],
  ] as const).filter((item) => Boolean(item[2])).slice(0, 3);

  return (
    <article>
      <DetailHero
        images={media}
        categoria={place.categoria}
        categoryText={category}
        title={place.nombre}
        municipio={place.municipio}
        backTo="/explorar"
        backLabel={m.back}
        seed={place.id}
        notice={offline && (
          <span className="inline-flex items-center gap-2 rounded-full border border-ochre-300 bg-ochre-50 px-3 py-1 text-xs font-medium text-ochre-900">
            <WifiOffIcon className="size-4" />
            {m.offline(offlineDate)}
          </span>
        )}
        actions={(
          <>
            {directionsUrl && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent min-h-12 px-6">
                <NavigationIcon className="size-4" />
                {m.directionsShort}
              </a>
            )}
            <ShareButton title={place.nombre} text={place.descripcion ?? undefined} className="min-h-12 px-5" />
            <FavoriteButton placeId={place.id} size="lg" />
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
          <p className="mt-7 max-w-[40rem] whitespace-pre-line text-[17px] leading-8 text-brand-blue/75 sm:text-lg sm:leading-9">{place.descripcion || m.noDescription}</p>
          {isClosedNotice(place.horarios) && (
            <p role="status" className="mt-6 max-w-[40rem] rounded-lg border border-clay-200 bg-clay-50 px-5 py-4 text-sm font-medium text-clay-800">
              {m.notice} {place.horarios}
            </p>
          )}

          {tags.length > 0 && (
            <section className="mt-16">
              <BlockTitle>{m.whatToDo}</BlockTitle>
              <div className="mt-6">
                <AmenityGrid label={m.activities} items={tags.map((tag) => ({ icon: activityIcon(tag), text: tag }))} />
              </div>
            </section>
          )}

          {place.infoAcceso && (
            <section className="mt-16 rounded-xl bg-brand-light px-6 py-8 sm:px-10 sm:py-10">
              <p className="flex items-center gap-3 text-brand-gold">
                <RouteIcon className="size-5" />
                <span className="text-[11px] font-medium uppercase tracking-[0.2em]">{m.directionsShort}</span>
              </p>
              <h2 className="mt-3 text-2xl leading-tight text-brand-blue sm:text-[1.75rem]">{m.howToVisit}</h2>
              <p className="mt-4 max-w-[38rem] whitespace-pre-line text-[15px] leading-8 text-brand-blue/75">{place.infoAcceso}</p>
            </section>
          )}

          {visitDetails.length > 0 && (
            <section className="mt-16">
              <BlockTitle>{m.goodToKnow}</BlockTitle>
              <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {visitDetails.map(([title, value, Icon, accent]) => (
                  <InfoBlock key={title} icon={Icon} title={title} accent={accent}>{value}</InfoBlock>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9">
          <h2 className="text-[1.75rem] leading-tight text-brand-blue">{m.practicalInfo}</h2>
          <dl className="mt-6 border-t border-brand-sand">
            <PracticalItem label={m.municipality}>{place.municipio}</PracticalItem>
            {place.direccion && <PracticalItem label={m.address}>{place.direccion}</PracticalItem>}
            {place.horarios && <PracticalItem label={m.schedule}>{place.horarios}</PracticalItem>}
            {place.costo && <PracticalItem label={m.cost}>{place.costo}</PracticalItem>}
            {place.contacto && <PracticalItem label={m.contact}>{place.contacto}</PracticalItem>}
            {place.altitud && <PracticalItem label={m.altitude}>{place.altitud.toLocaleString(locale)} {m.altitudeUnit}</PracticalItem>}
          </dl>
          {directionsUrl && (
            <div className="mt-7 grid gap-3">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent min-h-12 w-full">
                <NavigationIcon className="size-4" />
                {m.directions}
              </a>
              {coordinates && (
                <a href={coordinates} target="_blank" rel="noopener noreferrer" className="btn btn-secondary min-h-12 w-full">
                  <ExternalIcon className="size-4" />
                  {m.openStreetMap}
                </a>
              )}
            </div>
          )}
          {hasCoordinates && (
            <div className="mt-12">
              <h2 className="text-xl leading-tight text-brand-blue">{m.currentWeather}</h2>
              <WeatherCard latitude={latitude} longitude={longitude} altitude={place.altitud} />
            </div>
          )}
        </aside>
      </div>

      <div className="pb-20 lg:pb-28">
        <RelatedRail
          eyebrow={m.keepExploring}
          title={m.otherPlaces(place.municipio)}
          items={related.map((item) => ({
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
    </article>
  );
};
