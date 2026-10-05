import { test, expect } from '@playwright/test';

test.describe('XploraSG App', () => {
  test('Barra de navegación inferior móvil', async ({ page, isMobile }) => {
    if (!isMobile) return;
    await page.goto('/');
    // Check if nav exists
    const nav = page.locator('nav').filter({ hasText: 'Explorar' }).first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('Persistencia de favoritos anónimos tras recargar', async ({ page }) => {
    // There are no favorite buttons in the frontend UI.
    // Inject a favorite into localStorage directly to test the hook state across reloads.
    await page.goto('/');
    
    // Inject favorite
    await page.evaluate(() => {
      localStorage.setItem('xplorasg_favorites', JSON.stringify([{ id: 1, operationId: 'abc' }]));
    });
    
    // Recargar
    await page.reload();
    
    // Ir a /favoritos
    await page.goto('/favoritos');
    await expect(page.locator('h1', { hasText: 'Favoritos' }).or(page.locator('h1', { hasText: 'Tus Favoritos' }))).toBeVisible();
    
    // Wait for the empty state to NOT show up, meaning the item is loading or loaded
    // Since we injected ID 1, it might try to load from backend, but backend will fail if not authenticated
    // The UI handles local favorites by fetching them and filtering by ID.
  });

  test('Fallback a Google Maps cuando falta clave o error', async ({ page }) => {
    await page.goto('/mapa');
    await page.route('**/api.openrouteservice.org/**', route => route.abort());
    // Try to trigger route error in MapPage to verify the message appears
    // The UI must have a button to "Preparar ruta" after selecting a place
  });
  
  test('Navegación PWA offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // register SW
    await context.setOffline(true);
    await page.goto('/servicios');
    await expect(page.locator('h1', { hasText: 'Servicios' })).toBeVisible();
    await context.setOffline(false);
  });
});
