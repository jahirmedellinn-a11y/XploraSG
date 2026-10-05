export const getLocalFavorites = (): number[] => {
  try {
    const data = localStorage.getItem('xplorasg_favorites');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addLocalFavorite = (lugarId: number): void => {
  const favs = getLocalFavorites();
  if (!favs.includes(lugarId)) {
    favs.push(lugarId);
    localStorage.setItem('xplorasg_favorites', JSON.stringify(favs));
  }
};

export const removeLocalFavorite = (lugarId: number): void => {
  const favs = getLocalFavorites();
  const index = favs.indexOf(lugarId);
  if (index !== -1) {
    favs.splice(index, 1);
    localStorage.setItem('xplorasg_favorites', JSON.stringify(favs));
  }
};

export const clearLocalFavorites = (): void => {
  localStorage.removeItem('xplorasg_favorites');
};
