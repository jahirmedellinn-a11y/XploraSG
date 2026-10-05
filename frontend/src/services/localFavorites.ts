export interface LocalFavorite {
  id: number;
  addedAt: number;
}

export const getLocalFavoritesDetails = (): LocalFavorite[] => {
  try {
    const data = localStorage.getItem('xplorasg_favorites');
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Backwards compatibility for plain number arrays
    if (parsed.length > 0 && typeof parsed[0] === 'number') {
      return parsed.map((id: number) => ({ id, addedAt: Date.now() }));
    }
    return parsed;
  } catch {
    return [];
  }
};

export const getLocalFavorites = (): number[] => {
  return getLocalFavoritesDetails().map(f => f.id);
};

export const addLocalFavorite = (lugarId: number): void => {
  const favs = getLocalFavoritesDetails();
  if (!favs.some(f => f.id === lugarId)) {
    favs.push({ id: lugarId, addedAt: Date.now() });
    localStorage.setItem('xplorasg_favorites', JSON.stringify(favs));
  }
};

export const removeLocalFavorite = (lugarId: number): void => {
  const favs = getLocalFavoritesDetails();
  const filtered = favs.filter(f => f.id !== lugarId);
  if (filtered.length !== favs.length) {
    localStorage.setItem('xplorasg_favorites', JSON.stringify(filtered));
  }
};

export const removeSyncedLocalFavorites = (syncedFavs: LocalFavorite[]): void => {
  const currentFavs = getLocalFavoritesDetails();
  // Solo borrar si el timestamp exacto coincide (no fue re-agregado después)
  const filtered = currentFavs.filter(curr => 
    !syncedFavs.some(synced => synced.id === curr.id && synced.addedAt === curr.addedAt)
  );
  localStorage.setItem('xplorasg_favorites', JSON.stringify(filtered));
};

export const clearLocalFavorites = (): void => {
  localStorage.removeItem('xplorasg_favorites');
};
