# PWA y consulta sin conexión

## Estado

La Fase 4E quedó implementada y verificada el 3 de octubre de 2026. XploraSG
puede abrir la aplicación y consultar el catálogo público previamente
sincronizado cuando el navegador no tiene red.

## Componentes

- Web App Manifest con nombre, colores, modo `standalone`, alcance e iconos
  propios de 192 y 512 píxeles.
- Service Worker generado por Workbox mediante `vite-plugin-pwa`.
- Precache de la aplicación compilada.
- IndexedDB `xplorasg-offline` para respuestas del catálogo.
- Indicador permanente `En línea` o `Sin conexión`.
- Caché de ejecución separada para catálogo, mosaicos de OpenStreetMap y
  multimedia pública.

## Estrategia de datos

Las consultas de municipios, categorías, lugares, fichas y servicios intentan
primero la API. Una respuesta correcta se conserva en IndexedDB con su ruta y
fecha de sincronización. Si la red falla, el frontend recupera la última
respuesta disponible para esa misma consulta.

El Service Worker agrega una segunda capa de resiliencia:

| Recurso | Estrategia | Vigencia máxima |
| --- | --- | ---: |
| Catálogo público | Network First | 7 días |
| Mosaicos de mapa visitados | Cache First | 14 días |
| Multimedia pública | Stale While Revalidate | 30 días |

El clima actualizado, las rutas nuevas, la autenticación y cualquier contenido
que nunca se haya sincronizado continúan requiriendo conexión. En el mapa sin
red se muestran los datos y marcadores guardados; sólo aparecen los mosaicos que
el dispositivo ya visitó.

## Prueba automatizada

`frontend/scripts/e2e-offline.mjs` usa Chrome instalado y `playwright-core` sin
descargar otro navegador. La prueba:

1. abre `/explorar` con red;
2. verifica municipios y categorías;
3. confirma que el Service Worker controla la página;
4. comprueba al menos tres respuestas en IndexedDB;
5. activa modo offline sólo en el navegador de prueba;
6. recarga `/explorar` y confirma el indicador `Sin conexión`;
7. navega a `/mapa` y verifica que los filtros siguen disponibles.

La ejecución validada recuperó tres respuestas locales y completó la navegación
`/explorar → /mapa` sin red. El frontend normal de Docker se restauró después de
la prueba y volvió a responder `200` en `http://localhost:5173/mapa`.

## Comandos

```bash
cd frontend
npm run icons:generate
npm run build
npm run pwa:verify
npm run test:offline
```

`test:offline` espera que la compilación de producción esté servida en
`http://localhost:5173`. Puede usarse otra dirección con `PWA_BASE_URL`.
