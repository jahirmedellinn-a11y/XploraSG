import { useState, useEffect } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { PlaceCard } from '../components/PlaceCard';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { catalogApi } from '../services/catalogApi';
import type { Place } from '../types/catalog';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useMessages } from '../i18n';
import { ItalicTail, TextLink } from '../components/home/HomeUi';
import { PageHero } from '../components/ui/PageHero';

const messages = defineMessages({
  pageTitle: 'Mis favoritos',
  title: 'Tus Favoritos',
  subtitle: 'Lugares que has guardado para visitar.',
  loading: 'Cargando favoritos...',
  emptyTitle: 'Tus favoritos están vacíos',
  emptyText: 'Explora la Sierra Gorda y guarda los lugares que te gustaría visitar presionando el ícono de corazón.',
  localNote: 'Tus favoritos se guardan en este dispositivo.',
  signIn: 'Inicia sesión',
  syncNote: 'para sincronizarlos en todos tus dispositivos.',
  explorePlaces: 'Explorar lugares',
  eyebrow: 'Tu viaje',
  openMap: 'Ver en el mapa',
  count: (n: number) => `${n} ${n === 1 ? 'lugar guardado' : 'lugares guardados'}`,
  savedLabel: 'guardados',
  emptyEyebrow: 'Empieza tu lista',
}, {
  pageTitle: 'My favorites',
  title: 'Your Favorites',
  subtitle: 'Places you have saved to visit.',
  loading: 'Loading favorites...',
  emptyTitle: 'You have no favorites yet',
  emptyText: 'Explore the Sierra Gorda and save the places you would like to visit by tapping the heart icon.',
  localNote: 'Your favorites are saved on this device.',
  signIn: 'Sign in',
  syncNote: 'to sync them across all your devices.',
  explorePlaces: 'Explore places',
  eyebrow: 'Your trip',
  openMap: 'View on the map',
  count: (n: number) => `${n} ${n === 1 ? 'saved place' : 'saved places'}`,
  savedLabel: 'saved',
  emptyEyebrow: 'Start your list',
});

export const FavoritesPage = () => {
  const m = useMessages(messages);
  usePageTitle(m.pageTitle);
  const { favoriteIds, remoteFavorites, loading } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [localPlaces, setLocalPlaces] = useState<Place[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadLocal = async () => {
      if (isAuthenticated || favoriteIds.length === 0) {
        setLocalPlaces([]);
        return;
      }
      setLoadingLocal(true);
      try {
        const res = await catalogApi.places({ limit: 100 });
        if (!ignore) {
          setLocalPlaces(res.data.filter(p => favoriteIds.includes(p.id)));
        }
      } catch {
        // Error silenciado para favoritos locales
      } finally {
        if (!ignore) setLoadingLocal(false);
      }
    };

    void loadLocal();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, favoriteIds]);

  const places = isAuthenticated ? remoteFavorites : localPlaces;
  const isLoading = loading || loadingLocal;

  const heroPhoto = places.find((place) => place.imagenPrincipal?.url)?.imagenPrincipal;
  const hasPlaces = !isLoading && places.length > 0;

  const syncNote = !isAuthenticated && (
    <p className="text-[13px] leading-6 text-brand-blue/70">
      {m.localNote}{' '}
      <Link to="/login" className="font-medium text-brand-green underline decoration-brand-green/30 underline-offset-4 hover:decoration-brand-green">{m.signIn}</Link>{' '}
      {m.syncNote}
    </p>
  );

  return (
    <>
      <PageHero
        eyebrow={m.eyebrow}
        title={<ItalicTail text={m.title} words={1} />}
        subtitle={m.subtitle}
        image={heroPhoto ? { url: heroPhoto.url, alt: '' } : null}
        actions={hasPlaces && <TextLink to="/mapa">{m.openMap}</TextLink>}
        stats={hasPlaces ? [{ value: places.length, label: m.savedLabel }] : undefined}
      />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 lg:px-8 lg:pb-28 lg:pt-16">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 border-t border-brand-sand pt-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={m.loading} aria-busy="true">
            {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-xl bg-brand-sand/60" />)}
            <span className="sr-only">{m.loading}</span>
          </div>
        ) : places.length === 0 ? (
          <div className="rounded-xl bg-brand-light px-6 py-16 text-center sm:px-12 sm:py-24">
            <p className="eyebrow">{m.emptyEyebrow}</p>
            <h2 className="mx-auto mt-5 max-w-xl text-[2rem] leading-[1.1] text-brand-blue sm:text-[2.75rem]">{m.emptyTitle}</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-brand-blue/75">{m.emptyText}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/explorar" className="btn btn-primary min-h-12 px-7">{m.explorePlaces}</Link>
              <Link to="/mapa" className="btn btn-secondary min-h-12 px-7">{m.openMap}</Link>
            </div>
            {syncNote && <div className="mx-auto mt-8 max-w-md">{syncNote}</div>}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-brand-sand pb-4">
              <p className="text-sm text-brand-blue/70" aria-live="polite">{m.count(places.length)}</p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
              {places.map((place) => (
                <div key={place.id} className="min-w-0">
                  <PlaceCard place={place} />
                </div>
              ))}
            </div>
            {syncNote && <div className="mt-14 border-t border-brand-sand pt-6 text-center">{syncNote}</div>}
          </>
        )}
      </div>
    </>
  );
};
