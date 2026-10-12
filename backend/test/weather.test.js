const test = require('node:test');
const assert = require('node:assert/strict');
const { getWeather } = require('../dist/services/travelService');

test('el clima incluye humedad, índice UV, coordenadas y altitud del punto', async () => {
  const original = global.fetch;
  let requested = '';
  global.fetch = async (url) => {
    requested = String(url);
    return new Response(JSON.stringify({
      timezone: 'America/Mexico_City', latitude: 21.22, longitude: -99.53, elevation: 1049.6,
      current: { temperature_2m: 24, apparent_temperature: 25, precipitation: 0, weather_code: 1, wind_speed_10m: 8, relative_humidity_2m: 62, uv_index: 7.2 },
      daily: { time: ['2026-10-07'], weather_code: [1], temperature_2m_max: [28], temperature_2m_min: [14], precipitation_probability_max: [10], uv_index_max: [9] },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const data = await getWeather({ latitud: 21.2183, longitud: -99.5297 });
    assert.match(requested, /relative_humidity_2m/);
    assert.match(requested, /uv_index/);
    assert.deepEqual(data.location, { latitude: 21.2183, longitude: -99.5297, elevation: 1050 });
    assert.equal(data.current.humidity, 62);
    assert.equal(data.current.uvIndex, 7.2);
  } finally {
    global.fetch = original;
  }
});
