import { test, expect } from '@playwright/test';

test.describe('XploraSG App - Flujo de Favoritos Anónimos', () => {
  const performFavoritesFlow = async (page: any, isMobile: boolean) => {
    // 1. Guardar desde una tarjeta
    await page.goto('/explorar');
    // Buscamos la primera tarjeta de lugar
    const firstCard = page.locator('article').first();
    const favButton = firstCard.locator('button[aria-label="Guardar en favoritos"], button[aria-label="Quitar de favoritos"]');
    
    // Si ya está guardado (por restos del state local), lo quitamos primero
    if (await favButton.getAttribute('aria-pressed') === 'true') {
      await favButton.click();
      await page.waitForTimeout(500);
    }
    
    // Lo guardamos
    await favButton.click();
    await expect(favButton).toHaveAttribute('aria-pressed', 'true');
    const placeName = await firstCard.locator('h2').innerText();

    // 2. Ver el lugar en /favoritos
    await page.goto('/favoritos');
    await expect(page.locator('h1', { hasText: /Favoritos/i })).toBeVisible();
    const favCard = page.locator('article').filter({ hasText: placeName });
    await expect(favCard).toBeVisible();

    // 3. Recargar y comprobar persistencia
    await page.reload();
    await expect(page.locator('article').filter({ hasText: placeName })).toBeVisible();

    // 4. Abrir el detalle y comprobar que aparece guardado
    const detailLink = favCard.locator('a', { hasText: 'Ver lugar' });
    await detailLink.click();
    
    const detailFavBtn = page.locator('button[aria-label="Quitar de favoritos"]');
    await expect(detailFavBtn).toBeVisible();
    await expect(detailFavBtn).toHaveAttribute('aria-pressed', 'true');

    // 5. Quitar desde el detalle y comprobar que desaparece de favoritos
    await detailFavBtn.click();
    await expect(detailFavBtn).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/favoritos');
    await expect(page.locator('article').filter({ hasText: placeName })).not.toBeVisible();
  };

  test('Flujo completo en escritorio', async ({ page, isMobile }) => {
    if (isMobile) return;
    await performFavoritesFlow(page, false);
  });

  test('Flujo completo en tamaño móvil', async ({ page, isMobile }) => {
    if (!isMobile) return;
    await performFavoritesFlow(page, true);
  });
});

test.describe('Otras comprobaciones', () => {
  test('Barra de navegación inferior móvil', async ({ page, isMobile }) => {
    if (!isMobile) return;
    await page.goto('/');
    const nav = page.locator('nav[aria-label="Navegación móvil inferior"]');
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('Fallback a Google Maps cuando falta clave o error', async ({ page }) => {
    await page.goto('/mapa');
    await page.route('**/api.openrouteservice.org/**', route => route.abort());
    // Intentar buscar ruta
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
