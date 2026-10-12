import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import L, { type LatLngExpression } from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { catalogApi } from '../services/catalogApi';
import type { Category, Municipality, Place } from '../types/catalog';
import { travelApi, type RouteData, type RouteProfile } from '../services/travelApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { trackEvent } from '../services/feedbackApi';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel, common } from '../i18n/common';
import {
  AdventureIcon, ArrowRightIcon, CloseIcon, CompassIcon, MapIcon, PinIcon, RouteIcon,
} from '../components/brand/icons';
import { ItalicTail } from '../components/home/HomeUi';

const mapMessages = defineMessages({
  pageTitle: 'Mapa interactivo',
  pageDescription: 'Ubícate con GPS, encuentra lugares cercanos y traza rutas en la Sierra Gorda.',
  loadError: 'No pudimos cargar los lugares del mapa. Revisa tu conexión; el mapa base sigue disponible.',
  insecureContext: 'El GPS solo funciona en sitios seguros (https). Abre XploraSG desde su dirección segura para usar tu ubicación.',
  noGeolocation: 'Este dispositivo no ofrece geolocalización. Puedes explorar el mapa manualmente.',
  locationFound: (meters: number) => `Ubicación encontrada (precisión aproximada de ${meters} m).`,
  permissionDenied: 'No se concedió permiso para usar tu ubicación. Actívalo en la configuración del navegador y vuelve a intentarlo.',
  positionUnavailable: 'Tu ubicación no está disponible en este momento. Revisa que el GPS esté encendido.',
  timeout: 'La búsqueda de ubicación tardó demasiado. Intenta de nuevo en un lugar con mejor señal.',
  locationFailed: 'No fue posible obtener tu ubicación.',
  routeNeedsLocation: 'Activa tu ubicación antes de calcular una ruta.',
  routeNeedsDestination: 'Selecciona un destino con coordenadas verificadas.',
  routeUnavailable: 'El trazado de rutas dentro de XploraSG no está disponible por ahora.',
  routeBusy: 'El servicio de rutas está muy solicitado en este momento.',
  routeNoRoad: 'No encontramos un camino cercano a este destino.',
  routeFailed: 'No pudimos calcular la ruta en este momento.',
  straightLineNote: 'Distancia en línea recta y tiempo aproximado (las carreteras de la sierra son más largas). Para navegar usa Google Maps.',
  eyebrow: 'Ubícate y explora',
  title: 'Mapa de la Sierra Gorda',
  intro: 'Consulta municipios de referencia y, al publicarse, los lugares con coordenadas verificadas.',
  locating: 'Buscando ubicación…',
  useLocation: 'Usar mi ubicación',
  filterTitle: 'Filtrar el mapa',
  municipality: 'Municipio',
  allMunicipalities: 'Todos los municipios',
  category: 'Categoría',
  allCategories: 'Todas las categorías',
  allChip: 'Todas',
  legend: 'Leyenda',
  legendNature: 'Naturaleza',
  legendCulture: 'Cultura',
  legendAdventure: 'Aventura',
  legendMunicipality: 'Cabecera',
  legendNote: 'Los círculos con borde indican cabeceras municipales de referencia, no atractivos turísticos.',
  planRoute: 'Planear ruta',
  selectedDestination: 'Destino seleccionado',
  clearDestination: 'Quitar destino',
  routeType: 'Tipo de recorrido',
  byCar: 'En automóvil',
  byBike: 'En bicicleta',
  onFoot: 'A pie',
  hiking: 'Senderismo',
  calculating: 'Calculando…',
  drawRoute: 'Trazar ruta',
  distanceUnavailable: 'Distancia no disponible',
  routeFallback: 'No te preocupes: puedes abrir la ruta en tu app de mapas con un toque.',
  openGoogleMaps: 'Abrir en Google Maps',
  selectHint: 'Selecciona “Preparar ruta” en la ficha de un marcador publicado.',
  nearYou: 'Cerca de ti',
  nearHint: 'Activa tu ubicación para ordenar los sitios publicados por distancia.',
  noPlaces: 'Aún no hay lugares publicados con coordenadas verificadas.',
  loadingMap: 'Cargando mapa…',
  municipalReference: 'Referencia municipal',
  viewDetails: 'Ver detalles',
  prepareRoute: 'Preparar ruta',
  yourLocation: 'Tu ubicación aproximada',
  placesOnMap: (n: number) => (n === 1 ? '1 lugar en el mapa' : `${n} lugares en el mapa`),
  showPanel: 'Mostrar filtros',
  hidePanel: 'Ocultar filtros',
  panelLabel: 'Panel del mapa',
  distanceAway: (km: string) => `${km} km`,
  durationMin: (min: number) => `${min} min`,
  distanceLabel: 'Distancia',
  durationLabel: 'Tiempo estimado',
}, {
  pageTitle: 'Interactive map',
  pageDescription: 'Find yourself with GPS, discover nearby places and plan routes across the Sierra Gorda.',
  loadError: 'We couldn’t load the map places. Check your connection; the base map is still available.',
  insecureContext: 'GPS only works on secure sites (https). Open XploraSG from its secure address to use your location.',
  noGeolocation: 'This device doesn’t support geolocation. You can still explore the map manually.',
  locationFound: (meters: number) => `Location found (accurate to about ${meters} m).`,
  permissionDenied: 'Location permission wasn’t granted. Enable it in your browser settings and try again.',
  positionUnavailable: 'Your location isn’t available right now. Make sure GPS is turned on.',
  timeout: 'Finding your location took too long. Try again somewhere with a better signal.',
  locationFailed: 'We couldn’t get your location.',
  routeNeedsLocation: 'Turn on your location before calculating a route.',
  routeNeedsDestination: 'Choose a destination with verified coordinates.',
  routeUnavailable: 'In-app route planning isn’t available right now.',
  routeBusy: 'The routing service is very busy right now.',
  routeNoRoad: 'We couldn’t find a road near this destination.',
  routeFailed: 'We couldn’t calculate the route right now.',
  straightLineNote: 'Straight-line distance and approximate time (mountain roads are longer). Use Google Maps to navigate.',
  eyebrow: 'Find your way and explore',
  title: 'Sierra Gorda map',
  intro: 'See reference municipalities and, once published, places with verified coordinates.',
  locating: 'Finding your location…',
  useLocation: 'Use my location',
  filterTitle: 'Filter the map',
  municipality: 'Municipality',
  allMunicipalities: 'All municipalities',
  category: 'Category',
  allCategories: 'All categories',
  allChip: 'All',
  legend: 'Legend',
  legendNature: 'Nature',
  legendCulture: 'Culture',
  legendAdventure: 'Adventure',
  legendMunicipality: 'Municipal seat',
  legendNote: 'Outlined circles mark municipal seats for reference, not tourist attractions.',
  planRoute: 'Plan route',
  selectedDestination: 'Selected destination',
  clearDestination: 'Remove destination',
  routeType: 'Travel mode',
  byCar: 'By car',
  byBike: 'By bike',
  onFoot: 'On foot',
  hiking: 'Hiking',
  calculating: 'Calculating…',
  drawRoute: 'Get route',
  distanceUnavailable: 'Distance unavailable',
  routeFallback: 'No worries: you can open the route in your maps app with one tap.',
  openGoogleMaps: 'Open in Google Maps',
  selectHint: 'Tap “Plan route” in the popup of a published marker.',
  nearYou: 'Near you',
  nearHint: 'Turn on your location to sort published places by distance.',
  noPlaces: 'There are no published places with verified coordinates yet.',
  loadingMap: 'Loading map…',
  municipalReference: 'Municipal reference',
  viewDetails: 'View details',
  prepareRoute: 'Plan route',
  yourLocation: 'Your approximate location',
  placesOnMap: (n: number) => (n === 1 ? '1 place on the map' : `${n} places on the map`),
  showPanel: 'Show filters',
  hidePanel: 'Hide filters',
  panelLabel: 'Map panel',
  distanceAway: (km: string) => `${km} km`,
  durationMin: (min: number) => `${min} min`,
  distanceLabel: 'Distance',
  durationLabel: 'Estimated time',
});

