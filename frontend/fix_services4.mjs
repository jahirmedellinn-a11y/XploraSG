import fs from 'fs';
let c = fs.readFileSync('src/pages/ServicesPage.tsx', 'utf-8');
c = c.replace(
  ') : services.length ? (\r\n        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">',
  `) : services.length ? (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">`
).replace(
  ') : services.length ? (\n        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">',
  `) : services.length ? (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">`
);

c = c.replace(
  `            </article>\r\n          ))}\r\n        </div>\r\n      ) : !error && (`,
  `            </article>
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
).replace(
  `            </article>\n          ))}\n        </div>\n      ) : !error && (`,
  `            </article>
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

fs.writeFileSync('src/pages/ServicesPage.tsx', c);
