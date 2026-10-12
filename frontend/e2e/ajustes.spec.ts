import { expect, test } from '@playwright/test';
import { makePlace, mockApi } from './fixtures';

// Ajustes de octubre: Chatboot con voz, clima de montaña y limpieza de inicio, cuenta y "Sobre nosotros".

test.describe('Chatboot', () => {
  test('dicta por voz, envía solo y lee la respuesta en voz alta', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__spoken = [] as string[];
      class FakeRecognition {
        lang = '';
        onresult: ((event: unknown) => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        start() {
          setTimeout(() => {
            this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Comida cercana' } }] });
            this.onend?.();
          }, 50);
        }
        stop() { this.onend?.(); }
        abort() {}
      }
      w.SpeechRecognition = FakeRecognition;
      w.webkitSpeechRecognition = FakeRecognition;
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: { speak: (u: { text: string }) => (w.__spoken as string[]).push(u.text), cancel: () => {}, getVoices: () => [] },
      });
    });
    await mockApi(page);
    let asked = '';
    await page.route('**/api/asistente/consulta', async (route) => {
      asked = JSON.parse(route.request().postData() || '{}').pregunta;
      await route.fulfill({ json: { data: { respuesta: 'Para comer cocina serrana en la Sierra Gorda:', referencias: [], sugerencias: [], clima: null, modo: 'local', aviso: '' } } });
    });
    await page.goto('/asistente');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu guía de campo');
    await expect(page.getByText('Chatboot', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Leer las respuestas de Chatboot en voz alta' }).click();
    await page.getByRole('button', { name: 'Dictar pregunta' }).click();
    await expect(page.getByText('Para comer cocina serrana en la Sierra Gorda:')).toBeVisible();
    expect(asked).toBe('Comida cercana');
    const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
    expect(spoken.join(' ')).toContain('Para comer cocina serrana');
  });

  test('sin soporte de voz no muestra el micrófono', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      delete w.SpeechRecognition;
      delete w.webkitSpeechRecognition;
    });
    await mockApi(page);
    await page.goto('/asistente');
    await expect(page.getByLabel('Escribe tu pregunta')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dictar pregunta' })).toHaveCount(0);
  });
});

test('el inicio ya no muestra la sección "Cómo funciona"', async ({ page }) => {
  await mockApi(page);
  await page.goto('/explorar');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toHaveCount(0);
});

test('el clima de la ficha muestra lecturas de montaña y la posición del lugar', async ({ page }) => {
  await mockApi(page, { places: [makePlace(1, { latitud: '21.2183', longitud: '-99.5297', altitud: null })] });
  await page.route('**/api/viaje/clima**', (route) => route.fulfill({ json: { data: {
    timezone: null,
    location: { latitude: 21.2183, longitude: -99.5297, elevation: 1050 },
    current: { time: null, temperature: 24, apparentTemperature: 25, precipitation: 0, windSpeed: 8, humidity: 62, uvIndex: 7, weatherCode: 1, condition: 'Mayormente despejado' },
    forecast: [],
  } } }));
  await page.goto('/lugares/lugar-1');
  for (const text of ['21.2183° N', '99.5297° O', '1,050 m.s.n.m.', '62 %', '7 · alto', '25°', '8 km/h']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  for (const label of ['Latitud', 'Longitud', 'Altitud', 'Índice UV', 'Sensación térmica', 'Viento', 'Humedad']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});

test('la pantalla de cuenta muestra sólo el formulario, sin panel lateral ni textos técnicos', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByText('Guarda, planea y comparte tu viaje.')).toHaveCount(0);
  await expect(page.getByText('Guías para llevar')).toHaveCount(0);
  await expect(page.getByText(/TLS|JWT|inactividad|Supabase/)).toHaveCount(0);
});

test('"Sobre nosotros" ya no muestra el bloque de cifras', async ({ page }) => {
  await mockApi(page);
  await page.goto('/nosotros');
  await expect(page.getByRole('heading', { name: 'Quiénes somos' })).toBeVisible();
  await expect(page.getByText('XploraSG en cifras')).toHaveCount(0);
  await expect(page.getByText('lugares verificados')).toHaveCount(0);
});
