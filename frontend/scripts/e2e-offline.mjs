import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.PWA_BASE_URL || 'http://localhost:5173';
const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDirectory = resolve(import.meta.dirname, '..', 'test-results');

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ serviceWorkers: 'allow' });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/explorar`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Lugares para conocer' }).waitFor();
  assert.equal(await page.locator('#municipality-filter option').count(), 7);
  assert.equal(await page.locator('#category-filter option').count(), 7);

  // La segunda navegación garantiza que la página esté controlada por el
  // Service Worker recién instalado.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  const cachedEntries = await page.evaluate(async () => new Promise((resolveCount, reject) => {
    const request = indexedDB.open('xplorasg-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('catalog-responses', 'readonly');
      const countRequest = transaction.objectStore('catalog-responses').count();
      countRequest.onsuccess = () => resolveCount(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    };
  }));
  assert.ok(Number(cachedEntries) >= 3, `Se esperaban al menos 3 respuestas locales; se encontraron ${cachedEntries}.`);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Lugares para conocer' }).waitFor();
  await page.getByText('Sin conexión', { exact: true }).last().waitFor();
  assert.equal(await page.locator('#municipality-filter option').count(), 7);
  assert.equal(await page.locator('#category-filter option').count(), 7);

  await page.goto(`${baseUrl}/mapa`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Mapa de la Sierra Gorda' }).waitFor();
  assert.equal(await page.locator('#map-municipality option').count(), 7);

  await mkdir(outputDirectory, { recursive: true });
  await page.screenshot({ path: resolve(outputDirectory, 'pwa-offline.png'), fullPage: true });
  console.log(`PWA offline verificada: ${cachedEntries} respuestas locales y navegación /explorar → /mapa sin red.`);
} finally {
  await context.setOffline(false).catch(() => undefined);
  await browser.close();
}
