import { useFavorites } from '../contexts/FavoritesContext';

interface FavoriteButtonProps {
  placeId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton = ({ placeId, className = '', size = 'md' }: FavoriteButtonProps) => {
  const { favoriteIds, toggleFavorite, error } = useFavorites();
  const isFavorite = favoriteIds.includes(placeId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite(placeId);
  };

  const sizeClasses = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
  };

  const iconSizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`grid place-items-center rounded-full transition-transform active:scale-90 ${sizeClasses[size]} ${
        isFavorite
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 text-stone-400 shadow-sm backdrop-blur hover:text-red-500 hover:bg-red-50'
      } ${className}`}
      title={error || undefined}
    >
      <svg viewBox="0 0 24 24" className={iconSizeClasses[size]} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isFavorite ? '0' : '2'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
};
