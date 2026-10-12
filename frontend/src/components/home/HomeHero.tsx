// Hero editorial: titular en serif sobre blanco cálido y una fotografía alta del catálogo
// que rota con un fundido tranquilo (hasta 5 lugares). Pie de foto tipo revista con enlace al lugar.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../../types/catalog';
import { useMessages } from '../../i18n';
import { common } from '../../i18n/common';
import { homeMessages } from '../../i18n/home';
import { ArrowRightIcon, MapIcon } from '../brand/icons';
import { openAssistant } from './homeData';
import { Photo } from './HomeUi';

const AUTO_ADVANCE_MS = 7000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pad = (n: number) => String(n).padStart(2, '0');

export const HomeHero = ({ slides }: { slides: Place[] }) => {
  const m = useMessages(homeMessages);
  const c = useMessages(common);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  const count = slides.length;
  const active = count ? Math.min(index, count - 1) : 0;
  const current = count ? slides[active] : null;

  const go = useCallback((step: number) => {
    if (!count) return;
    setIndex((value) => (Math.min(value, count - 1) + step + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused || reduced) return undefined;
    const timer = window.setInterval(() => go(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduced, go, active]);

  // "Explora. Conecta." + "Vive la Sierra Gorda." (la última frase va en cursiva).
  const sloganParts = c.slogan.split(/(?<=\.)\s+/);
  const sloganLead = sloganParts.slice(0, -1).join(' ');
  const sloganLast = sloganParts[sloganParts.length - 1];

  return (
    <section
      className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] px-5 pt-8 sm:pt-12 lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:gap-x-10 lg:px-8 lg:pt-10"
      aria-label={m.slideshowLabel}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Titular */}
      <div className="flex flex-col justify-center lg:col-span-5 lg:row-start-1 lg:py-10">
        <p className="eyebrow">{m.heroEyebrow}</p>
        <h1 className="animate-fade-up mt-6 text-[2.75rem] leading-[1.02] text-brand-blue sm:text-6xl lg:text-[clamp(3.6rem,5vw,4.9rem)]">
          <span className="block">{sloganLead}</span>
          <em className="block font-normal italic text-brand-green">{sloganLast}</em>
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-brand-blue/70 sm:text-base sm:leading-8">
          {m.heroText}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" onClick={openAssistant} className="btn btn-accent min-h-12 px-6">
            {m.planTrip}
          </button>
          <Link to="/mapa" className="group inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green">
            <MapIcon className="size-4" />
            {m.seeMap}
          </Link>
        </div>
      </div>

      {/* Fotografía */}
      <div className="relative -mx-5 mt-10 aspect-[5/4] overflow-hidden bg-brand-sand sm:mx-0 sm:aspect-[16/11] sm:rounded-lg lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:aspect-auto lg:h-[min(46rem,calc(100svh-72px-3.5rem))] lg:min-h-[34rem]">
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.id}
            aria-hidden={slideIndex !== active}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${slideIndex === active ? 'opacity-100' : 'opacity-0'}`}
          >
            <Photo
              src={slide.imagenPrincipal?.url}
              name={slide.nombre}
              alt={slide.imagenPrincipal?.altText || slide.nombre}
              eager={slideIndex === 0}
              imgClassName="scale-[1.02]"
              nameClassName="text-4xl sm:text-5xl"
            />
          </div>
        ))}
      </div>

      {/* Pie de foto y controles */}
      <div className="flex items-end justify-between gap-6 border-b border-brand-sand py-4 lg:col-span-5 lg:row-start-2 lg:border-b-0 lg:border-t lg:pb-1 lg:pt-5">
        {current && (
          <Link to={`/lugares/${current.slug}`} className="group min-w-0" aria-live="polite">
            <span className="block meta">{m.photoLabel}</span>
            <span className="font-display mt-1 block truncate text-lg text-brand-blue underline-offset-4 group-hover:underline sm:text-xl">{current.nombre}</span>
            <span className="block text-[13px] text-brand-blue/70">{current.municipio}</span>
            <span className="sr-only">{m.seePlace}</span>
          </Link>
        )}
        {count > 1 && (
          <div className="flex shrink-0 items-center gap-1 text-sm text-brand-blue/70">
            <button type="button" onClick={() => go(-1)} aria-label={m.prevSlide} className="grid size-10 place-items-center rounded-full transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue">
              <ArrowRightIcon className="size-4 rotate-180" />
            </button>
            <p className="min-w-[4.25rem] text-center font-medium tabular-nums">
              <span aria-hidden="true">{pad(active + 1)} <span className="text-brand-blue/70">/ {pad(count)}</span></span>
              <span className="sr-only">{m.slideCounter(active + 1, count)}</span>
            </p>
            <button type="button" onClick={() => go(1)} aria-label={m.nextSlide} className="grid size-10 place-items-center rounded-full transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue">
              <ArrowRightIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
