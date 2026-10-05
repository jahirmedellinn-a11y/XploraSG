import { Link } from 'react-router-dom';
import type { Place } from '../types/catalog';

const categoryTone = (category: string) => {
  const value = category.toLocaleLowerCase('es');
  if (value.includes('naturaleza')) return 'bg-emerald-100 text-emerald-900';
  if (value.includes('cultura') || value.includes('arqueolog')) return 'bg-amber-100 text-amber-950';
  if (value.includes('aventura')) return 'bg-orange-100 text-orange-950';
  return 'bg-sky-100 text-sky-950';
};

export const PlaceCard = ({ place }: { place: Place }) => (
  <article className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_50px_rgba(38,60,48,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(38,60,48,0.14)]">
    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-lime-600">
      {place.imagenPrincipal?.url ? (
        <img
          src={place.imagenPrincipal.url}
          alt={place.imagenPrincipal.altText || place.nombre}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <svg viewBox="0 0 120 80" className="w-2/3 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 67 37 24l20 28 13-18 42 33" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="84" cy="19" r="7" fill="currentColor" stroke="none" />
          </svg>
        </div>
      )}
      <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold ${categoryTone(place.categoria)}`}>
        {place.categoria}
      </span>
    </div>
    <div className="p-5 relative">
      <button 
        className="absolute top-5 right-5 z-10 grid size-10 place-items-center rounded-full bg-stone-100 text-stone-400 hover:text-red-500 hover:bg-red-50 transition"
        aria-label="Añadir a favoritos"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      </button>
      <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">{place.municipio}</p>
      <h2 className="mt-2 text-xl font-black tracking-tight text-stone-900">{place.nombre}</h2>
      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-stone-600">
        {place.descripcion || 'La información verificada de este lugar estará disponible próximamente.'}
      </p>
      <Link to={`/lugares/${place.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-600">
        Ver lugar <span aria-hidden="true">→</span>
      </Link>
    </div>
  </article>
);

