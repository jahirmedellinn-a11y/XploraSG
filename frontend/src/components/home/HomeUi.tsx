// Piezas visuales compartidas por las secciones del inicio (v3 · Editorial natural).
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../brand/icons';

/**
 * Fotografía del catálogo que llena su contenedor (object-cover).
 * Sin foto, o si no carga, queda un bloque crema con el nombre del lugar en serif: nunca un dibujo.
 */
export const Photo = ({
  src, name, alt = '', className = '', imgClassName = '', position, eager = false, nameClassName = 'text-2xl', onRatio,
}: {
  src: string | null | undefined;
  name?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  position?: string;
  eager?: boolean;
  nameClassName?: string;
  /** Proporción natural (ancho / alto) de la foto al cargar. */
  onRatio?: (ratio: number) => void;
}) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <div className={`absolute inset-0 overflow-hidden bg-brand-sand ${className}`}>
      {showImage ? (
        <img
          src={src ?? ''}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
          onLoad={onRatio ? (event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth && naturalHeight) onRatio(naturalWidth / naturalHeight);
          } : undefined}
          style={position ? { objectPosition: position } : undefined}
          className={`absolute inset-0 size-full object-cover ${imgClassName}`}
        />
      ) : (
        name && (
          <span aria-hidden="true" className={`font-display absolute inset-x-0 bottom-0 p-5 font-normal italic leading-tight text-brand-blue/70 sm:p-6 ${nameClassName}`}>
            {name}
          </span>
        )
      )}
    </div>
  );
};

/** Encabezado editorial de sección: eyebrow terracota + titular en serif + texto en columna estrecha. */
export const HomeHeading = ({ eyebrow, title, text, id, action, align = 'end' }: {
  eyebrow: string; title: ReactNode; text?: string; id?: string; action?: ReactNode; align?: 'end' | 'start';
}) => (
  <div className={`flex flex-col justify-between gap-6 md:flex-row ${align === 'end' ? 'md:items-end' : 'md:items-start'}`}>
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-title mt-5">{title}</h2>
      {text && <p className="mt-5 max-w-xl text-[15px] leading-7 text-brand-blue/75">{text}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const textLinkClass = 'group inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green';

/** Enlace de texto subrayado con flecha (estilo editorial). `arrow={false}` lo deja sólo con texto. */
export const TextLink = ({ to, children, arrow = true, className = '' }: { to: string; children: ReactNode; arrow?: boolean; className?: string }) => {
  const content = (
    <>
      {children}
      {arrow && <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
    </>
  );
  return to.startsWith('#')
    ? <a href={to} className={`${textLinkClass} ${className}`}>{content}</a>
    : <Link to={to} className={`${textLinkClass} ${className}`}>{content}</Link>;
};

/** Separa el último enunciado/las últimas palabras para ponerlas en cursiva. */
export const ItalicTail = ({ text, words = 2 }: { text: string; words?: number }) => {
  const parts = text.split(' ');
  if (parts.length <= words) return <em className="font-normal italic">{text}</em>;
  return (
    <>
      {parts.slice(0, -words).join(' ')}{' '}
      <em className="font-normal italic text-brand-green">{parts.slice(-words).join(' ')}</em>
    </>
  );
};
