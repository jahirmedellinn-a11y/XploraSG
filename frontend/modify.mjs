import fs from 'fs';
let code = fs.readFileSync('src/pages/PlaceDetailPage.tsx', 'utf-8');
code = code.replace("import { WeatherCard }", "import { FavoriteButton } from '../components/FavoriteButton';\nimport { WeatherCard }");
code = code.replace(
  '<h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{place.nombre}</h1>',
  '<div className="flex flex-wrap items-center gap-5 mt-3"><h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{place.nombre}</h1><FavoriteButton placeId={place.id} size="lg" /></div>'
);
fs.writeFileSync('src/pages/PlaceDetailPage.tsx', code);
