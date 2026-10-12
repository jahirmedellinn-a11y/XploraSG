import { expect, test } from '@playwright/test';
import { makePlace, mockApi } from './fixtures';

test.describe('Inicio', () => {
  test('muestra el buscador, los lugares con actividades y los prestadores con WhatsApp', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sierra Gorda');
    await expect(page.getByRole('search')).toBeVisible();

    const cards = page.locator('#lugares article');
    await expect(cards).toHaveCount(3);
    await expect(cards.first().getByRole('list', { name: 'Actividades' })).toContainText('Senderismo');

    const whatsapp = page.locator('#prestadores').getByRole('link', { name: /Reservar o contactar/ }).first();
    await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/524412960445\?text=/);
  });

  test('el buscador envía el término al catálogo', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    const request = page.waitForRequest((req) => req.url().includes('/api/catalogo/lugares') && req.url().includes('q=cascada'));
    await page.getByPlaceholder(/Qué quieres conocer/).fill('cascada');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await request;
  });

  test('paginación con "Cargar más"', async ({ page }) => {
    const first = Array.from({ length: 24 }, (_, index) => makePlace(index + 1));
    const second = Array.from({ length: 3 }, (_, index) => makePlace(index + 25));
    await mockApi(page, { places: first, pageTwo: second, total: 27 });
    await page.goto('/explorar');
    await expect(page.locator('#lugares article')).toHaveCount(24);
    const loadMore = page.getByRole('button', { name: 'Cargar más' });
    await loadMore.click();
    await expect(page.locator('#lugares article')).toHaveCount(27);
    await expect(loadMore).toBeHidden();
  });
});

test.describe('Favoritos anónimos', () => {
  test('guardar, ver, persistir y quitar un favorito', async ({ page }) => {
    await mockApi(page, { places: [makePlace(1, { nombre: 'Cascada E2E' })] });
    await page.goto('/explorar');

    const card = page.locator('#lugares article').filter({ hasText: 'Cascada E2E' });
    await card.getByRole('button', { name: 'Guardar en favoritos' }).click();
    await expect(card.getByRole('button', { name: 'Quitar de favoritos' })).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/favoritos');
    await expect(page.locator('article').filter({ hasText: 'Cascada E2E' })).toBeVisible();
    await page.reload();
    const favorite = page.locator('article').filter({ hasText: 'Cascada E2E' });
    await expect(favorite).toBeVisible();

    await favorite.getByRole('link', { name: /Ver lugar/ }).click();
    const detailButton = page.getByRole('button', { name: 'Quitar de favoritos' });
    await expect(detailButton).toHaveAttribute('aria-pressed', 'true');
    await detailButton.click();
    await expect(page.getByRole('button', { name: 'Guardar en favoritos' })).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/favoritos');
    await expect(page.locator('article').filter({ hasText: 'Cascada E2E' })).toHaveCount(0);
  });
});

test.describe('Seguridad y navegación', () => {
  test('un enlace directo a /admin sin sesión manda a iniciar sesión', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  });

  test('barra de navegación inferior en móvil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Sólo aplica en móvil');
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación móvil inferior' })).toBeVisible();
  });
});

test.describe('Mapa', () => {
  test('si el servicio de rutas falla, ofrece Google Maps sin romper el mapa', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.21, longitude: -99.47 });
    await mockApi(page, { places: [makePlace(1, { nombre: 'Mirador E2E' })] });
    await page.route('**/api/viaje/ruta', (route) => route.fulfill({ status: 503, json: { error: 'El servicio de rutas aún no tiene configurada su clave.' } }));

    await page.goto('/mapa');
    await page.getByRole('button', { name: /Usar mi ubicación/ }).click();
    await expect(page.getByText(/Ubicación encontrada/)).toBeVisible();
    await page.locator('.leaflet-marker-icon:has(.xplora-marker)').first().evaluate((element: HTMLElement) => element.click());
    await page.getByRole('button', { name: 'Preparar ruta' }).click();
    await page.getByRole('button', { name: 'Trazar ruta' }).click();

    await expect(page.getByText(/no está disponible por ahora/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });
});

