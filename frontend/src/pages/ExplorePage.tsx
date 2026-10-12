/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PlaceCard } from '../components/PlaceCard';
import { ServiceCard } from '../components/ServiceCard';
import { catalogApi } from '../services/catalogApi';
import type { Category, Municipality, Place, TourismService } from '../types/catalog';
import { usePageTitle } from '../hooks/usePageTitle';
import { trackEvent } from '../services/feedbackApi';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel, common } from '../i18n/common';
import { CloseIcon } from '../components/brand/icons';
import { HomeHero } from '../components/home/HomeHero';
import { HomeSearchBar } from '../components/home/HomeSearchBar';
import { HomeIntro } from '../components/home/HomeIntro';
import { HomeDestinations } from '../components/home/HomeDestinations';
import { HomeThemes } from '../components/home/HomeThemes';
import { HomeFinalCta } from '../components/home/HomeFinalCta';
import { HomeHeading, TextLink } from '../components/home/HomeUi';
import { homeMessages } from '../i18n/home';
import { firstWithPhoto, openAssistant, pickHeroSlides, pickMosaic } from '../components/home/homeData';

const messages = defineMessages({
  pageTitle: 'Turismo en la Sierra Gorda de Querétaro',
  pageDescription: 'Descubre lugares, misiones, cascadas, prestadores locales y rutas de la Sierra Gorda de Querétaro.',
  loadError: 'No fue posible conectar con el catálogo ni recuperar una versión guardada.',
  searchLabel: 'Buscar lugar',
  searchPlaceholder: '¿Qué quieres conocer? Cascadas, misiones, miradores…',
  municipality: 'Municipio',
  allMunicipalities: 'Todos los municipios',
  search: 'Buscar',
  popular: 'Populares:',
  popularTerms: ['Cascada', 'Misión', 'Mirador', 'Río'],
  placesEyebrow: 'Explora el territorio',
  placesTitle: 'Lugares para conocer',
  placesText: 'Fichas verificadas de los atractivos de los seis municipios, con las actividades que puedes realizar en cada uno.',
  viewOnMap: 'Ver en el mapa',
  category: 'Categoría',
  allCategories: 'Todas',
  allCategoriesLong: 'Todas las categorías',
  clearFiltersX: 'Limpiar filtros',
  clearFilters: 'Limpiar filtros',
  results: (n: number, term: string) => `${n} ${n === 1 ? 'lugar' : 'lugares'}${term ? ` para “${term}”` : ''}`,
  offline: (date: string) => `Modo sin conexión · catálogo guardado el ${date}`,
  loadMore: 'Cargar más',
  emptyTitle: 'No encontramos lugares con esos filtros',
  emptyText: 'Prueba con otra palabra, otro municipio o pregúntale a Chatboot.',
  askAssistant: 'Preguntar a Chatboot',
  providersEyebrow: 'Economía local',
  providersTitle: 'Prestadores de servicios comunitarios',
  providersText: 'Hospedaje, alimentos, guías y experiencias operadas por gente de la Sierra. Contáctalos directamente para reservar.',
  allServices: 'Ver todos los servicios',
  allServicesCount: (n: number) => `Ver los ${n} servicios`,
  providersEmpty: 'El directorio de prestadores se está actualizando.',
}, {
  pageTitle: 'Tourism in the Sierra Gorda of Querétaro',
  pageDescription: 'Discover places, missions, waterfalls, local businesses and routes in the Sierra Gorda of Querétaro.',
  loadError: 'We couldn’t reach the catalog or load a saved copy.',
  searchLabel: 'Search places',
  searchPlaceholder: 'What would you like to see? Waterfalls, missions, viewpoints…',
  municipality: 'Municipality',
  allMunicipalities: 'All municipalities',
  search: 'Search',
  popular: 'Popular:',
  popularTerms: ['Waterfall', 'Mission', 'Viewpoint', 'River'],
  placesEyebrow: 'Explore the region',
  placesTitle: 'Places to visit',
  placesText: 'Verified listings of attractions across the six municipalities, with the activities you can enjoy at each one.',
  viewOnMap: 'View on the map',
  category: 'Category',
  allCategories: 'All',
  allCategoriesLong: 'All categories',
  clearFiltersX: 'Clear filters',
  clearFilters: 'Clear filters',
  results: (n: number, term: string) => `${n} ${n === 1 ? 'place' : 'places'}${term ? ` for “${term}”` : ''}`,
  offline: (date: string) => `Offline mode · catalog saved on ${date}`,
  loadMore: 'Load more',
  emptyTitle: 'No places match those filters',
  emptyText: 'Try another word or municipality, or ask Chatboot.',
  askAssistant: 'Ask Chatboot',
  providersEyebrow: 'Local economy',
  providersTitle: 'Community tourism businesses',
  providersText: 'Lodging, food, guides and experiences run by people from the Sierra. Contact them directly to book.',
  allServices: 'See all services',
  allServicesCount: (n: number) => `See all ${n} services`,
  providersEmpty: 'The local business directory is being updated.',
});

