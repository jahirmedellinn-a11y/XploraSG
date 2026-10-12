// Encabezado editorial de las páginas interiores (Servicios, Agenda, Favoritos, Sobre nosotros, Mapa).
// v3 · Editorial natural: eyebrow terracota, titular grande en serif e introducción en columna estrecha
// sobre blanco cálido; la fotografía va al lado (split) o a lo ancho debajo del título (stacked), sin velos.
import { useState, type ReactNode } from 'react';

export interface PageHeroStat {
  value: ReactNode;
  label: string;
}

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * Fotografía del proyecto. `null`/ausente: sin foto. Un objeto sin `url` deja un bloque beige
   * (útil mientras carga la foto, para que la página no salte).
   */
  image?: { url: string | null | undefined; alt?: string | null; srcSet?: string; position?: string } | null;
  /** Pie de foto opcional. */
  caption?: ReactNode;
  /** Botones o controles bajo el texto. */
  actions?: ReactNode;
  /** Cifras destacadas (lista con filetes). */
  stats?: PageHeroStat[];
  /** Bloque personalizado (sustituye a las cifras). */
  aside?: ReactNode;
  /** Variante baja para páginas de herramienta (Mapa). */
  compact?: boolean;
  /** Composición: foto al lado del texto (split) o a lo ancho bajo el título (stacked). */
  layout?: 'split' | 'stacked';
  /** Contenido extra al pie del encabezado (p. ej. pestañas). */
  footer?: ReactNode;
}

const HeroPhoto = ({ image, className, sizes }: { image: NonNullable<PageHeroProps['image']>; className: string; sizes: string }) => {
  const [failed, setFailed] = useState<string | null>(null);
  const url = image.url && failed !== image.url ? image.url : null;
  return (
    <div className={`relative overflow-hidden bg-brand-sand ${className}`}>
      {url && (
        <img
          src={url}
          srcSet={image.srcSet}
          sizes={image.srcSet ? sizes : undefined}
          alt={image.alt ?? ''}
          onError={() => setFailed(url)}
          decoding="async"
          fetchPriority="high"
          className="animate-fade-up absolute inset-0 size-full object-cover"
          style={{ objectPosition: image.position ?? 'center' }}
        />
      )}
    </div>
  );
};

export const PageHero = ({ eyebrow, title, subtitle, image, caption, actions, stats, aside, compact = false, layout = 'split', footer }: PageHeroProps) => {
  const side = aside ?? (stats && stats.length > 0 && (
    <dl className="grid max-w-md grid-cols-2 border-t border-brand-sand">
      {stats.map((stat, i) => (
        <div key={stat.label} className={`flex flex-col pt-4 ${i ? 'border-l border-brand-sand pl-5' : 'pr-5'}`}>
          <dt className="order-2 mt-1 label-quiet">{stat.label}</dt>
          <dd className="font-display text-4xl leading-none tabular-nums text-brand-blue">{stat.value}</dd>
        </div>
      ))}
    </dl>
  ));

  const split = layout === 'split' && Boolean(image) && !compact;

  const text = (
    <div className={split ? 'flex flex-col justify-center lg:col-span-5 lg:py-6' : 'max-w-3xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h1
        className={`animate-fade-up mt-5 leading-[1.03] text-brand-blue [overflow-wrap:anywhere] ${
          compact ? 'text-[2.3rem] sm:text-5xl' : 'text-[2.6rem] sm:text-6xl lg:text-[clamp(3.4rem,4.6vw,4.5rem)]'
        }`}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-5 max-w-xl text-[15px] leading-7 text-brand-blue/75 sm:text-base sm:leading-8">
          {subtitle}
        </p>
      )}
      {actions && (
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div>
      )}
      {side && split && <div className="mt-9">{side}</div>}
    </div>
  );

  return (
    <header className={`mx-auto max-w-7xl px-5 lg:px-8 ${compact ? 'pb-6 pt-8 sm:pt-10' : 'pb-4 pt-8 sm:pt-12 lg:pt-14'}`}>
      {split && image ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          {text}
          <figure className="-mx-5 sm:mx-0 lg:col-span-7">
            <HeroPhoto image={image} sizes="(min-width: 1024px) 58vw, 100vw" className="aspect-[4/3] sm:rounded-lg lg:aspect-[5/4] xl:aspect-[4/3]" />
            {caption && <figcaption className="mt-3 px-5 text-[13px] leading-5 text-brand-blue/70 sm:px-0">{caption}</figcaption>}
          </figure>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {text}
            {side && <div className="shrink-0">{side}</div>}
          </div>
          {image && !compact && (
            <figure className="-mx-5 mt-10 sm:mx-0 lg:mt-14">
              <HeroPhoto image={image} sizes="100vw" className="aspect-[4/3] sm:aspect-[16/9] sm:rounded-lg lg:aspect-[2/1]" />
              {caption && <figcaption className="mt-3 px-5 text-[13px] leading-5 text-brand-blue/70 sm:px-0">{caption}</figcaption>}
            </figure>
          )}
        </>
      )}
      {footer && <div className="mt-10">{footer}</div>}
    </header>
  );
};
