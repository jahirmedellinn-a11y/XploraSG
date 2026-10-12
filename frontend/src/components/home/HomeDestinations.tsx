// "Destinos imperdibles": mosaico tipo Pinterest (columnas con alturas distintas) de fotos reales
// del catálogo, con el nombre y el municipio como pie de foto.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../../types/catalog';
import { useLanguage, useMessages } from '../../i18n';
import { categoryLabel } from '../../i18n/common';
import { homeMessages } from '../../i18n/home';
import { HomeHeading, Photo, TextLink } from './HomeUi';

// Proporciones alternadas para el ritmo del mosaico (vertical, cuadrada, horizontal…).
const ASPECTS = ['aspect-[4/5]', 'aspect-[4/3]', 'aspect-square', 'aspect-[5/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[4/3]', 'aspect-[4/5]', 'aspect-[5/4]'];

const Destination = ({ place, index, lang }: { place: Place; index: number; lang: 'es' | 'en' }) => {
  // Las fotos panorámicas de baja altura no se recortan en vertical (se verían borrosas).
  const [panoramic, setPanoramic] = useState(false);
  const aspect = panoramic ? 'aspect-[4/3]' : ASPECTS[index % ASPECTS.length];
  return (
    <Link to={`/lugares/${place.slug}`} className="group block">
      <div className={`relative overflow-hidden rounded-lg ${aspect}`}>
        <Photo
          src={place.imagenPrincipal?.url}
          name={place.nombre}
          alt={place.imagenPrincipal?.altText || place.nombre}
          imgClassName="img-zoom"
          nameClassName="text-xl sm:text-2xl"
          onRatio={(ratio) => setPanoramic(ratio > 1.7)}
        />
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="meta">
          {categoryLabel(place.categoria, lang)}
        </p>
        <h3 className="font-display mt-1 text-lg leading-snug text-brand-blue underline-offset-4 group-hover:underline sm:text-[1.35rem]">
          {place.nombre}
        </h3>
        <p className="mt-0.5 text-[13px] text-brand-blue/70 sm:text-sm">{place.municipio}</p>
      </div>
    </Link>
  );
};

export const HomeDestinations = ({ places }: { places: Place[] }) => {
  const m = useMessages(homeMessages);
  const { lang } = useLanguage();
  if (!places.length) return null;

  return (
    <section className="border-t border-brand-sand" aria-labelledby="home-destinations">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <HomeHeading
          id="home-destinations"
          eyebrow={m.railEyebrow}
          title={m.railTitle}
          text={m.railText}
          action={<TextLink to="#lugares">{m.seeAll}</TextLink>}
        />

        <ul className="mt-12 columns-2 gap-4 sm:gap-6 lg:mt-16 lg:columns-3 lg:gap-8">
          {places.map((place, index) => (
            <li key={place.id} className={`mb-8 break-inside-avoid lg:mb-10 ${index >= 6 ? 'max-sm:hidden' : ''}`}>
              <Destination place={place} index={index} lang={lang} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
