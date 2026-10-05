export interface LocalFavorite {
  id: number;
  operationId: string;
}

export const getLocalFavoritesDetails = (): LocalFavorite[] => {
  try {
    const data = localStorage.getItem('xplorasg_favorites');
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Backwards compatibility for plain number arrays
    if (parsed.length > 0 && typeof parsed[0] === 'number') {
      return parsed.map((id: number) => ({ id, operationId: Math.random().toString(36).substring(2) }));
    }
    // Backwards compatibility for addedAt
    if (parsed.length > 0 && parsed[0].addedAt) {
      return parsed.map((p: any) => ({ id: p.id, operationId: String(p.addedAt) }));
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
    favs.push({ id: lugarId, operationId: Math.random().toString(36).substring(2) });
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
  // Solo borrar si la operacion exacta coincide (no fue re-agregado después)
  const filtered = currentFavs.filter(curr => 
    !syncedFavs.some(synced => synced.id === curr.id && synced.operationId === curr.operationId)
  );
  localStorage.setItem('xplorasg_favorites', JSON.stringify(filtered));
};

export const clearLocalFavorites = (): void => {
  localStorage.removeItem('xplorasg_favorites');
};
