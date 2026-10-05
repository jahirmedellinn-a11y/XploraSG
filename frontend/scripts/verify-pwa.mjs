import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '..', 'dist');
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.webmanifest'), 'utf8'));
const serviceWorker = await readFile(resolve(dist, 'sw.js'), 'utf8');
const index = await readFile(resolve(dist, 'index.html'), 'utf8');

assert.equal(manifest.name, 'XploraSG');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, '/');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
assert.match(index, /manifest\.webmanifest/);
assert.match(index, /registerSW\.js/);
assert.match(serviceWorker, /xplorasg-catalogo-api/);
assert.match(serviceWorker, /xplorasg-map-tiles/);
assert.match(serviceWorker, /xplorasg-public-media/);

console.log('PWA verificada: manifest, registro, precache y cachés de ejecución presentes.');
