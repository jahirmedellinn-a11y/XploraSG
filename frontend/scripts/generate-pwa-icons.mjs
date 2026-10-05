import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(resolve(root, 'public', 'xplorasg-icon.svg'), 'utf8');
const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath, headless: true });

try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${source}`);
    await page.screenshot({ path: resolve(root, 'public', `xplorasg-icon-${size}.png`) });
    await page.close();
  }
  console.log('Iconos PWA generados: 192 y 512 px.');
} finally {
  await browser.close();
}
