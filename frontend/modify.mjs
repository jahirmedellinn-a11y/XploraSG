import fs from 'fs';
let code = fs.readFileSync('src/pages/ExplorePage.tsx', 'utf-8');

const target1 = `              </p>
              <div className="mt-9 flex flex-wrap gap-3">`;

const replacement1 = `              </p>
              {offline && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-2 text-sm font-bold text-amber-200 border border-amber-400/30 backdrop-blur-md">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Modo sin conexión (Actualizado: {offlineDate})
                </div>
              )}
              <div className="mt-9 flex flex-wrap gap-3">`;

code = code.replace(target1, replacement1);

const target2 = `{places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>`;

const replacement2 = `{places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button onClick={loadMore} disabled={loading} className="rounded-full bg-stone-100 px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-200 transition">
                {loading ? 'Cargando...' : 'Cargar mǭs'}
              </button>
            </div>
          )}`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/ExplorePage.tsx', code);
