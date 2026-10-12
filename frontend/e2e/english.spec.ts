import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures';

// Un turista con el navegador en inglés ve XploraSG en inglés y puede cambiar de idioma.
test.describe('English version', () => {
  test.use({ locale: 'en-US' });

  test('detects the browser language and asks the API for English content', async ({ page }) => {
    await mockApi(page);
    const request = page.waitForRequest((req) => req.url().includes('/api/catalogo/lugares') && req.url().includes('lang=en'));
    await page.goto('/');
    await request;
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('search')).toBeVisible();
    await expect(page.locator('#lugares article').first().getByText('Nature')).toBeVisible();
    const whatsapp = page.locator('#prestadores').getByRole('link').filter({ has: page.locator('svg') }).first();
    await expect(whatsapp).toHaveAttribute('href', /text=Hello/);
  });

  test('the language button switches to Spanish and remembers it', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Ver el sitio en español' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByPlaceholder(/Qué quieres conocer/)).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('?lang=en forces English even with a Spanish browser', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-MX' });
    const page = await context.newPage();
    await mockApi(page);
    await page.goto('/privacidad?lang=en');
    await expect(page.getByText('In case of discrepancy, the Spanish version prevails.')).toBeVisible();
    await context.close();
  });
});
