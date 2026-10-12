/* eslint-disable eslint/no-unused-vars */
/* eslint-disable react/only-export-components */
import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getLocalFavorites, getLocalFavoritesDetails, addLocalFavorite, removeLocalFavorite, removeSyncedLocalFavorites } from '../services/localFavorites';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from '../services/favoritesApi';
import type { Place } from '../types/catalog';

interface FavoritesContextType {
  favoriteIds: number[];
  remoteFavorites: Place[];
  toggleFavorite: (lugarId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [remoteFavorites, setRemoteFavorites] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadFavorites = async () => {
      setLoading(true);
      setError(null);
      if (isAuthenticated) {
        try {
          const localFavsToSync = getLocalFavoritesDetails();
          const localIdsToSync = localFavsToSync.map(f => f.id);
          
          if (localIdsToSync.length > 0) {
            await syncFavorites(localIdsToSync);
            if (!ignore) {
              removeSyncedLocalFavorites(localFavsToSync);
            }
          }
          const data = await getFavorites();
          if (!ignore) {
            setRemoteFavorites(data);
            setFavoriteIds(data.map(f => f.id));
          }
        } catch (err) {
          if (!ignore) {
            console.error("Error cargando favoritos remotos", err);
            setError("Error al cargar favoritos.");
          }
        }
      } else {
        if (!ignore) {
          setFavoriteIds(getLocalFavorites());
          setRemoteFavorites([]);
        }
      }
      if (!ignore) setLoading(false);
    };
    void loadFavorites();
    return () => { ignore = true; };
  }, [isAuthenticated]);

  const toggleFavorite = async (lugarId: number) => {
    const isFav = favoriteIds.includes(lugarId);
    setError(null);
    
    // Optimistic UI update
    const previousIds = favoriteIds;
    const newIds = isFav ? favoriteIds.filter(id => id !== lugarId) : [...favoriteIds, lugarId];
    setFavoriteIds(newIds);
    
    if (isAuthenticated) {
      try {
        if (isFav) {
          await removeFavorite(lugarId);
          setRemoteFavorites(prev => prev.filter(p => p.id !== lugarId));
        } else {
          await addFavorite(lugarId);
          // Optional: we don't have the full Place data here for remoteFavorites, 
          // but we can re-fetch or just let the ID be in favoriteIds.
        }
      } catch (err) {
        // Rollback on error
        setFavoriteIds(previousIds);
        setError("Ocurrió un error al guardar tu favorito.");
        console.error("Error toggleando favorito remoto", err);
      }
    } else {
      if (isFav) {
        removeLocalFavorite(lugarId);
      } else {
        addLocalFavorite(lugarId);
      }
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, remoteFavorites, toggleFavorite, loading, error }}>
      {children}
    </FavoritesContext.Provider>
  );
};

