// Buscador del inicio: una fila limpia con borde fino (texto, municipio, categoría y "Buscar").
import type { FormEvent, ReactNode } from 'react';
import type { Category, Municipality } from '../../types/catalog';
import { useLanguage } from '../../i18n';
import { categoryLabel } from '../../i18n/common';
import { SearchIcon } from '../brand/icons';

export interface HomeSearchLabels {
  searchLabel: string;
  searchPlaceholder: string;
  municipality: string;
  allMunicipalities: string;
  category: string;
  allCategoriesLong: string;
  search: string;
  popular: string;
  popularTerms: string[];
}

interface HomeSearchBarProps {
  title: string;
  labels: HomeSearchLabels;
  value: string;
  onValueChange: (value: string) => void;
  municipality: string;
  onMunicipalityChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  municipalities: Municipality[];
  categories: Category[];
  onSubmit: (event: FormEvent) => void;
  onQuickSearch: (term: string) => void;
}

const Chevron = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m7 10 5 5 5-5" /></svg>
);

const SelectField = ({ id, label, children, value, onChange }: {
  id: string; label: string; children: ReactNode; value: string; onChange: (value: string) => void;
}) => (
  <div className="relative min-w-0 border-t border-brand-sand lg:w-56 lg:border-l lg:border-t-0">
    <label htmlFor={id} className="pointer-events-none absolute left-5 top-2.5 label-quiet">{label}</label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-16 w-full cursor-pointer appearance-none truncate bg-transparent pb-2 pl-5 pr-10 pt-6 text-sm text-brand-blue outline-none transition-colors duration-300 hover:bg-brand-paper focus-visible:bg-brand-paper"
    >
      {children}
    </select>
    <Chevron />
  </div>
);

export const HomeSearchBar = ({
  title, labels, value, onValueChange, municipality, onMunicipalityChange, category, onCategoryChange,
  municipalities, categories, onSubmit, onQuickSearch,
}: HomeSearchBarProps) => {
  const { lang } = useLanguage();
  return (
    <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-8 lg:pt-20" aria-labelledby="home-search">
      <h2 id="home-search" className="font-display text-2xl text-brand-blue sm:text-[1.75rem]">{title}</h2>
      <form
        onSubmit={onSubmit}
        role="search"
        className="mt-5 flex flex-col overflow-hidden rounded-xl border border-brand-blue/15 bg-white text-brand-blue transition-colors duration-300 focus-within:border-brand-blue/35 lg:flex-row lg:items-stretch"
      >
        <label className="sr-only" htmlFor="place-search">{labels.searchLabel}</label>
        <div className="relative min-w-0 lg:flex-1">
          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-brand-blue/70" />
          <input
            id="place-search"
            type="search"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={labels.searchPlaceholder}
            maxLength={120}
            className="h-16 w-full bg-transparent pl-13 pr-4 text-[15px] text-brand-blue outline-none placeholder:text-brand-blue/70 focus-visible:bg-brand-paper"
          />
        </div>
        <SelectField id="municipality-filter" label={labels.municipality} value={municipality} onChange={onMunicipalityChange}>
          <option value="">{labels.allMunicipalities}</option>
          {municipalities.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
        </SelectField>
        <SelectField id="category-filter" label={labels.category} value={category} onChange={onCategoryChange}>
          <option value="">{labels.allCategoriesLong}</option>
          {categories.map((item) => <option key={item.id} value={item.nombre}>{categoryLabel(item.nombre, lang)}</option>)}
        </SelectField>
        <div className="border-t border-brand-sand p-2 lg:border-t-0 lg:pl-0">
          <button type="submit" className="btn btn-accent h-12 w-full rounded-lg px-8 lg:h-full lg:w-auto">
            {labels.search}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-brand-blue/70">{labels.popular}</span>
        {labels.popularTerms.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onQuickSearch(term)}
            className="text-brand-blue/75 underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:text-brand-green hover:decoration-brand-green"
          >
            {term}
          </button>
        ))}
      </div>
    </section>
  );
};
