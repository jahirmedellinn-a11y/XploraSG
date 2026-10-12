// Bloque para fichas sin fotografía: superficie crema/beige lisa con el nombre en serif.
// Nunca un dibujo genérico (v3 · Editorial natural).
import { artGradient } from './visuals';

interface CategoryArtworkProps {
  categoria?: string | null;
  /** Nombre del lugar o servicio que se muestra en serif. */
  name?: string | null;
  className?: string;
  nameClassName?: string;
}

export const CategoryArtwork = ({ categoria, name, className = '', nameClassName = 'text-2xl' }: CategoryArtworkProps) => (
  <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${artGradient(categoria)} ${className}`}>
    {name && (
      <span className={`font-display absolute inset-x-0 bottom-0 p-5 font-normal italic leading-tight text-brand-blue/70 sm:p-6 ${nameClassName}`}>
        {name}
      </span>
    )}
  </div>
);
