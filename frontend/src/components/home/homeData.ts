// Utilidades de datos del inicio: elegir fotografías reales del catálogo (vienen de la API)
// para el hero, el mosaico de destinos, los temas y el cierre. Nunca se usan fotos externas.
import type { Place, TourismService } from '../../types/catalog';

type WithPhoto = { slug: string | null; imagenPrincipal?: { url: string | null } | null };

export const hasPhoto = (item: WithPhoto | null | undefined): boolean => Boolean(item?.imagenPrincipal?.url);
export const photoOf = (item: WithPhoto | null | undefined): string | null => item?.imagenPrincipal?.url ?? null;

export const isMission = (place: Place) => /misi[oó]n/i.test(place.nombre);
export const isNature = (place: Place) => /natura/i.test(place.categoria);

/** Curaduría editorial: orden preferido de las fotos más limpias del catálogo (el resto conserva su orden). */
const HERO_PREFERENCE = ['el-chuveje', 'mision-de-landa', 'sotano-del-barro', 'mision-de-jalpan', 'las-adjuntas', 'cuatro-palos'];
const MOSAIC_PREFERENCE = [
  'cuatro-palos', 'mision-de-tancoyol', 'cascadas-maravilla', 'neblinas', 'canon-del-paraiso', 'tancama',
  'mirador-de-cristal', 'vestigios-prehistoricos', 'balneario-el-oasis', 'ranas', 'mision-de-tilaco',
];

/** Ordena por una lista de slugs preferidos y deja el resto en su orden original. */
const byPreference = <T extends WithPhoto>(items: T[], preferred: string[]) => {
  const rank = (item: T) => {
    const index = preferred.indexOf(item.slug ?? '');
    return index === -1 ? preferred.length : index;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
};

/**
 * Diapositivas del hero: hasta 5 lugares con foto, alternando naturaleza y misiones.
 * Sin fotos (p. ej. datos de prueba) devuelve el primer lugar para mostrar su nombre en serif.
 */
export const pickHeroSlides = (places: Place[], max = 5): Place[] => {
  const withPhoto = places.filter(hasPhoto);
  if (!withPhoto.length) return places.slice(0, 1);
  const preferred = byPreference(withPhoto, HERO_PREFERENCE);
  const nature = preferred.filter(isNature);
  const missions = preferred.filter(isMission);
  const mixed: Place[] = [];
  for (let index = 0; mixed.length < max && (index < nature.length || index < missions.length); index += 1) {
    if (nature[index]) mixed.push(nature[index]);
    if (mixed.length < max && missions[index]) mixed.push(missions[index]);
  }
  for (const place of preferred) {
    if (mixed.length >= max) break;
    if (!mixed.includes(place)) mixed.push(place);
  }
  return mixed;
};

/** Lugares para el mosaico de destinos: prioriza fotos que no aparecen en el hero. */
export const pickMosaic = (places: Place[], exclude: Place[], max = 9): Place[] => {
  const withPhoto = places.filter(hasPhoto);
  if (withPhoto.length < 4) return places.slice(0, max);
  const excluded = new Set(exclude.map((place) => place.id));
  const fresh = byPreference(withPhoto.filter((place) => !excluded.has(place.id)), MOSAIC_PREFERENCE);
  const rest = withPhoto.filter((place) => excluded.has(place.id));
  return [...fresh, ...rest].slice(0, max);
};

/** Primer elemento con foto que cumpla el filtro, evitando los ya usados. */
export const firstWithPhoto = <T extends WithPhoto>(items: T[], test: (item: T) => boolean, used: Set<string>, preferred: string[] = []): T | null => {
  const found = byPreference(items, preferred).find((item) => hasPhoto(item) && test(item) && !used.has(photoOf(item) ?? ''));
  if (found) used.add(photoOf(found) ?? '');
  return found ?? null;
};

export const serviceIn = (pattern: RegExp) => (service: TourismService) => pattern.test(`${service.categoria ?? ''} ${service.tipoServicio ?? ''}`);

export const openAssistant = () => window.dispatchEvent(new CustomEvent('xplora:open-assistant'));
