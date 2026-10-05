import fs from 'fs';
let code = fs.readFileSync('src/pages/PlaceDetailPage.tsx', 'utf-8');

code = code.replace(/<p className="text-xs font-black uppercase tracking-\[0\.2em\] text-lime-300">.*?<\/p>/, `$&
          {offline && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-1.5 text-xs font-bold text-amber-200 border border-amber-400/30 backdrop-blur-md self-start">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sin conexión (Actualizado: {offlineDate})
            </div>
          )}`);

fs.writeFileSync('src/pages/PlaceDetailPage.tsx', code);
