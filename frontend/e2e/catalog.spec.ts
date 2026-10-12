import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures';

test.describe('Catálogo sin conexión', () => {
  test('conserva el directorio de servicios consultado previamente', async ({ page }) => {
    await mockApi(page);
    await page.goto('/servicios');
    await expect(page.locator('article')).toHaveCount(2);

    // Se corta la API (sin conexión) y se recarga: debe usar la copia guardada en IndexedDB.
    await page.route('**/api/**', (route) => route.abort('internetdisconnected'));
    await page.reload();
    await expect(page.getByText(/Modo sin conexión/)).toBeVisible();
    await expect(page.locator('article')).toHaveCount(2);
  });
});
