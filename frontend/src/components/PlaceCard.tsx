import { Link } from 'react-router-dom';
import type { Place } from '../types/catalog';
import { activityTags, isClosedNotice } from '../utils/text';
import { FavoriteButton } from './FavoriteButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { ArrowRightIcon } from './brand/icons';
import { Photo } from './home/HomeUi';
import { photoLabelClass } from './ui/visuals';

const messages = defineMessages({
  closed: 'Cerrado temporalmente',
  noDescription: 'La información verificada de este lugar estará disponible próximamente.',
  activities: 'Actividades',
  seePlace: 'Ver lugar',
  viewPlace: (name: string) => `Ver lugar: ${name}`,
}, {
  closed: 'Temporarily closed',
  noDescription: 'Verified information about this place will be available soon.',
  activities: 'Activities',
  seePlace: 'View place',
  viewPlace: (name: string) => `View place: ${name}`,
});

// Tarjeta de revista (v3 · Editorial natural): fotografía con etiqueta de categoría y favorito discreto,
// luego municipio en versalitas, nombre en serif, una línea de descripción, actividades como lista
// tranquila separada por puntos y un enlace de texto "Ver lugar →". Toda la tarjeta es clicable.
export const PlaceCard = ({ place, showActivities = true }: { place: Place; showActivities?: boolean }) => {
  const tags = showActivities ? activityTags(place.actividades) : [];
  const closed = isClosedNotice(place.horarios);
  const { lang } = useLanguage();
  const m = useMessages(messages);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        <Photo
          src={place.imagenPrincipal?.url}
          name={place.nombre}
          alt={place.imagenPrincipal?.altText || place.nombre}
          imgClassName="img-zoom"
          nameClassName="text-xl"
        />
        <span className={photoLabelClass}>{categoryLabel(place.categoria, lang)}</span>
        {closed && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-clay-700 px-2.5 py-1 text-[11px] font-medium text-white">
            {m.closed}
          </span>
        )}
        <FavoriteButton placeId={place.id} size="sm" className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="truncate meta">{place.municipio}</p>
        <h3 className="font-display mt-1.5 line-clamp-2 text-[1.35rem] leading-snug text-brand-blue underline-offset-4 group-hover:underline">
          {place.nombre}
        </h3>
        <p className="mt-2 line-clamp-1 text-sm leading-6 text-brand-blue/70">
          {place.descripcion || m.noDescription}
        </p>
        {tags.length > 0 && (
          <ul className="mt-2.5 text-[13px] leading-6 text-brand-green" aria-label={m.activities}>
            {tags.map((tag, i) => (
              <li key={tag} className="inline">
                {tag}
                {i < tags.length - 1 && <span aria-hidden="true" className="text-brand-blue/30">{'\u00a0· '}</span>}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-4">
          <Link
            to={`/lugares/${place.slug}`}
            aria-label={m.viewPlace(place.nombre)}
            className="inline-flex items-center gap-2 border-b border-brand-blue/25 pb-0.5 text-[13px] font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:border-brand-green group-hover:text-brand-green"
          >
            {m.seePlace}
            <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
