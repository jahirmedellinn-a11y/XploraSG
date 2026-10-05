import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PlaceCard } from '../components/PlaceCard';
import { catalogApi } from '../services/catalogApi';
import type { Category, Municipality, Place } from '../types/catalog';

export const ExplorePage = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [municipality, setMunicipality] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      catalogApi.municipalities(controller.signal),
      catalogApi.categories(controller.signal),
    ])
      .then(([municipalityResponse, categoryResponse]) => {
        setMunicipalities(municipalityResponse.data);
        setCategories(categoryResponse.data);
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('No pudimos cargar los filtros del catálogo.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .places(
        {
          municipio: municipality || undefined,
          categoria: category || undefined,
          q: search || undefined,
          limit: 100,
        },
        controller.signal,
      )
      .then((response) => setPlaces(response.data))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('No fue posible conectar con el catálogo. Comprueba que el backend esté iniciado.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [municipality, category, search]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSearch(searchInput.trim());
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-emerald-950 text-white">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_75%_25%,#91c95f_0,transparent_32%),radial-gradient(circle_at_15%_80%,#1f8d71_0,transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-300">Querétaro, México</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.96] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              La Sierra Gorda se descubre paso a paso.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-emerald-100/80">
              Explora paisajes, misiones y experiencias locales en una guía construida con información verificada.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/mapa" className="rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-emerald-950 shadow-lg shadow-black/10 hover:bg-lime-200">
                Abrir mapa
              </Link>
              <a href="#catalogo" className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-black text-white hover:bg-white/10">
                Ver lugares
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-96 lg:block" aria-hidden="true">
            <div className="absolute inset-5 rotate-3 rounded-[3rem] border border-white/20 bg-gradient-to-br from-lime-300/30 to-emerald-800/10" />
            <div className="absolute inset-x-14 inset-y-10 -rotate-3 rounded-[3rem] bg-[#d8e8c5] p-8 text-emerald-950 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.18em]">Ruta serrana</span>
                <span className="size-3 rounded-full bg-orange-500" />
              </div>
              <svg viewBox="0 0 360 235" className="mt-4 w-full" fill="none" aria-hidden="true">
                <path d="M21 189C75 120 85 161 124 96c35-59 60-17 88-43 38-35 69 30 126-22" stroke="#4d7c57" strokeWidth="3" strokeDasharray="7 8" />
                <path d="M4 216 86 83l47 70 44-67 76 111 41-61 62 80" fill="#7aa36f" opacity=".45" />
                <path d="M4 216h352" stroke="#315c45" strokeWidth="3" />
                {[['21','189'],['124','96'],['212','53'],['338','31']].map(([cx, cy]) => (
                  <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r="10" fill="#fff" /><circle cx={cx} cy={cy} r="5" fill="#e9743f" /></g>
                ))}
              </svg>
              <div className="mt-2 flex items-end justify-between">
                <div><p className="text-3xl font-black">6</p><p className="text-xs font-bold uppercase tracking-wider">municipios</p></div>
                <p className="max-w-32 text-right text-xs font-semibold leading-5">Un territorio para recorrer con calma</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-22">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Explora el territorio</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Lugares para conocer</h2>
            <p className="mt-3 max-w-xl leading-7 text-stone-600">Solo aparecen lugares cuya información ya fue revisada y aprobada.</p>
          </div>
          <Link to="/mapa" className="text-sm font-extrabold text-emerald-800 hover:text-emerald-600">Ver en el mapa →</Link>
        </div>

        <form onSubmit={handleSearch} className="mt-9 grid gap-3 rounded-3xl border border-stone-200 bg-white p-3 shadow-sm md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <label className="sr-only" htmlFor="place-search">Buscar lugar</label>
          <input
            id="place-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre..."
            className="min-h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
          <label className="sr-only" htmlFor="municipality-filter">Municipio</label>
          <select id="municipality-filter" value={municipality} onChange={(event) => { setLoading(true); setError(''); setMunicipality(event.target.value); }} className="min-h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-emerald-700">
            <option value="">Todos los municipios</option>
            {municipalities.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
          </select>
          <label className="sr-only" htmlFor="category-filter">Categoría</label>
          <select id="category-filter" value={category} onChange={(event) => { setLoading(true); setError(''); setCategory(event.target.value); }} className="min-h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold outline-none focus:border-emerald-700">
            <option value="">Todas las categorías</option>
            {categories.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
          </select>
          <button type="submit" className="min-h-12 rounded-2xl bg-emerald-950 px-6 text-sm font-black text-white hover:bg-emerald-800">Buscar</button>
        </form>

        {error && <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

        {loading ? (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-[1.75rem] bg-stone-200" />)}
          </div>
        ) : places.length ? (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        ) : !error && (
          <div className="mt-9 rounded-[2rem] border border-dashed border-emerald-900/25 bg-emerald-50/60 px-6 py-14 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-900 text-2xl text-white" aria-hidden="true">⌁</div>
            <h3 className="mt-5 text-xl font-black">El catálogo público está en preparación</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
              Los lugares ya están registrados como borradores. Aparecerán aquí al completar coordenadas, descripción e imágenes y aprobar su publicación.
            </p>
            {(municipality || category || search) && (
              <button type="button" onClick={() => { setMunicipality(''); setCategory(''); setSearch(''); setSearchInput(''); }} className="mt-5 text-sm font-extrabold text-emerald-800 underline underline-offset-4">
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
};

