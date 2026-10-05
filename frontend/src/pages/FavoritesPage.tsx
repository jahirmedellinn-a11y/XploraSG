import { useState, useEffect } from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { PlaceCard } from '../components/PlaceCard';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { catalogApi } from '../services/catalogApi';
import type { Place } from '../types/catalog';

export const FavoritesPage = () => {
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

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-emerald-950">Tus Favoritos</h1>
        <p className="mt-2 text-stone-600">Lugares que has guardado para visitar.</p>
      </header>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center font-bold text-stone-500">
          Cargando favoritos...
        </div>
      ) : places.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50 py-16 text-center">
          <div className="mb-4 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-stone-900">Tus favoritos están vacíos</h2>
          <p className="mt-2 max-w-sm text-sm text-stone-600">
            Explora la Sierra Gorda y guarda los lugares que te gustaría visitar presionando el ícono de corazón.
          </p>
          {!isAuthenticated && (
            <p className="mt-4 text-xs text-stone-500">
              Tus favoritos se guardan en este dispositivo. <Link to="/login" className="text-emerald-700 underline font-bold">Inicia sesión</Link> para sincronizarlos en todos tus dispositivos.
            </p>
          )}
          <Link to="/explorar" className="mt-6 rounded-full bg-emerald-950 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-900">
            Explorar lugares
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
};
