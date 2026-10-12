/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Las pruebas end-to-end se ejecutan con Playwright (npx playwright test), no con Vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