const PAGE_SIZE = 24;
const HOME_SERVICES = 6;
const MOSAIC_SIZE = 9;

export const ExplorePage = () => {
  const m = useMessages(messages);
  const c = useMessages(common);
  const h = useMessages(homeMessages);
  const { lang, locale } = useLanguage();
  usePageTitle(m.pageTitle, m.pageDescription);
  const [places, setPlaces] = useState<Place[]>([]);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [services, setServices] = useState<TourismService[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [municipality, setMunicipality] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storedAt, setStoredAt] = useState('');
  const [presentCategories, setPresentCategories] = useState<string[]>([]);
  const [catalogSample, setCatalogSample] = useState<Place[]>([]);

  // Filtros y prestadores (una sola vez)
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([catalogApi.municipalities(controller.signal), catalogApi.categories(controller.signal)])
      .then(([municipalityResponse, categoryResponse]) => {
        setMunicipalities(municipalityResponse.data);
        setCategories(categoryResponse.data);
      })
      .catch(() => undefined);
    catalogApi
      .services({ limit: 50 }, controller.signal)
      .then((response) => setServices(response.data))
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setServicesLoading(false);
      });
    return () => controller.abort();
  }, []);

  const loadPlaces = useCallback(
    (currentPage: number, append: boolean, signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      return catalogApi
        .places(
          { municipio: municipality || undefined, categoria: category || undefined, q: search || undefined, page: currentPage, limit: PAGE_SIZE },
          signal,
        )
        .then((response) => {
          setPlaces((previous) => (append ? [...previous, ...response.data] : response.data));
          setTotalPlaces(response.pagination.total);
          setHasMore(response.pagination.page * response.pagination.limit < response.pagination.total);
          setStoredAt(response._offline && response._storedAt ? response._storedAt : '');
          if (!municipality && !category && !search && currentPage === 1) {
            setPresentCategories([...new Set(response.data.map((place) => place.categoria))]);
            setCatalogSample(response.data);
          }
        })
        .catch((requestError) => {
          if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
          setError(true);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [municipality, category, search],
  );

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    void loadPlaces(1, false, controller.signal);
    return () => controller.abort();
  }, [loadPlaces]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadPlaces(nextPage, true);
  };

  const scrollToPlaces = () => document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    if (searchInput.trim()) trackEvent('busqueda', { termino: searchInput.trim() });
    scrollToPlaces();
  };

  const quickSearch = (term: string) => {
    setSearchInput(term);
    setSearch(term);
    trackEvent('busqueda', { termino: term });
    scrollToPlaces();
  };

  const selectCategory = (name: string) => {
    setCategory((current) => (current === name ? '' : name));
    scrollToPlaces();
  };

  const clearFilters = () => {
    setMunicipality('');
    setCategory('');
    setSearch('');
    setSearchInput('');
  };

  const pool = catalogSample.length ? catalogSample : places;
  const heroSlides = useMemo(() => pickHeroSlides(pool), [pool]);
  const mosaicPlaces = useMemo(() => pickMosaic(pool, heroSlides, MOSAIC_SIZE), [pool, heroSlides]);
  const finalPlace = useMemo(
    () => firstWithPhoto(pool, () => true, new Set(), ['presa-jalpan', 'las-adjuntas', 'neblinas']) ?? pool[0] ?? null,
    [pool],
  );

  const offlineDate = storedAt ? new Date(storedAt).toLocaleString(locale) : '';
  const filtersActive = Boolean(municipality || category || search);
  const filterCategories = categories.filter((item) => !presentCategories.length || presentCategories.includes(item.nombre));

  const chipClass = (active: boolean) => `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
    active ? 'border-brand-blue bg-brand-blue text-white' : 'border-brand-blue/15 bg-transparent text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
  }`;

  return (
    <>
      {/* 1 · Hero editorial con fotografía */}
      <HomeHero slides={heroSlides} />

      {/* 2 · Buscador */}
      <HomeSearchBar
        title={h.searchTitle}
        labels={m}
        value={searchInput}
        onValueChange={setSearchInput}
        municipality={municipality}
        onMunicipalityChange={setMunicipality}
        category={category}
        onCategoryChange={setCategory}
        municipalities={municipalities}
        categories={filterCategories}
        onSubmit={handleSearch}
        onQuickSearch={quickSearch}
      />

      {/* 3 · Declaración y razones */}
      <HomeIntro />

      {/* 4 · Destinos imperdibles (mosaico) */}
      <HomeDestinations places={mosaicPlaces} />

      {/* 5 · Temas */}
      <HomeThemes
        places={pool}
        services={services}
        categories={categories}
        presentCategories={presentCategories}
        activeCategory={category}
        onSelectCategory={selectCategory}
      />

      {/* 6 · Cómo funciona */}

      {/* 7 · Lugares */}
      <section id="lugares" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="home-places">
        <HomeHeading
          id="home-places"
          eyebrow={m.placesEyebrow}
          title={m.placesTitle}
          text={m.placesText}
          action={<TextLink to="/mapa">{m.viewOnMap}</TextLink>}
        />

        <div className="mt-10 flex flex-col gap-4 border-y border-brand-sand py-4 lg:flex-row lg:items-center">
          <div role="group" aria-label={m.category} className="snap-rail -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
            <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={chipClass(!category)}>
              {m.allCategories}
            </button>
            {filterCategories.map((item) => {
              const active = category === item.nombre;
              return (
                <button key={item.id} type="button" aria-pressed={active} onClick={() => setCategory(active ? '' : item.nombre)} className={chipClass(active)}>
                  {categoryLabel(item.nombre, lang)}
                </button>
              );
            })}
            {municipality && (
              <button type="button" onClick={() => setMunicipality('')} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-green/40 bg-brand-green/5 px-4 py-2 text-sm text-brand-green transition-colors duration-300 hover:bg-brand-green/10">
                {municipality}
                <CloseIcon className="size-3.5 opacity-70" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 lg:ml-auto">
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm text-brand-blue/75 underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:text-brand-blue">
                <CloseIcon className="size-3.5" />
                {m.clearFiltersX}
              </button>
            )}
            <p className="whitespace-nowrap text-sm text-brand-blue/70" aria-live="polite">
              {loading ? c.loading : m.results(totalPlaces, search)}
            </p>
          </div>
        </div>

        {offlineDate && (
          <p role="status" className="mt-6 inline-flex rounded-full border border-ochre-300 bg-ochre-50 px-4 py-2 text-sm font-medium text-ochre-900">
            {m.offline(offlineDate)}
          </p>
        )}
        {error && <div role="alert" className="mt-8 rounded-xl border border-clay-200 bg-clay-50 p-4 text-sm font-medium text-clay-800">{m.loadError}</div>}

        {loading && !places.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-[26rem] animate-pulse rounded-xl bg-brand-sand/50" />)}
          </div>
        ) : places.length ? (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
              {places.map((place) => <PlaceCard key={place.id} place={place} />)}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button type="button" onClick={loadMore} disabled={loading} className="btn btn-secondary min-h-12 px-9">
                  {loading ? c.loading : m.loadMore}
                </button>
              </div>
            )}
          </>
        ) : (
          !error && (
            <div className="mt-10 rounded-xl bg-brand-light px-6 py-16 text-center">
              <h3 className="font-display text-2xl text-brand-blue">{m.emptyTitle}</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-brand-blue/70">{m.emptyText}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {filtersActive && (
                  <button type="button" onClick={clearFilters} className="btn btn-primary">{m.clearFilters}</button>
                )}
                <button type="button" onClick={openAssistant} className="btn btn-secondary">{m.askAssistant}</button>
              </div>
            </div>
          )
        )}
      </section>

      {/* 8 · Prestadores locales */}
      <section id="prestadores" className="scroll-mt-24 bg-brand-light" aria-labelledby="home-providers">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          {/* Sin icono en este enlace: el primer enlace con ícono de la sección es el de WhatsApp. */}
          <HomeHeading
            id="home-providers"
            eyebrow={m.providersEyebrow}
            title={m.providersTitle}
            text={m.providersText}
            action={<TextLink to="/servicios" arrow={false}>{m.allServices}</TextLink>}
          />
          {servicesLoading ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
              {[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-xl bg-brand-sand/60" />)}
            </div>
          ) : services.length ? (
            <>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
                {services.slice(0, HOME_SERVICES).map((service) => <ServiceCard key={service.id} service={service} />)}
              </div>
              {services.length > HOME_SERVICES && (
                <div className="mt-12 flex justify-center">
                  <Link to="/servicios" className="btn btn-primary min-h-12 px-9">{m.allServicesCount(services.length)}</Link>
                </div>
              )}
            </>
          ) : (
            <p className="mt-12 rounded-xl border border-dashed border-brand-blue/20 p-8 text-center text-sm text-brand-blue/70">
              {m.providersEmpty}
            </p>
          )}
        </div>
      </section>

      {/* 9 · Cierre */}
      <HomeFinalCta photo={finalPlace?.imagenPrincipal?.url ?? null} name={finalPlace?.nombre} />
    </>
  );
};
