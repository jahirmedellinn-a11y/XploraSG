import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'XploraSG',
        short_name: 'XploraSG',
        description: 'Plataforma turística de la Sierra Gorda',
        theme_color: '#064e3b',
        background_color: '#f7f7f2',
        lang: 'es-MX',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/xplorasg-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/xplorasg-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/[^/]+\/api\/catalogo\/(municipios|categorias|lugares|servicios)(?:\/|\?|$)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'xplorasg-catalogo-api',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'xplorasg-map-tiles',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            urlPattern: /\/storage\/v1\/object\/public\/xplorasg-public\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'xplorasg-public-media',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
