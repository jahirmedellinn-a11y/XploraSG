// "Vive la Sierra a tu manera": cuatro temas con fotos reales del catálogo.
// Naturaleza y Misiones filtran la lista de lugares; Aventura y Sabores llevan a los prestadores.
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Category, Place, TourismService } from '../../types/catalog';
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import { ArrowRightIcon } from '../brand/icons';
import { firstWithPhoto, isMission, isNature, photoOf, serviceIn } from './homeData';
import { HomeHeading, ItalicTail, Photo, TextLink } from './HomeUi';

interface HomeThemesProps {
  places: Place[];
  services: TourismService[];
  categories: Category[];
  presentCategories: string[];
  activeCategory: string;
  onSelectCategory: (name: string) => void;
}

type Tile = {
  key: string;
  label: string;
  hint: string;
  photo: string | null;
  /** Categoría de lugares que filtra (si existe y tiene fichas). */
  filter?: string;
  to: string;
};

export const HomeThemes = ({ places, services, categories, presentCategories, activeCategory, onSelectCategory }: HomeThemesProps) => {
  const m = useMessages(homeMessages);

  const picks = useMemo(() => {
    const used = new Set<string>();
    const nature = firstWithPhoto(places, isNature, used, ['rio-verdito', 'cascadas-maravilla', 'el-chuveje']);
    const mission = firstWithPhoto(places, isMission, used, ['mision-de-jalpan', 'mision-de-tancoyol', 'mision-de-landa']);
    const adventure = firstWithPhoto(services, serviceIn(/aventura|cañon|guía/i), used, ['guias-locales-comunitarios-rio-blanco']);
    const flavors = firstWithPhoto(services, serviceIn(/gastro|aliment|restaur|fonda/i), used)
      ?? firstWithPhoto(services, serviceIn(/hosped/i), used);
    return { nature, mission, adventure, flavors };
  }, [places, services]);

  const categoryFor = (match: RegExp) => {
    const found = categories.find((item) => match.test(item.nombre));
    if (!found) return undefined;
    if (presentCategories.length && !presentCategories.includes(found.nombre)) return undefined;
    return found.nombre;
  };

  const tiles: Tile[] = [
    { key: 'nature', label: m.themeNature, hint: m.themeNatureHint, photo: photoOf(picks.nature), filter: categoryFor(/natura/i), to: '/mapa' },
    { key: 'missions', label: m.themeMissions, hint: m.themeMissionsHint, photo: photoOf(picks.mission), filter: categoryFor(/cultura/i), to: '/mapa' },
    { key: 'adventure', label: m.themeAdventure, hint: m.themeAdventureHint, photo: photoOf(picks.adventure), to: '/servicios' },
    { key: 'flavors', label: m.themeFlavors, hint: m.themeFlavorsHint, photo: photoOf(picks.flavors), to: '/servicios' },
  ];

  const tileBody = (tile: Tile, index: number, active: boolean): ReactNode => (
    <>
      <span className="relative block aspect-[3/4] overflow-hidden rounded-lg">
        <Photo src={tile.photo} name={tile.label} imgClassName="img-zoom" nameClassName="text-2xl" />
      </span>
      <span className="mt-4 flex items-baseline gap-3 border-t border-brand-sand pt-4">
        <span className="font-display text-sm italic text-brand-gold" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="min-w-0">
          <span className="font-display block text-xl leading-tight text-brand-blue sm:text-2xl">{tile.label}</span>
          <span className="mt-1 block text-[13px] leading-5 text-brand-blue/70 sm:text-sm">{tile.hint}</span>
          <span className={`mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-300 ${active ? 'text-brand-green' : 'text-brand-blue/70 group-hover:text-brand-green'}`}>
            {active ? m.themeActive : tile.filter ? m.themeFilter : m.themeServices}
            <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </>
  );

  const tileClass = (index: number) => `group block w-full self-start text-left ${index % 2 ? 'lg:mt-14' : ''}`;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8 lg:pb-28" aria-labelledby="home-themes">
      <HomeHeading
        id="home-themes"
        eyebrow={m.themesEyebrow}
        title={<ItalicTail text={m.themesTitle} words={2} />}
        text={m.themesText}
        action={<TextLink to="/mapa">{m.themesCta}</TextLink>}
      />

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
        {tiles.map((tile, index) => {
          if (tile.filter) {
            const filter = tile.filter;
            const active = activeCategory === filter;
            return (
              <button key={tile.key} type="button" aria-pressed={active} onClick={() => onSelectCategory(filter)} className={tileClass(index)}>
                {tileBody(tile, index, active)}
              </button>
            );
          }
          return (
            <Link key={tile.key} to={tile.to} className={tileClass(index)}>
              {tileBody(tile, index, false)}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
