import { defineConfig, devices } from '@playwright/test';

// Las pruebas simulan todas las respuestas de la API (page.route), así que sólo necesitan el frontend.
// Por defecto levantan Vite en el puerto 4173; si ya tienes la app corriendo, usa PW_BASE_URL=http://localhost:5173.
const baseURL = process.env.PW_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    // El sitio elige idioma según el navegador: las pruebas base corren en español (es-MX).
    locale: 'es-MX',
    // Opcional: usar un Chromium ya instalado en el sistema.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: 'npx vite --port 4173 --strictPort',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { VITE_API_URL: 'http://api.xplorasg.test' },
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
