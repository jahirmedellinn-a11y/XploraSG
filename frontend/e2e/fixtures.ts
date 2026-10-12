import type { Page } from '@playwright/test';

export const makePlace = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  slug: `lugar-${id}`,
  nombre: `Lugar de Prueba ${id}`,
  descripcion: 'Descripción de prueba del lugar.',
  municipio: 'Jalpan de Serra',
  categoria: id % 2 ? 'Naturaleza' : 'Cultura y Arqueología',
  actividades: 'Senderismo, fotografía y observación de aves.',
  horarios: 'Lunes a domingo de 9 a 17 h.',
  latitud: String(21.2 + id / 100),
  longitud: String(-99.47 + id / 100),
  imagenPrincipal: null,
  ...overrides,
});

export const makeService = (id: number) => ({
  id,
  slug: `servicio-${id}`,
  nombre: `Cabañas de Prueba ${id}`,
  descripcion: 'Hospedaje comunitario.',
  prestador: 'Cooperativa de Prueba',
  municipio: 'Jalpan de Serra',
  categoria: 'Hospedaje',
  tipoServicio: 'Hospedaje',
  contacto: 'Tel. 441 296 0445',
  rangoPrecio: 'Desde $900 MXN',
  imagenPrincipal: null,
});

/** Simula la API completa para que las pruebas no dependan de la base de datos. */
export const mockApi = async (page: Page, options: { places?: unknown[]; total?: number; pageTwo?: unknown[] } = {}) => {
  const places = options.places ?? [makePlace(1), makePlace(2), makePlace(3)];
  await page.route('**/api/catalogo/municipios**', (route) => route.fulfill({ json: { data: [{ id: 1, nombre: 'Jalpan de Serra', latitud: '21.21', longitud: '-99.47' }] } }));
  await page.route('**/api/catalogo/categorias**', (route) => route.fulfill({ json: { data: [{ id: 1, nombre: 'Naturaleza' }, { id: 2, nombre: 'Cultura y Arqueología' }] } }));
  await page.route(/\/api\/catalogo\/lugares(\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '24');
    const data = pageNumber > 1 ? options.pageTwo ?? [] : places;
    return route.fulfill({ json: { data, pagination: { page: pageNumber, limit, total: options.total ?? places.length } } });
  });
  await page.route(/\/api\/catalogo\/lugares\/[^/?]+$/, (route) => {
    const slug = new URL(route.request().url()).pathname.split('/').pop();
    const place = (places as Array<{ slug: string }>).find((item) => item.slug === slug) ?? makePlace(1);
    return route.fulfill({ json: { data: { ...place, multimedia: [] } } });
  });
  await page.route(/\/api\/catalogo\/servicios(\?.*)?$/, (route) => route.fulfill({ json: { data: [makeService(1), makeService(2)], pagination: { page: 1, limit: 50, total: 2 } } }));
  await page.route('**/api/viaje/clima**', (route) => route.fulfill({ json: { data: { timezone: null, current: { time: null, temperature: 24, apparentTemperature: 25, precipitation: 0, windSpeed: 8, weatherCode: 1, condition: 'Mayormente despejado' }, forecast: [] } } }));
  await page.route('**/api/agenda/**', (route) => route.fulfill({ json: { data: [], pagination: { page: 1, limit: 12, total: 0 } } }));
};
