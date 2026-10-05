import fs from 'fs';
let c = fs.readFileSync('src/pages/ExplorePage.tsx', 'utf-8');

c = c.replace(/<p className="mt-6 max-w-xl text-lg leading-8 text-emerald-100\/80">[\s\S]*?<\/p>/, `$&
              {offline && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-2 text-sm font-bold text-amber-200 border border-amber-400/30 backdrop-blur-md">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Modo sin conexión (Actualizado: {offlineDate})
                </div>
              )}`);

fs.writeFileSync('src/pages/ExplorePage.tsx', c);
