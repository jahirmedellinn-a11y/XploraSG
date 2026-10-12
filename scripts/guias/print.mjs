// Imprime las guías HTML (generadas por build.py) a PDF en frontend/public/guias.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// Playwright se toma de las dependencias del frontend.
const { chromium } = createRequire(path.resolve(here, '../../frontend/package.json'))('@playwright/test');
const out = path.resolve(here, '../../frontend/public/guias');
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
for (const name of ['guia-de-bolsillo', 'catalogo-de-vistas']) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(here, `${name}.html`)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(out, `xplorasg-${name}.pdf`), width: '148mm', height: '210mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.close();
}
await browser.close();
console.log('PDF listos en', out);