const SIERRA_GORDA_CENTER: LatLngExpression = [21.22, -99.55];

// Colores de la paleta v3 para los trazos de Leaflet (no aceptan clases de Tailwind).
const INK = '#1F2C24';
const SAGE = '#6E8B6F';
const TERRACOTTA = '#9E552F';

const numberCoordinate = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const categoryKey = (category: string) => {
  const value = category.toLocaleLowerCase('es');
  if (value.includes('naturaleza')) return 'nature';
  if (value.includes('cultura') || value.includes('arqueolog')) return 'culture';
  if (value.includes('aventura')) return 'adventure';
  if (value.includes('gastronom')) return 'food';
  if (value.includes('hospedaje')) return 'lodging';
  return 'service';
};

// Iconos de línea (mismos trazos que components/brand/icons) en blanco dentro del marcador.
const markerGlyph: Record<string, string> = {
  nature: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
  culture: '<path d="M8 3.5h8M9 3.5v2c-2.6 1-4 3.2-4 6.2 0 4.3 2.9 7.8 7 7.8s7-3.5 7-7.8c0-3-1.4-5.2-4-6.2v-2"/><path d="M5.5 10.5h13M6 14.5h12"/>',
  adventure: '<path d="m2.5 19 6.2-10 3.3 5.2 2.4-3.7 7.1 8.5Z"/>',
  food: '<path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z"/><path d="M9 8.5c0-1.5 1-1.5 1-3M12.5 8.5c0-1.5 1-1.5 1-3M16 8.5c0-1.5 1-1.5 1-3"/>',
  lodging: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9.5h14V10"/><path d="M9.5 19.5v-5h5v5"/>',
  service: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
};

