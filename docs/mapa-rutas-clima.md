# Mapa rutas y clima

## Fase 4C mapa y geolocalización

La experiencia pública ya incluye las rutas `/explorar`, `/mapa`, `/servicios`
y `/lugares/:slug`. El mapa usa Leaflet y OpenStreetMap, muestra las seis
cabeceras municipales como referencias y reserva marcadores diferenciados para
naturaleza, cultura, aventura, gastronomía, hospedaje y servicios.

La ubicación se solicita únicamente al pulsar **Usar mi ubicación**. La interfaz
maneja permiso rechazado, indisponibilidad y tiempo de espera. Cuando existan
lugares aprobados con coordenadas, la aplicación calculará las distancias en el
cliente, ordenará los cinco más cercanos y permitirá abrir su ficha desde el
marcador.

Los lugares en borrador no se muestran. Las cabeceras municipales se identifican
como referencias para no confundirlas con atractivos turísticos.

## Fase 4D rutas y clima

El backend ofrece dos endpoints públicos con validación estricta de coordenadas:

- `GET /api/viaje/clima?latitud=21.2186&longitud=-99.4722`
- `POST /api/viaje/ruta`

Ejemplo del cuerpo de ruta:

```json
{
  "origen": { "latitud": 21.2186, "longitud": -99.4722 },
  "destino": { "latitud": 21.1378, "longitud": -99.6267 },
  "perfil": "driving-car"
}
```

Los perfiles permitidos son `driving-car`, `cycling-regular`, `foot-walking` y
`foot-hiking`. El frontend convierte la geometría devuelta a una línea de ruta
en Leaflet y muestra distancia y duración.

Open-Meteo no requiere clave. El pronóstico se consulta en tiempo real desde el
backend y se presenta en la ficha del lugar; no se persiste en PostgreSQL.
OpenRouteService requiere `OPEN_ROUTE_SERVICE_API_KEY` en el entorno del backend.
La clave no debe copiarse al frontend ni utilizar el prefijo `VITE_`.

## Verificación y dependencias de contenido

La Fase 4C fue revisada en escritorio y en un viewport móvil. El mapa cargó las
seis referencias municipales desde la API real. Los estados vacíos de lugares y
servicios son intencionales: Supabase conserva 20 lugares como borrador y no hay
servicios publicados.

La aceptación final de marcadores de lugares, cercanía, rutas hacia atractivos y
clima dentro de una ficha requiere al menos un lugar aprobado con coordenadas
verificadas. Hasta entonces la implementación permanece lista sin publicar datos
incompletos.

