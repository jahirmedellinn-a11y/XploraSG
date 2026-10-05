import fs from 'fs';
let code = fs.readFileSync('src/pages/ServicesPage.tsx', 'utf-8');

code = code.replace(/const \[services[\s\S]*?\}, \[\]\);/, `  const [services, setServices] = useState<TourismService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [offline, setOffline] = useState(false);
  const [offlineDate, setOfflineDate] = useState('');

  const loadServices = (currentPage: number, append: boolean) => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    catalogApi.services({ page: currentPage, limit: 12 }, controller.signal)
      .then((response) => {
        setServices(prev => append ? [...prev, ...response.data] : response.data);
        setHasMore(response.data.length > 0 && response.pagination.page * response.pagination.limit < response.pagination.total);
        if (response._offline) {
          setOffline(true);
          setOfflineDate(new Date(response._storedAt!).toLocaleString('es-MX'));
        } else {
          setOffline(false);
        }
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('No fue posible conectar con el catálogo de servicios ni recuperar una versión guardada.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  };

  useEffect(() => {
    setPage(1);
    setServices([]);
    const cleanup = loadServices(1, false);
    return cleanup;
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadServices(nextPage, true);
  };`);

code = code.replace(/<p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">.*?<\/p>/, `$&
      {offline && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-2 text-sm font-bold text-amber-900 border border-amber-400/30">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Modo sin conexión (Actualizado: {offlineDate})
        </div>
      )}`);

// We are replacing the ternary branch where services exist.
code = code.replace(
  /\) : services\.length \? \(\s*<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">\s*\{services\.map\(\(service\) => \(\s*<article[\s\S]*?<\/article>\s*\)\)\s*<\/div>\s*\) : !error && \(/,
  `) : services.length ? (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">{service.categoria || 'Servicio turístico'}</p>
                <h2 className="mt-2 text-xl font-black">{service.nombre}</h2>
                <p className="mt-1 text-sm font-semibold text-stone-500">{service.prestador}</p>
                {service.municipio && <p className="mt-1 text-xs font-bold uppercase tracking-wider text-stone-400">{service.municipio}</p>}
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{service.descripcion || 'Información en preparación.'}</p>
                {service.rangoPrecio && <p className="mt-4 text-sm font-bold text-emerald-800">{service.rangoPrecio}</p>}
              </article>
            ))}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button onClick={loadMore} disabled={loading} className="rounded-full bg-stone-100 px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-200 transition">
                {loading ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      ) : !error && (`
);

fs.writeFileSync('src/pages/ServicesPage.tsx', code);
