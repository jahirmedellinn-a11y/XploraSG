import { useEffect, useMemo, useState } from 'react';
import L, { type LatLngExpression } from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { catalogApi } from '../services/catalogApi';
import type { Category, Municipality, Place } from '../types/catalog';
import { travelApi, type RouteData, type RouteProfile } from '../services/travelApi';

const SIERRA_GORDA_CENTER: LatLngExpression = [21.22, -99.55];

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

const categorySymbol: Record<string, string> = {
  nature: 'N',
  culture: 'C',
  adventure: 'A',
  food: 'G',
  lodging: 'H',
  service: 'S',
};

const placeIcon = (category: string) => {
  const key = categoryKey(category);
  return L.divIcon({
    className: 'xplora-marker-wrap',
    html: `<span class="xplora-marker xplora-marker--${key}"><b>${categorySymbol[key]}</b></span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 43],
    popupAnchor: [0, -40],
  });
};

const municipalityIcon = L.divIcon({
  className: 'xplora-marker-wrap',
  html: '<span class="xplora-municipality-marker"><span></span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
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
    if (points.length > 1) map.fitBounds(points, { padding: [35, 35] });
  }, [map, points]);
  return null;
};

export const MapPage = () => {
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
        setError('No fue posible cargar los datos del mapa. Comprueba que el backend esté iniciado.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

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
    if (!navigator.geolocation) {
      setLocationMessage('Este dispositivo no ofrece geolocalización.');
      return;
    }
    setLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setLocationMessage('Ubicación encontrada.');
        setLocating(false);
      },
      (geoError) => {
        const messages: Record<number, string> = {
          1: 'No se concedió permiso para acceder a tu ubicación.',
          2: 'Tu ubicación no está disponible en este momento.',
          3: 'La búsqueda de ubicación tardó demasiado. Intenta de nuevo.',
        };
        setLocationMessage(messages[geoError.code] || 'No fue posible obtener tu ubicación.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  };

  const calculateRoute = async () => {
    const latitude = destination ? numberCoordinate(destination.latitud) : null;
    const longitude = destination ? numberCoordinate(destination.longitud) : null;
    if (!userLocation) {
      setRouteError('Activa tu ubicación antes de calcular una ruta.');
      return;
    }
    if (!destination || latitude === null || longitude === null) {
      setRouteError('Selecciona un destino con coordenadas verificadas.');
      return;
    }

    setRouteLoading(true);
    setRouteError('');
    try {
      const response = await travelApi.route(
        { latitud: userLocation[0], longitud: userLocation[1] },
        { latitud: latitude, longitud: longitude },
        routeProfile,
      );
      setRoute(response.data);
    } catch (requestError) {
      setRoute(null);
      setRouteError(requestError instanceof Error ? requestError.message : 'No fue posible calcular la ruta.');
    } finally {
      setRouteLoading(false);
    }
  };

  const routePoints = useMemo<[number, number][]>(
    () => route?.geometry.coordinates.flatMap((coordinate) =>
      coordinate.length >= 2 ? [[coordinate[1], coordinate[0]] as [number, number]] : []) ?? [],
    [route],
  );

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Ubícate y explora</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Mapa de la Sierra Gorda</h1>
          <p className="mt-3 max-w-2xl leading-7 text-stone-600">Consulta municipios de referencia y, al publicarse, los lugares con coordenadas verificadas.</p>
        </div>
        <button type="button" onClick={requestLocation} disabled={locating} className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full bg-emerald-950 px-5 text-sm font-black text-white shadow-sm hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
          <span aria-hidden="true">◎</span> {locating ? 'Buscando ubicación…' : 'Usar mi ubicación'}
        </button>
      </div>

      {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}
      {locationMessage && <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{locationMessage}</div>}

      <div className="grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(38,60,48,0.12)] lg:grid-cols-[320px_1fr]">
        <aside className="order-2 border-t border-stone-200 p-5 lg:order-1 lg:border-r lg:border-t-0">
          <h2 className="font-black">Filtrar el mapa</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-xs font-bold text-stone-600" htmlFor="map-municipality">Municipio</label>
            <select id="map-municipality" value={municipality} onChange={(event) => setMunicipality(event.target.value)} className="min-h-12 rounded-2xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold outline-none focus:border-emerald-700">
              <option value="">Todos los municipios</option>
              {municipalities.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
            </select>
            <label className="mt-2 text-xs font-bold text-stone-600" htmlFor="map-category">Categoría</label>
            <select id="map-category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 rounded-2xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold outline-none focus:border-emerald-700">
              <option value="">Todas las categorías</option>
              {categories.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
            </select>
          </div>

          <div className="mt-7 border-t border-stone-200 pt-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">Leyenda</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-stone-700">
              <span><i className="legend-dot bg-emerald-700" /> Naturaleza</span>
              <span><i className="legend-dot bg-amber-600" /> Cultura</span>
              <span><i className="legend-dot bg-orange-600" /> Aventura</span>
              <span><i className="legend-dot bg-sky-700" /> Servicios</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-stone-500">Los círculos con borde indican cabeceras municipales de referencia, no atractivos turísticos.</p>
          </div>

          <div className="mt-7 border-t border-stone-200 pt-5">
            <h2 className="font-black">Planear ruta</h2>
            {destination ? (
              <div className="mt-3">
                <p className="text-sm font-bold text-emerald-900">{destination.nombre}</p>
                <p className="mt-1 text-xs text-stone-500">Destino seleccionado</p>
                <label className="mt-4 block text-xs font-bold text-stone-600" htmlFor="route-profile">Tipo de recorrido</label>
                <select id="route-profile" value={routeProfile} onChange={(event) => setRouteProfile(event.target.value as RouteProfile)} className="mt-2 min-h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold">
                  <option value="driving-car">En automóvil</option>
                  <option value="cycling-regular">En bicicleta</option>
                  <option value="foot-walking">A pie</option>
                  <option value="foot-hiking">Senderismo</option>
                </select>
                <button type="button" onClick={() => void calculateRoute()} disabled={routeLoading} className="mt-3 w-full rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                  {routeLoading ? 'Calculando…' : 'Trazar ruta'}
                </button>
                {route && (
                  <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                    {route.distanceMeters === null ? 'Distancia no disponible' : `${(route.distanceMeters / 1000).toFixed(1)} km`}
                    {route.durationSeconds !== null && ` · ${Math.round(route.durationSeconds / 60)} min`}
                  </p>
                )}
                {routeError && (
                  <div role="alert" className="mt-3 text-xs font-semibold leading-5 text-red-700">
                    <p>
                      {routeError === 'El servicio de rutas aún no tiene configurada su clave.' 
                        ? 'El trazado interno de rutas no está disponible temporalmente por falta de configuración.'
                        : routeError.includes('tardó') || routeError.includes('conectar')
                          ? 'No se pudo conectar con el servicio de rutas. Verifica tu conexión a internet.'
                          : routeError}
                    </p>
                    {routeError.includes('aún no tiene configurada su clave') && destination.latitud && destination.longitud && (
                      <div className="mt-2">
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitud},${destination.longitud}${userLocation ? `&origin=${userLocation[0]},${userLocation[1]}` : ''}`} target="_blank" rel="noreferrer" className="block w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-center text-xs font-bold text-stone-700 hover:bg-stone-50 hover:text-emerald-700">
                          Abrir ruta en Google Maps
                        </a>
                        <p className="mt-2 text-center text-[10px] text-stone-500 font-normal leading-4">
                          (Esta alternativa abrirá otra aplicación y requiere conexión a internet)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-600">Selecciona “Preparar ruta” en la ficha de un marcador publicado.</p>
            )}
          </div>

          <div className="mt-7 border-t border-stone-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black">Cerca de ti</h2>
              <span className="text-xs font-bold text-stone-500">{nearbyPlaces.length || '—'}</span>
            </div>
            {!userLocation ? (
              <p className="mt-3 text-sm leading-6 text-stone-600">Activa tu ubicación para ordenar los sitios publicados por distancia.</p>
            ) : nearbyPlaces.length ? (
              <ol className="mt-3 grid gap-3">
                {nearbyPlaces.map(({ place, distance }) => (
                  <li key={place.id} className="rounded-2xl bg-stone-50 p-3">
                    <Link to={`/lugares/${place.slug}`} className="text-sm font-extrabold text-emerald-900 hover:underline">{place.nombre}</Link>
                    <p className="mt-1 text-xs text-stone-500">{distance.toFixed(1)} km · {place.municipio}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-600">Aún no hay lugares publicados con coordenadas verificadas.</p>
            )}
          </div>
        </aside>

        <div className="relative order-1 min-h-[62vh] bg-emerald-50 lg:order-2 lg:min-h-[720px]">
          {loading && <div className="absolute inset-0 z-[500] grid place-items-center bg-emerald-50/90"><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-900 shadow">Cargando mapa…</span></div>}
          <MapContainer center={SIERRA_GORDA_CENTER} zoom={9} minZoom={7} maxZoom={18} scrollWheelZoom className="size-full min-h-[62vh] lg:min-h-[720px]" zoomControl>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FocusLocation location={userLocation} />
            <FitRoute points={routePoints} />

            {municipalityReferences.map(({ item, latitude, longitude }) => (
              <Marker key={`municipality-${item.id}`} position={[latitude, longitude]} icon={municipalityIcon}>
                <Tooltip direction="top" offset={[0, -10]}>{item.nombre}</Tooltip>
                <Popup><strong>{item.nombre}</strong><br /><span>Referencia municipal</span></Popup>
              </Marker>
            ))}

            {filteredPlaces.map(({ place, latitude, longitude }) => (
              <Marker key={place.id} position={[latitude, longitude]} icon={placeIcon(place.categoria)}>
                <Popup>
                  <div className="min-w-44">
                    <p className="text-xs font-bold text-emerald-700">{place.categoria}</p>
                    <strong className="mt-1 block text-base">{place.nombre}</strong>
                    <p className="mt-1 text-xs text-stone-500">{place.municipio}</p>
                    <Link to={`/lugares/${place.slug}`} className="mt-3 inline-block font-bold text-emerald-800">Ver detalles →</Link>
                    <button type="button" onClick={() => { setDestination(place); setRoute(null); setRouteError(''); }} className="ml-3 mt-3 font-bold text-emerald-800">Preparar ruta</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {userLocation && (
              <CircleMarker center={userLocation} radius={9} pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#2563eb', fillOpacity: 1 }}>
                <Tooltip direction="top" offset={[0, -8]}>Tu ubicación aproximada</Tooltip>
              </CircleMarker>
            )}
            {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: '#f97316', weight: 6, opacity: 0.9 }} />}
          </MapContainer>
        </div>
      </div>
    </section>
  );
};

