const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildCatalogAnswer,
  normalizeForSearch,
  selectGroundedItems,
} = require('../dist/services/assistantService');

const items = [
  { tipo: 'lugar', id: 1, nombre: 'Misión de Jalpan', slug: 'mision-de-jalpan', municipio: 'Jalpan de Serra', descripcion: 'Misión histórica.', detalle: 'Visita cultural.', latitud: '21.204', longitud: '-99.464' },
  { tipo: 'servicio', id: 2, nombre: 'Hotel local', slug: 'hotel-local', municipio: 'Jalpan de Serra', descripcion: 'Hospedaje.', detalle: null, latitud: null, longitud: null },
  { tipo: 'lugar', id: 3, nombre: 'Mirador Cuatro Palos', slug: 'cuatro-palos', municipio: 'Pinal de Amoles', descripcion: 'Mirador de montaña.', detalle: null, latitud: '21.080', longitud: '-99.662' },
];

test('normaliza acentos para buscar municipios', () => {
  assert.equal(normalizeForSearch('¿Qué hay en Jalpan de Serra?'), 'que hay en jalpan de serra');
});

test('limita la respuesta al municipio y tipo solicitados', () => {
  const result = selectGroundedItems('¿Qué servicios hay en Jalpan de Serra?', items);
  assert.deepEqual(result.map((item) => item.nombre), ['Hotel local']);
});

test('ordena lugares cercanos usando sólo coordenadas del catálogo', () => {
  const result = selectGroundedItems('¿Qué lugares están cerca?', items, { latitud: 21.2, longitud: -99.46 });
  assert.equal(result[0].nombre, 'Misión de Jalpan');
  assert.ok(result[0].distanciaKm < result[1].distanciaKm);
});

test('declara insuficiencia cuando no existen referencias publicadas', () => {
  assert.match(buildCatalogAnswer([]), /no hay información publicada suficiente/i);
});
