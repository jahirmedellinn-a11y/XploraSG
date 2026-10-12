// Piezas compartidas por las fichas de lugar y de servicio (v3 · Editorial natural):
// encabezado tipo artículo de revista, fotografía grande con miniaturas, listas con filetes de 1px.
import { useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PinIcon } from '../brand/icons';
import { defineMessages, useMessages } from '../../i18n';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from './LineIcons';
import { roundArrowClass } from './visuals';

type IconType = ComponentType<{ className?: string }>;

const messages = defineMessages({
  previousPhoto: 'Foto anterior',
  nextPhoto: 'Foto siguiente',
  showPhoto: (n: number, total: number) => `Ver foto ${n} de ${total}`,
  gallery: 'Galería de fotos',
}, {
  previousPhoto: 'Previous photo',
  nextPhoto: 'Next photo',
  showPhoto: (n: number, total: number) => `Show photo ${n} of ${total}`,
  gallery: 'Photo gallery',
});

export interface HeroImage {
  url: string | null;
  altText: string | null;
}

interface DetailHeroProps {
  images: HeroImage[];
  categoria?: string | null;
  categoryText: string;
  title: string;
  municipio?: string | null;
  backTo: string;
  backLabel: string;
  seed?: number;
  notice?: ReactNode;
  /** Acciones principales (cómo llegar / reservar, compartir, favorito). */
  actions?: ReactNode;
  /** Datos rápidos con filetes junto al título (sólo escritorio). */
  highlights?: ReactNode;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const DetailHero = ({ images, categoryText, title, municipio, backTo, backLabel, notice, actions, highlights }: DetailHeroProps) => {
  const m = useMessages(messages);
  const [failed, setFailed] = useState<string[]>([]);
  const gallery = images.filter((image): image is { url: string; altText: string | null } => Boolean(image.url) && !failed.includes(image.url!));
  const [index, setIndex] = useState(0);
  const current = gallery.length ? gallery[Math.min(index, gallery.length - 1)] : null;
  const active = current ? gallery.indexOf(current) : 0;
  const many = gallery.length > 1;
  const go = (step: number) => setIndex((active + step + gallery.length) % gallery.length);

  return (
    <header className="mx-auto max-w-7xl px-5 pt-6 lg:px-8 lg:pt-10">
      <Link to={backTo} className="group inline-flex items-center gap-2 text-sm text-brand-blue/70 transition-colors duration-300 hover:text-brand-blue">
        <ArrowLeftIcon className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        {backLabel}
      </Link>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-12 lg:items-end">
        <div className={highlights ? 'lg:col-span-8' : 'lg:col-span-10'}>
          <p className="eyebrow">{categoryText}</p>
          <h1 className="animate-fade-up mt-5 text-[2.5rem] leading-[1.03] text-brand-blue [overflow-wrap:anywhere] sm:text-6xl lg:text-[clamp(3.5rem,5vw,4.75rem)]">
            {title}
          </h1>
          {(municipio || notice) && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-brand-blue/75">
              {municipio && (
                <span className="inline-flex items-center gap-2">
                  <PinIcon className="size-4 text-brand-teal" />
                  {municipio}
                </span>
              )}
              {notice}
            </div>
          )}
          {actions && (
            <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>
        {highlights && <div className="hidden lg:col-span-4 lg:block">{highlights}</div>}
      </div>

      <figure className="-mx-5 mt-10 sm:mx-0 lg:mt-14">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-sand sm:aspect-[16/9] sm:rounded-lg lg:aspect-[2/1]">
          {current ? (
            <img
              key={current.url}
              src={current.url}
              alt={current.altText || title}
              onError={() => setFailed((list) => [...list, current.url])}
              decoding="async"
              fetchPriority="high"
              className="animate-fade-up absolute inset-0 size-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="font-display absolute inset-x-0 bottom-0 p-6 text-4xl font-normal italic leading-tight text-brand-blue/70 sm:p-10 sm:text-6xl">
              {title}
            </span>
          )}
        </div>
        {many && (
          <div className="mt-3 flex items-center gap-4 px-5 sm:px-0">
            <ul className="snap-rail flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-label={m.gallery}>
              {gallery.map((image, i) => (
                <li key={image.url} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={m.showPhoto(i + 1, gallery.length)}
                    aria-pressed={i === active}
                    className={`block h-14 w-20 overflow-hidden rounded-md transition-opacity duration-300 sm:h-16 sm:w-24 ${
                      i === active ? 'opacity-100 ring-1 ring-brand-blue ring-offset-2 ring-offset-brand-paper' : 'opacity-55 hover:opacity-100'
                    }`}
                  >
                    <img src={image.url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex shrink-0 items-center gap-1 text-sm text-brand-blue/70">
              <button type="button" onClick={() => go(-1)} aria-label={m.previousPhoto} className={roundArrowClass}><ChevronLeftIcon className="size-4" /></button>
              <span className="hidden min-w-[3.75rem] text-center font-medium tabular-nums sm:inline" aria-hidden="true">
                {pad(active + 1)} <span className="text-brand-blue/70">/ {pad(gallery.length)}</span>
              </span>
              <button type="button" onClick={() => go(1)} aria-label={m.nextPhoto} className={roundArrowClass}><ChevronRightIcon className="size-4" /></button>
            </div>
          </div>
        )}
      </figure>
    </header>
  );
};

/** Dato rápido con filete junto al título de la ficha. */
export const HeroFact = ({ icon: Icon, label, children }: { icon: IconType; label: string; children: ReactNode }) => (
  <div className="flex gap-3.5 border-t border-brand-sand py-4 last:border-b">
    <Icon className="mt-0.5 size-[18px] shrink-0 text-brand-teal" />
    <div className="min-w-0">
      <p className="label-quiet">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-brand-blue">{children}</p>
    </div>
  </div>
);

/** Encabezado de sección editorial: eyebrow terracota + titular en serif. */
export const SectionHeading = ({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={`${eyebrow ? 'mt-4' : ''} text-[2rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]`}>{title}</h2>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/** Subtítulo de bloque dentro del cuerpo de la ficha. */
export const BlockTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-2xl leading-tight text-brand-blue sm:text-[1.75rem]">{children}</h2>
);

/** Lista limpia de actividades o servicios con pequeños iconos de línea y filetes. */
export const AmenityGrid = ({ items, label }: { items: Array<{ icon: IconType; text: string }>; label: string }) => (
  <ul aria-label={label} className="grid border-t border-brand-sand sm:grid-cols-2 sm:gap-x-10">
    {items.map(({ icon: Icon, text }) => (
      <li key={text} className="flex items-center gap-3.5 border-b border-brand-sand py-4">
        <Icon className="size-5 shrink-0 text-brand-green" />
        <span className="text-[15px] leading-6 text-brand-blue">{text}</span>
      </li>
    ))}
  </ul>
);

const ACCENTS = {
  teal: 'text-brand-teal',
  green: 'text-brand-green',
  gold: 'text-brand-gold',
};

/** Bloque de información con filete superior: icono de línea, título y texto. */
export const InfoBlock = ({ icon: Icon, title, children, accent = 'teal' }: { icon: IconType; title: string; children: ReactNode; accent?: keyof typeof ACCENTS }) => (
  <section className="border-t border-brand-sand pt-5">
    <h3 className="flex items-center gap-2.5 text-[15px] font-medium text-brand-blue">
      <Icon className={`size-[18px] shrink-0 ${ACCENTS[accent]}`} />
      {title}
    </h3>
    <div className="mt-2.5 whitespace-pre-line text-[15px] leading-7 text-brand-blue/70">{children}</div>
  </section>
);

/** Fila de la lista de "Datos prácticos" (dt/dd con filete). */
export const PracticalItem = ({ label, children }: { icon?: IconType; label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-4 border-b border-brand-sand py-3.5">
    <dt className="pt-0.5 label-quiet leading-5">{label}</dt>
    <dd className="break-words text-sm leading-6 text-brand-blue">{children}</dd>
  </div>
);

export const DetailSkeleton = ({ label }: { label: string }) => (
  <div aria-busy="true" className="mx-auto max-w-7xl px-5 pt-6 lg:px-8 lg:pt-10">
    <div className="h-4 w-20 animate-pulse rounded-full bg-brand-sand/70" />
    <div className="mt-10 h-3 w-32 animate-pulse rounded-full bg-brand-sand/70" />
    <div className="mt-6 h-14 w-3/4 max-w-2xl animate-pulse rounded-lg bg-brand-sand/60" />
    <div className="mt-4 h-4 w-40 animate-pulse rounded-full bg-brand-sand/60" />
    <div className="-mx-5 mt-12 aspect-[4/3] animate-pulse bg-brand-sand/60 sm:mx-0 sm:aspect-[16/9] sm:rounded-lg lg:aspect-[2/1]" />
    <p className="sr-only" role="status">{label}</p>
  </div>
);

export const DetailUnavailable = ({ title, text, to, cta }: { title: string; text: string; to: string; cta: string }) => (
  <section className="mx-auto max-w-3xl px-5 py-24 text-center lg:py-32">
    <h1 className="text-4xl leading-tight text-brand-blue sm:text-5xl">{title}</h1>
    {text && <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-brand-blue/75">{text}</p>}
    <Link to={to} className="btn btn-primary mt-8 min-h-12 px-7">{cta}</Link>
  </section>
);
