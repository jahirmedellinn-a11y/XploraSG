import { useFavorites } from '../hooks/useFavorites';
import { HeartIcon } from './brand/icons';
import { defineMessages, useMessages } from '../i18n';

const messages = defineMessages({
  remove: 'Quitar de favoritos',
  save: 'Guardar en favoritos',
}, {
  remove: 'Remove from favorites',
  save: 'Save to favorites',
});

interface FavoriteButtonProps {
  placeId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-12',
};

const ICON_SIZES = {
  sm: 'size-[18px]',
  md: 'size-5',
  lg: 'size-5',
};

// Corazón de línea discreto: círculo blanco cálido con filete fino; guardado, en terracota relleno.
export const FavoriteButton = ({ placeId, className = '', size = 'md' }: FavoriteButtonProps) => {
  const { favoriteIds, toggleFavorite, error } = useFavorites();
  const isFavorite = favoriteIds.includes(placeId);
  const m = useMessages(messages);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite(placeId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? m.remove : m.save}
      className={`grid shrink-0 place-items-center rounded-full border bg-brand-paper transition-colors duration-300 active:scale-95 ${SIZES[size]} ${
        isFavorite
          ? 'border-brand-gold/40 text-brand-gold'
          : 'border-brand-blue/12 text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
      } ${className}`}
      title={error || undefined}
    >
      <HeartIcon className={ICON_SIZES[size]} strokeWidth={1.5} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
};
