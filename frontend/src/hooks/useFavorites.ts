import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLocalFavorites, addLocalFavorite, removeLocalFavorite } from '../services/localFavorites';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from '../services/favoritesApi';
import type { Place } from '../types/catalog';

export const useFavorites = () => {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [remoteFavorites, setRemoteFavorites] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadFavorites = async () => {
      setLoading(true);
      if (isAuthenticated) {
        try {
          const localIdsToSync = getLocalFavorites();
          if (localIdsToSync.length > 0) {
            await syncFavorites(localIdsToSync);
            // Remove exactly what was synced, to prevent wiping items added mid-flight
            localIdsToSync.forEach(id => removeLocalFavorite(id));
          }
          const data = await getFavorites();
          if (!ignore) {
            setRemoteFavorites(data);
            setFavoriteIds(data.map(f => f.id));
          }
        } catch (error) {
          console.error("Error cargando favoritos remotos", error);
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
    
    // Optimistic UI update
    const newIds = isFav ? favoriteIds.filter(id => id !== lugarId) : [...favoriteIds, lugarId];
    setFavoriteIds(newIds);
    
    if (isAuthenticated) {
      try {
        if (isFav) {
          await removeFavorite(lugarId);
          setRemoteFavorites(prev => prev.filter(p => p.id !== lugarId));
        } else {
          await addFavorite(lugarId);
          // Opcional: re-fetch para obtener la data del nuevo favorito
        }
      } catch (error) {
        // Rollback on error
        setFavoriteIds(favoriteIds);
        console.error("Error toggleando favorito remoto", error);
      }
    } else {
      if (isFav) {
        removeLocalFavorite(lugarId);
      } else {
        addLocalFavorite(lugarId);
      }
    }
  };

  return { favoriteIds, remoteFavorites, toggleFavorite, loading };
};
