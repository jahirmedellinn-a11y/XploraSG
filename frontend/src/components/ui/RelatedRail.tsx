// "Otros lugares en…" y sugerencias: fila editorial sencilla de tres fichas (foto + pie de foto).
// En móvil se convierte en un carril horizontal con scroll-snap.
import { Link } from 'react-router-dom';
import { Photo } from '../home/HomeUi';
import { SectionHeading } from './DetailParts';

export interface RailItem {
  key: string | number;
  to: string;
  title: string;
  subtitle?: string | null;
  categoria?: string | null;
  categoryText?: string;
  image?: { url: string | null; altText: string | null } | null;
  seed?: number;
}

export const RelatedRail = ({ eyebrow, title, items, limit = 3 }: { eyebrow?: string; title: string; items: RailItem[]; limit?: number }) => {
  if (items.length === 0) return null;
  const shown = items.slice(0, limit);

  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-8">
      <div className="border-t border-brand-sand pt-16 lg:pt-20">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <ul className="snap-rail -mx-5 mt-10 flex scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:mt-12 lg:grid-cols-3 lg:gap-8">
        {shown.map((item, i) => (
          <li key={item.key} className={`w-[78%] shrink-0 sm:w-auto ${i === 2 ? 'sm:max-lg:hidden' : ''}`}>
            <Link to={item.to} className="group block">
              <span className="relative block aspect-[4/3] overflow-hidden rounded-lg">
                <Photo src={item.image?.url} name={item.title} imgClassName="img-zoom" nameClassName="text-xl" />
              </span>
              <span className="mt-4 block">
                {item.categoryText && (
                  <span className="block meta">{item.categoryText}</span>
                )}
                <span className="font-display mt-1 block text-xl leading-snug text-brand-blue underline-offset-4 group-hover:underline sm:text-[1.35rem]">{item.title}</span>
                {item.subtitle && <span className="mt-0.5 block text-[13px] text-brand-blue/70 sm:text-sm">{item.subtitle}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
};
