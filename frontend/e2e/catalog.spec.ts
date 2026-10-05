import { test, expect } from '@playwright/test';

test.describe('Catálogo y Paginación', () => {
  test('Paginación en ExplorePage con Cargar más', async ({ page }) => {
    const mockPlacesPage1 = Array.from({ length: 12 }).map((_, i) => ({
      id: i + 1,
      slug: `lugar-${i + 1}`,
      nombre: `Lugar de Prueba ${i + 1}`,
      municipio: 'Prueba',
      categoria: 'Aventura'
    }));
    
    const mockPlacesPage2 = Array.from({ length: 3 }).map((_, i) => ({
      id: i + 13,
      slug: `lugar-${i + 13}`,
      nombre: `Lugar de Prueba ${i + 13}`,
      municipio: 'Prueba',
      categoria: 'Aventura'
    }));

    await page.route('**/api/catalogo/lugares**', async route => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page');
      
      if (pageParam === '1' || !pageParam) {
        await route.fulfill({
          status: 200,
          json: { data: mockPlacesPage1, pagination: { page: 1, limit: 12, total: 15 } }
        });
      } else {
        await route.fulfill({
          status: 200,
          json: { data: mockPlacesPage2, pagination: { page: 2, limit: 12, total: 15 } }
        });
      }
    });

    await page.goto('/explorar');
    await expect(page.locator('article')).toHaveCount(12);
    
    const loadMoreBtn = page.locator('button', { hasText: /Cargar m/ });
    await expect(loadMoreBtn).toBeVisible();
    await loadMoreBtn.click();
    await expect(page.locator('article')).toHaveCount(15);
    await expect(loadMoreBtn).not.toBeVisible();
  });
});

test.describe('Catálogo Offline PWA', () => {
  test('Flujo offline conserva contenido previamente consultado', async ({ page, context }) => {
    const mockPlace = {
      id: 999,
      slug: 'lugar-offline-test',
      nombre: 'Cueva del Test',
      descripcion: 'Descripción que debe persistir offline',
      municipio: 'Jalpan',
      categoria: 'Naturaleza'
    };

    await page.route('**/api/catalogo/lugares?*', async route => {
      await route.fulfill({
        status: 200,
        json: { data: [mockPlace], pagination: { page: 1, limit: 12, total: 1 } }
      });
    });

    await page.route('**/api/catalogo/lugares/lugar-offline-test', async route => {
      await route.fulfill({
        status: 200,
        json: { data: mockPlace }
      });
    });

    // 1. Consulta con conexión
    await page.goto('/explorar');
    await expect(page.locator('h2', { hasText: 'Cueva del Test' })).toBeVisible();
    
    // Visitamos directamente
    await page.goto('/lugares/lugar-offline-test');
    await expect(page.locator('h1', { hasText: 'Cueva del Test' })).toBeVisible();

    // 2. Desconexión
    await context.setOffline(true);
    
    // 3. Recarga offline
    await page.goto('/explorar');
    await expect(page.locator('h2', { hasText: 'Cueva del Test' })).toBeVisible();
    await expect(page.locator('text=Modo sin conexión')).toBeVisible();
    
    await page.goto('/lugares/lugar-offline-test');
    await expect(page.locator('h1', { hasText: 'Cueva del Test' })).toBeVisible();
    await expect(page.locator('text=Sin conexión')).toBeVisible();

    // 4. Primera visita offline sin datos guardados
    await page.goto('/lugares/lugar-fantasma');
    await expect(page.locator('text=No fue posible cargar')).toBeVisible();
    
    // 5. Recuperación
    await context.setOffline(false);
    await page.route('**/api/catalogo/lugares/lugar-fantasma', async route => {
      await route.fulfill({
        status: 200,
        json: { data: { ...mockPlace, nombre: 'Lugar Fantasma' } }
      });
    });
    
    await page.reload();
    await expect(page.locator('h1', { hasText: 'Lugar Fantasma' })).toBeVisible();
  });
});
