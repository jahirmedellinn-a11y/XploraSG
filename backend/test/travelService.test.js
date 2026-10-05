const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  describeWeatherCode,
  parseCoordinate,
  parsePoint,
  parseRouteProfile,
} = require('../dist/services/travelService');

test('valida coordenadas y rechaza valores fuera del planeta', () => {
  assert.equal(parseCoordinate('21.2186', -90, 90), 21.2186);
  assert.equal(parseCoordinate(-99.4722, -180, 180), -99.4722);
  assert.equal(parseCoordinate('91', -90, 90), null);
  assert.equal(parseCoordinate('texto', -90, 90), null);
  assert.deepEqual(parsePoint({ latitud: 21.2, longitud: -99.5 }), { latitud: 21.2, longitud: -99.5 });
  assert.equal(parsePoint({ latitud: null, longitud: -99.5 }), null);
});

test('acepta únicamente perfiles de ruta permitidos', () => {
  assert.equal(parseRouteProfile('driving-car'), 'driving-car');
  assert.equal(parseRouteProfile('foot-hiking'), 'foot-hiking');
  assert.equal(parseRouteProfile('flying'), null);
});

test('traduce códigos meteorológicos WMO sin romper códigos desconocidos', () => {
  assert.equal(describeWeatherCode(0), 'Despejado');
  assert.equal(describeWeatherCode(95), 'Tormenta eléctrica');
  assert.equal(describeWeatherCode(999), 'Condición variable');
});