// Marcador sobrio: gota con borde blanco fino y sombra apenas perceptible; el destino elegido lleva un anillo terracota.
const placeIcon = (category: string, active: boolean) => {
  const key = categoryKey(category);
  const shadow = active
    ? 'box-shadow:0 0 0 3px #fff, 0 0 0 5px rgb(158 85 47 / .85), 0 6px 14px rgb(31 44 36 / .28);'
    : 'box-shadow:0 4px 10px rgb(31 44 36 / .22);';
  return L.divIcon({
    className: 'xplora-marker-wrap',
    html: `<span class="xplora-marker xplora-marker--${key}" style="width:34px;height:34px;border-width:2px;${shadow}"><b style="display:grid;place-items:center"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${markerGlyph[key]}</svg></b></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 39],
    popupAnchor: [0, -36],
  });
};

const municipalityIcon = L.divIcon({
  className: 'xplora-marker-wrap',
  html: '<span class="xplora-municipality-marker" style="width:22px;height:22px;border-width:2px;box-shadow:0 2px 6px rgb(31 44 36 / .2)"><span style="width:6px;height:6px"></span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

const distanceKm = (origin: [number, number], destination: [number, number]) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(destination[0] - origin[0]);
  const longitudeDelta = radians(destination[1] - origin[1]);
  const firstLatitude = radians(origin[0]);
  const secondLatitude = radians(destination[0]);
  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
};

const FocusLocation = ({ location }: { location: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo(location, 13, { duration: 1.2 });
  }, [location, map]);
  return null;
};

const FitRoute = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    // El panel ya no cubre el mapa (va a un lado): basta un margen uniforme.
    map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
};

// Al mostrar u ocultar el panel cambia el ancho del mapa: Leaflet debe recalcular su tamaño.
const KeepSize = () => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
};

type IconType = ComponentType<{ className?: string }>;

/** Bloque del panel con filete superior y título en serif. */
const PanelSection = ({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) => (
  <section className="border-t border-brand-sand px-5 py-6 sm:px-6">
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-xl font-normal text-brand-blue">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

const fieldLabel = 'label-quiet';

export const MapPage = () => {
  const m = useMessages(mapMessages);
  const c = useMessages(common);
  const { lang } = useLanguage();
  usePageTitle(m.pageTitle, m.pageDescription);
  const [places, setPlaces] = useState<Place[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [municipality, setMunicipality] = useState('');
  const [category, setCategory] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [destination, setDestination] = useState<Place | null>(null);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('driving-car');
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeError, setRouteError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  // Enlace directo desde Chatboot u otras pantallas: /mapa?lugar=<slug> centra el lugar y lo deja como destino.
  const [searchParams] = useSearchParams();
  const linkedSlug = searchParams.get('lugar');
  const [appliedLink, setAppliedLink] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      catalogApi.places({ limit: 100 }, controller.signal),
      catalogApi.municipalities(controller.signal),
      catalogApi.categories(controller.signal),
    ])
      .then(([placeResponse, municipalityResponse, categoryResponse]) => {
        setPlaces(placeResponse.data);
        setMunicipalities(municipalityResponse.data);
        setCategories(categoryResponse.data);
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(m.loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [m.loadError]);

  const mappedPlaces = useMemo(
    () => places.flatMap((place) => {
      const latitude = numberCoordinate(place.latitud);
      const longitude = numberCoordinate(place.longitud);
      return latitude === null || longitude === null ? [] : [{ place, latitude, longitude }];
    }),
    [places],
  );

  const filteredPlaces = useMemo(
    () => mappedPlaces.filter(({ place }) =>
      (!municipality || place.municipio === municipality) &&
      (!category || place.categoria === category)),
    [mappedPlaces, municipality, category],
  );

  const linkedPlace = useMemo(
    () => (linkedSlug ? mappedPlaces.find(({ place }) => place.slug === linkedSlug) ?? null : null),
    [mappedPlaces, linkedSlug],
  );
  const linkedPoint = useMemo<[number, number] | null>(
    () => (linkedPlace ? [linkedPlace.latitude, linkedPlace.longitude] : null),
    [linkedPlace],
  );
  // Se aplica una sola vez por enlace (derivado durante el render, sin efecto).
  if (linkedPlace && appliedLink !== linkedPlace.place.slug) {
    setAppliedLink(linkedPlace.place.slug);
    setDestination(linkedPlace.place);
    setPanelOpen(true);
  }

  const municipalityReferences = useMemo(
    () => municipalities.flatMap((item) => {
      if (municipality && item.nombre !== municipality) return [];
      const latitude = numberCoordinate(item.latitud);
      const longitude = numberCoordinate(item.longitud);
      return latitude === null || longitude === null ? [] : [{ item, latitude, longitude }];
    }),
    [municipalities, municipality],
  );

  const nearbyPlaces = useMemo(() => {
    if (!userLocation) return [];
    return filteredPlaces
      .map((item) => ({ ...item, distance: distanceKm(userLocation, [item.latitude, item.longitude]) }))
      .sort((first, second) => first.distance - second.distance)
      .slice(0, 5);
  }, [filteredPlaces, userLocation]);

  const requestLocation = () => {
    if (!window.isSecureContext) {
      setLocationMessage(m.insecureContext);
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage(m.noGeolocation);
      return;
    }
    setLocating(true);
    setLocationMessage('');

    const onSuccess = ({ coords }: GeolocationPosition) => {
      setUserLocation([coords.latitude, coords.longitude]);
      setLocationMessage(m.locationFound(Math.max(1, Math.round(coords.accuracy))));
      setLocating(false);
    };
    const messages: Record<number, string> = {
      1: m.permissionDenied,
      2: m.positionUnavailable,
      3: m.timeout,
    };
    // 1.º intento: GPS de alta precisión. Si falla por señal o tiempo, 2.º intento con red/wifi.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (firstError) => {
        if (firstError.code === firstError.PERMISSION_DENIED) {
          setLocationMessage(messages[1]);
          setLocating(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (secondError) => {
            setLocationMessage(messages[secondError.code] || m.locationFailed);
            setLocating(false);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  };

  const calculateRoute = async () => {
    const latitude = destination ? numberCoordinate(destination.latitud) : null;
    const longitude = destination ? numberCoordinate(destination.longitud) : null;
    if (!userLocation) {
      setRouteError(m.routeNeedsLocation);
      return;
    }
    if (!destination || latitude === null || longitude === null) {
      setRouteError(m.routeNeedsDestination);
      return;
    }

    setRouteLoading(true);
    setRouteError('');
    trackEvent('ruta', { referenciaId: destination.id });
    try {
      const response = await travelApi.route(
        { latitud: userLocation[0], longitud: userLocation[1] },
        { latitud: latitude, longitud: longitude },
        routeProfile,
      );
      setRoute(response.data);
    } catch (requestError) {
      // Respaldo sin servicio de rutas: trazo de referencia en línea recta y tiempo aproximado
      // (factor 1.4 por curvas de la sierra). Se avisa que es aproximado y se ofrece Google Maps.
      const straightKm = distanceKm(userLocation, [latitude, longitude]);
      const speedKmh = routeProfile === 'driving-car' ? 45 : routeProfile === 'cycling-regular' ? 14 : 4;
      setRoute({
        profile: routeProfile,
        distanceMeters: Math.round(straightKm * 1000),
        durationSeconds: Math.round(((straightKm * 1.4) / speedKmh) * 3600),
        geometry: { type: 'LineString', coordinates: [[userLocation[1], userLocation[0]], [longitude, latitude]] },
        isFallback: true,
        fallbackNotice: m.straightLineNote,
      });
      const message = requestError instanceof Error ? requestError.message : '';
      setRouteError(
        /clave|configur|api key|not configured/i.test(message)
          ? m.routeUnavailable
          : /límite|rate limit/i.test(message)
            ? m.routeBusy
            : /camino cercano|road near|nearby road/i.test(message)
              ? m.routeNoRoad
              : m.routeFailed,
      );
    } finally {
      setRouteLoading(false);
    }
  };

  const routePoints = useMemo<[number, number][]>(
    () => route?.geometry.coordinates.flatMap((coordinate) =>
      coordinate.length >= 2 ? [[coordinate[1], coordinate[0]] as [number, number]] : []) ?? [],
    [route],
  );

  const prepareRoute = (place: Place) => {
    setDestination(place);
    setRoute(null);
    setRouteError('');
    setPanelOpen(true);
  };

  const profiles: Array<{ value: RouteProfile; label: string; Icon: IconType }> = [
    { value: 'driving-car', label: m.byCar, Icon: RouteIcon },
    { value: 'cycling-regular', label: m.byBike, Icon: CompassIcon },
    { value: 'foot-walking', label: m.onFoot, Icon: PinIcon },
    { value: 'foot-hiking', label: m.hiking, Icon: AdventureIcon },
  ];

  const legendItems = [
    { label: m.legendNature, dot: 'bg-brand-green' },
    { label: m.legendCulture, dot: 'bg-brand-gold' },
    { label: m.legendAdventure, dot: 'bg-brand-teal' },
    { label: c.services, dot: 'bg-brand-blue' },
  ];

  // Chips discretos, como en el inicio: texto con borde fino; el activo en tinta.
  const chipClass = (active: boolean) =>
    `inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-[13px] transition-colors duration-300 ${
      active
        ? 'border-brand-blue bg-brand-blue text-white'
        : 'border-brand-blue/15 bg-transparent text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
    }`;

  const googleMapsUrl = destination?.latitud && destination.longitud
    ? `https://www.google.com/maps/dir/?api=1&destination=${destination.latitud},${destination.longitud}${userLocation ? `&origin=${userLocation[0]},${userLocation[1]}` : ''}&travelmode=${routeProfile.startsWith('foot') ? 'walking' : routeProfile.startsWith('cycling') ? 'bicycling' : 'driving'}`
    : null;

  const titleWords = lang === 'en' ? 1 : 2;
  const columnHeight = 'lg:h-[calc(100svh-150px)] lg:min-h-[620px] lg:max-h-[880px]';

  return (
    <>
      {/* Encabezado editorial */}
      <header className="mx-auto max-w-7xl px-5 pt-8 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-6 border-b border-brand-sand pb-7 md:flex-row md:items-end md:justify-between lg:pb-10">
          <div className="max-w-2xl">
            <p className="eyebrow">{m.eyebrow}</p>
            <h1 className="mt-5 text-[2.5rem] leading-[1.04] text-brand-blue sm:text-5xl lg:text-[3.5rem]">
              <ItalicTail text={m.title} words={titleWords} />
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-brand-blue/75">{m.intro}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <button type="button" onClick={requestLocation} disabled={locating} className="btn btn-primary min-h-12 px-6 disabled:cursor-wait">
              <PinIcon className={`size-4 ${locating ? 'animate-pulse' : ''}`} />
              {locating ? m.locating : m.useLocation}
            </button>
            <p className="text-xs text-brand-blue/70" aria-live="polite">{loading ? m.loadingMap : m.placesOnMap(filteredPlaces.length)}</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-6 lg:px-8 lg:pb-24 lg:pt-8">
        {(error || locationMessage) && (
          <div className="mb-6 grid gap-3">
            {error && <div role="alert" className="rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm font-medium text-clay-800">{error}</div>}
            {locationMessage && (
              <div role="status" className="flex items-start gap-3 border-l-2 border-brand-teal bg-brand-light px-4 py-3 text-sm text-brand-blue">
                <PinIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
                <span className="leading-6">{locationMessage}</span>
              </div>
            )}
          </div>
        )}

        <div className={`grid gap-6 ${panelOpen ? 'lg:grid-cols-[360px_minmax(0,1fr)]' : ''}`}>
          {/* Mapa (primero en móvil; a la derecha en escritorio) */}
          <div className={`relative order-1 h-[56vh] min-h-[380px] overflow-hidden rounded-xl border border-brand-blue/10 bg-brand-light lg:order-2 [&_.leaflet-bar]:overflow-hidden! [&_.leaflet-bar]:rounded-lg! [&_.leaflet-bar]:border! [&_.leaflet-bar]:border-brand-blue/15! [&_.leaflet-bar]:shadow-none! [&_.leaflet-bar_a]:text-brand-blue! ${columnHeight}`}>
            {loading && (
              <div className="absolute inset-0 z-[500] grid place-items-center bg-brand-paper/75">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-brand-sand bg-white px-4 py-2 text-sm text-brand-blue">
                  <span className="size-4 animate-spin rounded-full border-2 border-brand-blue/15 border-t-brand-green" aria-hidden="true" />
                  {m.loadingMap}
                </span>
              </div>
            )}
            <MapContainer center={SIERRA_GORDA_CENTER} zoom={9} minZoom={7} maxZoom={18} scrollWheelZoom className="size-full" zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="topright" />
              <KeepSize />
              <FocusLocation location={userLocation} />
              <FocusLocation location={linkedPoint} />
              <FitRoute points={routePoints} />

              {municipalityReferences.map(({ item, latitude, longitude }) => (
                <Marker key={`municipality-${item.id}`} position={[latitude, longitude]} icon={municipalityIcon} title={item.nombre}>
                  <Tooltip direction="top" offset={[0, -10]}>{item.nombre}</Tooltip>
                  <Popup>
                    <p className="text-xs font-medium text-brand-gold">{m.municipalReference}</p>
                    <strong className="font-display mt-1 block text-lg font-medium text-brand-blue">{item.nombre}</strong>
                  </Popup>
                </Marker>
              ))}

              {filteredPlaces.map(({ place, latitude, longitude }) => (
                <Marker key={place.id} position={[latitude, longitude]} icon={placeIcon(place.categoria, destination?.id === place.id)} title={place.nombre}>
                  <Popup>
                    <div className="min-w-52">
                      <p className="text-xs font-medium text-brand-gold">{categoryLabel(place.categoria, lang)}</p>
                      <strong className="font-display mt-1.5 block text-lg font-medium leading-snug text-brand-blue">{place.nombre}</strong>
                      <p className="mt-0.5 text-xs text-brand-blue/70">{place.municipio}</p>
                      <div className="mt-3 flex items-center gap-4 border-t border-brand-sand pt-3">
                        <button type="button" onClick={() => prepareRoute(place)} className="inline-flex min-h-8 items-center rounded-full bg-brand-blue px-3.5 text-xs font-medium text-white transition-colors duration-300 hover:bg-brand-green">
                          {m.prepareRoute}
                        </button>
                        <Link to={`/lugares/${place.slug}`} className="group inline-flex items-center gap-1 text-xs font-medium underline decoration-brand-green/30 underline-offset-4">{m.viewDetails}<ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {userLocation && (
                <>
                  <CircleMarker center={userLocation} radius={18} pathOptions={{ stroke: false, fillColor: SAGE, fillOpacity: 0.22 }} />
                  <CircleMarker center={userLocation} radius={7} pathOptions={{ color: '#ffffff', weight: 3, fillColor: SAGE, fillOpacity: 1 }}>
                    <Tooltip direction="top" offset={[0, -8]}>{m.yourLocation}</Tooltip>
                  </CircleMarker>
                </>
              )}
              {routePoints.length > 1 && (
                <>
                  <Polyline positions={routePoints} pathOptions={{ color: INK, weight: 8, opacity: 0.18 }} />
                  <Polyline positions={routePoints} pathOptions={{ color: TERRACOTTA, weight: 4, opacity: 1, dashArray: route?.isFallback ? '2 9' : undefined, lineCap: 'round' }} />
                </>
              )}
            </MapContainer>

            {/* Leyenda mínima sobre el mapa (escritorio) */}
            <div className="pointer-events-none absolute bottom-4 left-4 z-[400] hidden lg:block">
              <ul className="pointer-events-auto flex items-center gap-4 rounded-lg border border-brand-blue/10 bg-white px-3.5 py-2 text-[11px] text-brand-blue/70">
                {legendItems.map(({ label, dot }) => (
                  <li key={label} className="inline-flex items-center gap-1.5"><i className={`size-2 rounded-full ${dot}`} aria-hidden="true" />{label}</li>
                ))}
                <li className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full border border-brand-blue bg-white" aria-hidden="true" />{m.legendMunicipality}</li>
              </ul>
            </div>

            {!panelOpen && (
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                aria-expanded={false}
                aria-controls="map-panel"
                className="absolute left-4 top-4 z-[450] hidden min-h-10 items-center gap-2 rounded-full border border-brand-blue/15 bg-white px-4 text-sm text-brand-blue transition-colors duration-300 hover:border-brand-blue/40 lg:inline-flex"
              >
                <MapIcon className="size-4" />
                {m.showPanel}
                <span className="text-xs tabular-nums text-brand-blue/70">{filteredPlaces.length}</span>
              </button>
            )}
          </div>

          {/* Panel plano con secciones separadas por filetes */}
          <aside
            id="map-panel"
            aria-label={m.panelLabel}
            className={`order-2 flex flex-col overflow-hidden rounded-xl border border-brand-blue/10 bg-white lg:order-1 ${columnHeight} ${panelOpen ? '' : 'lg:hidden'}`}
          >
            <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-6 sm:px-6">
              <div>
                <h2 className="font-display text-2xl font-normal text-brand-blue">{m.filterTitle}</h2>
                <p className="mt-1 text-xs text-brand-blue/70">{m.placesOnMap(filteredPlaces.length)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-expanded={panelOpen}
                aria-controls="map-panel"
                aria-label={m.hidePanel}
                title={m.hidePanel}
                className="hidden size-9 shrink-0 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue lg:grid"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>

            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {/* Filtros */}
              <div className="grid gap-5 border-t border-brand-sand px-5 py-6 sm:px-6">
                <div className="grid gap-2">
                  <label className={fieldLabel} htmlFor="map-municipality">{m.municipality}</label>
                  <div className="relative">
                    <select id="map-municipality" value={municipality} onChange={(event) => setMunicipality(event.target.value)} className="field cursor-pointer appearance-none pr-10">
                      <option value="">{m.allMunicipalities}</option>
                      {municipalities.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
                    </select>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m7 10 5 5 5-5" /></svg>
                  </div>
                </div>
                <div className="grid gap-2.5">
                  <p id="map-category-label" className={fieldLabel}>{m.category}</p>
                  <div role="group" aria-labelledby="map-category-label" className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={chipClass(!category)} title={m.allCategories}>
                      {m.allChip}
                    </button>
                    {categories.map((item) => {
                      const active = category === item.nombre;
                      return (
                        <button key={item.id} type="button" aria-pressed={active} onClick={() => setCategory(active ? '' : item.nombre)} className={chipClass(active)}>
                          {categoryLabel(item.nombre, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Planear ruta */}
              <PanelSection title={m.planRoute}>
                {destination ? (
                  <div className="mt-4 grid gap-4">
                    <div className="flex items-start gap-3 border-y border-brand-sand py-3">
                      <div className="min-w-0 flex-1">
                        <p className={fieldLabel}>{m.selectedDestination}</p>
                        <p className="font-display mt-1 text-lg leading-snug text-brand-blue">{destination.nombre}</p>
                        <p className="text-xs text-brand-blue/70">{destination.municipio}</p>
                      </div>
                      <button type="button" onClick={() => { setDestination(null); setRoute(null); setRouteError(''); }} aria-label={m.clearDestination} title={m.clearDestination} className="grid size-8 shrink-0 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue">
                        <CloseIcon className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-2">
                      <p id="route-profile-label" className={fieldLabel}>{m.routeType}</p>
                      <div role="group" aria-labelledby="route-profile-label" className="grid grid-cols-2 gap-2">
                        {profiles.map(({ value, label, Icon }) => {
                          const active = routeProfile === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setRouteProfile(value)}
                              className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-[13px] transition-colors duration-300 ${
                                active ? 'border-brand-blue bg-brand-blue text-white' : 'border-brand-blue/15 text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
                              }`}
                            >
                              <Icon className="size-4 shrink-0" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button type="button" onClick={() => void calculateRoute()} disabled={routeLoading} className="btn btn-accent min-h-12 w-full rounded-lg">
                      {routeLoading ? m.calculating : m.drawRoute}
                    </button>

                    {route && (
                      <dl className="grid grid-cols-2 border-y border-brand-sand">
                        <div className="py-3 pr-3">
                          <dt className={fieldLabel}>{m.distanceLabel}</dt>
                          <dd className="font-display mt-1 text-2xl text-brand-blue">
                            {route.isFallback && '≈ '}{route.distanceMeters === null ? m.distanceUnavailable : m.distanceAway((route.distanceMeters / 1000).toFixed(1))}
                          </dd>
                        </div>
                        {route.durationSeconds !== null && (
                          <div className="border-l border-brand-sand py-3 pl-4">
                            <dt className={fieldLabel}>{m.durationLabel}</dt>
                            <dd className="font-display mt-1 text-2xl text-brand-blue">{route.isFallback && '≈ '}{m.durationMin(Math.round(route.durationSeconds / 60))}</dd>
                          </div>
                        )}
                        {route.fallbackNotice && (
                          <p className="col-span-2 border-t border-brand-sand py-3 text-xs leading-5 text-brand-blue/70">{route.fallbackNotice}</p>
                        )}
                      </dl>
                    )}
                    {routeError && (
                      <div role="status" className="border-l-2 border-brand-gold bg-brand-light px-4 py-3 text-[13px] leading-5 text-brand-blue">
                        <p className="font-medium">{routeError}</p>
                        <p className="mt-1 text-brand-blue/75">{m.routeFallback}</p>
                      </div>
                    )}
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn min-h-12 w-full rounded-lg ${routeError ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {m.openGoogleMaps}
                        <ArrowRightIcon className="size-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-brand-blue/70">{m.selectHint}</p>
                )}
              </PanelSection>

              {/* Cerca de ti */}
              <PanelSection
                title={m.nearYou}
                aside={nearbyPlaces.length ? <span className="text-xs tabular-nums text-brand-blue/70">{nearbyPlaces.length}</span> : undefined}
              >
                {!userLocation ? (
                  <p className="mt-3 text-sm leading-6 text-brand-blue/70">{m.nearHint}</p>
                ) : nearbyPlaces.length ? (
                  <ol className="mt-3 border-b border-brand-sand">
                    {nearbyPlaces.map(({ place, distance }, index) => (
                      <li key={place.id} className="border-t border-brand-sand">
                        <Link to={`/lugares/${place.slug}`} className="group flex items-baseline gap-3 py-3 transition-colors duration-300">
                          <span className="w-5 shrink-0 text-xs tabular-nums text-brand-gold">{String(index + 1).padStart(2, '0')}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-brand-blue transition-colors duration-300 group-hover:text-brand-green">{place.nombre}</span>
                            <span className="block truncate text-xs text-brand-blue/70">{place.municipio}</span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-brand-blue/75">{m.distanceAway(distance.toFixed(1))}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-brand-blue/70">{m.noPlaces}</p>
                )}
              </PanelSection>

              {/* Leyenda */}
              <PanelSection title={m.legend}>
                <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[13px] text-brand-blue/75">
                  {legendItems.map(({ label, dot }) => (
                    <li key={label} className="inline-flex items-center gap-2"><i className={`size-2 rounded-full ${dot}`} aria-hidden="true" />{label}</li>
                  ))}
                  <li className="inline-flex items-center gap-2"><i className="size-2 rounded-full border border-brand-blue bg-white" aria-hidden="true" />{m.legendMunicipality}</li>
                </ul>
                <p className="mt-4 text-xs leading-5 text-brand-blue/70">{m.legendNote}</p>
              </PanelSection>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};
