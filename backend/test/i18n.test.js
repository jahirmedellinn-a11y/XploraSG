const test = require('node:test');
const assert = require('node:assert/strict');
const { localizeRow, getLang } = require('../dist/services/i18n');
const { runAssistantEngine, detectIntents } = require('../dist/services/assistantEngine');
const { describeWeatherCode } = require('../dist/services/travelService');

test('getLang sólo acepta es/en y usa español por defecto', () => {
  assert.equal(getLang({ query: { lang: 'en' } }), 'en');
  assert.equal(getLang({ query: { lang: 'EN' } }), 'en');
  assert.equal(getLang({ query: { lang: 'fr' } }), 'es');
  assert.equal(getLang({ query: {} }), 'es');
});

test('localizeRow sustituye campos traducidos y conserva el español si falta alguno', () => {
  const row = { nombre: 'Cascada', descripcion: 'Una cascada.', horarios: '9 a 17 h', traducciones: { en: { descripcion: 'A waterfall.', inventado: 'x' } } };
  assert.deepEqual(localizeRow(row, 'en'), { nombre: 'Cascada', descripcion: 'A waterfall.', horarios: '9 a 17 h' });
  assert.deepEqual(localizeRow(row, 'es'), { nombre: 'Cascada', descripcion: 'Una cascada.', horarios: '9 a 17 h' });
  assert.deepEqual(localizeRow({ descripcion: 'x', traducciones: null }, 'en'), { descripcion: 'x' });
});

test('el asistente entiende y responde en inglés con textos traducidos', () => {
  const items = [{
    tipo: 'servicio', id: 4, slug: 'hotel', nombre: 'Hotel Misión Jalpan', municipio: 'Jalpan de Serra', categoria: 'Hospedaje',
    descripcion: 'Hotel colonial.', actividades: null, horarios: null, contacto: 'Tel. 441 296 0445', precio: 'Desde $1,800',
    latitud: null, longitud: null, traducciones: { en: { descripcion: 'Colonial-style hotel.', precio: 'From $1,800' } },
  }];
  assert.ok(detectIntents('where can i stay').includes('hospedaje'));
  const result = runAssistantEngine({ question: 'Where can I stay in Jalpan?', items, municipalities: ['Jalpan de Serra'], weather: null, events: [], origin: null, firstMessage: false, lang: 'en' });
  assert.match(result.respuesta, /Places to stay in Jalpan de Serra/);
  assert.match(result.respuesta, /Colonial-style hotel/);
  assert.match(result.respuesta, /From \$1,800/);
  assert.equal(result.referencias[0].resumen, 'Colonial-style hotel.');
  assert.ok(result.sugerencias.every((s) => /^[A-Z]/.test(s) && !/¿/.test(s)));
});

test('el clima se describe en el idioma pedido', () => {
  assert.equal(describeWeatherCode(63, 'en'), 'Moderate rain');
  assert.equal(describeWeatherCode(63), 'Lluvia moderada');
});

test('se quitan los marcadores "[Enlace a Google Maps]" de los textos', () => {
  const row = { direccion: 'A pocos kilómetros de Peñamiller. [Enlace a Google Maps]', traducciones: { en: { direccion: 'A few km from Peñamiller. [Google Maps link]' } } };
  assert.equal(localizeRow(row, 'es').direccion, 'A pocos kilómetros de Peñamiller.');
  assert.equal(localizeRow(row, 'en').direccion, 'A few km from Peñamiller.');
});
