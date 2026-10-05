import fs from 'fs';
let c = fs.readFileSync('src/pages/ServicesPage.tsx', 'utf-8');

c = c.replace(/<\/article>\s*\)\)\s*<\/div>\s*\) : !error && \(/,
`</article>
          ))}
        </div>
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button onClick={loadMore} disabled={loading} className="rounded-full bg-stone-100 px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-200 transition">
              {loading ? 'Cargando...' : 'Cargar mǭs'}
            </button>
          </div>
        )}
        </>
      ) : !error && (`);

fs.writeFileSync('src/pages/ServicesPage.tsx', c);