test.describe('Asistente', () => {
  test('conversa y muestra referencias del catálogo', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/asistente/consulta', (route) => route.fulfill({
      json: { data: { respuesta: '⛪ Las misiones franciscanas son Patrimonio Mundial.', referencias: [{ tipo: 'lugar', id: 1, nombre: 'Misión de Jalpan', slug: 'lugar-1', municipio: 'Jalpan de Serra', resumen: null, distanciaKm: null }], sugerencias: ['¿Qué fiestas vienen?'], clima: null, modo: 'local', aviso: '' } },
    }));
    await page.goto('/asistente');
    await page.getByLabel('Escribe tu pregunta').fill('Quiero conocer las misiones');
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(page.getByText('Las misiones franciscanas son Patrimonio Mundial.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Misión de Jalpan/ })).toHaveAttribute('href', '/lugares/lugar-1');
  });

  test('los accesos rápidos preguntan y las tarjetas traen acciones concretas', async ({ page }) => {
    await mockApi(page);
    let asked = '';
    await page.route('**/api/asistente/consulta', async (route) => {
      asked = JSON.parse(route.request().postData() || '{}').pregunta;
      await route.fulfill({
        json: { data: {
          respuesta: 'Ruta propuesta en la Sierra Gorda, en este orden:',
          referencias: [
            { tipo: 'lugar', id: 1, nombre: 'Cascada E2E', slug: 'cascada-e2e', municipio: 'Pinal de Amoles', resumen: 'Cascada.', distanciaKm: null, enMapa: true },
            { tipo: 'servicio', id: 7, nombre: 'Fonda E2E', slug: 'fonda-e2e', municipio: 'Jalpan de Serra', resumen: null, distanciaKm: null, contacto: 'Tel. 441 296 0445' },
          ],
          sugerencias: ['Comida cercana'], clima: null, modo: 'local', aviso: '',
        } },
      });
    });
    await page.goto('/asistente');
    await page.getByRole('button', { name: 'Ruta para hoy' }).click();
    await expect(page.getByText('Ruta propuesta en la Sierra Gorda')).toBeVisible();
    expect(asked).toBe('Ruta para hoy');
    await expect(page.getByRole('link', { name: 'Ver Cascada E2E en el mapa' })).toHaveAttribute('href', '/mapa?lugar=cascada-e2e');
    await expect(page.getByRole('button', { name: 'Guardar en favoritos' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contactar a Fonda E2E por WhatsApp' })).toHaveAttribute('href', /wa\.me\/524412960445/);
    await expect(page.getByRole('group', { name: 'Accesos rápidos' }).getByRole('button', { name: 'Comida cercana' })).toBeVisible();
  });

  test('sin conexión explica qué sigue disponible y si falla permite reintentar', async ({ page, context }) => {
    await mockApi(page);
    let calls = 0;
    await page.route('**/api/asistente/consulta', async (route) => {
      calls += 1;
      if (calls === 1) await route.fulfill({ status: 500, json: { error: 'No fue posible consultar el asistente en este momento.' } });
      else await route.fulfill({ json: { data: { respuesta: 'Listo, aquí va.', referencias: [], sugerencias: [], clima: null, modo: 'local', aviso: '' } } });
    });
    await page.goto('/asistente');
    await page.getByLabel('Escribe tu pregunta').fill('Quiero conocer las misiones');
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(page.getByRole('alert')).toContainText('No fue posible consultar');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText('Listo, aquí va.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await context.setOffline(true);
    await expect(page.getByText('Chatboot necesita conexión para responder.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir a Favoritos' })).toHaveAttribute('href', '/favoritos');
    await context.setOffline(false);
  });
});
