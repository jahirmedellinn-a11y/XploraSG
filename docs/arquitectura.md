# Arquitectura de XploraSG

## Visión General
XploraSG utiliza una arquitectura cliente-servidor desacoplada:

- **Frontend:** React, Vite y TypeScript como PWA con Service Worker, IndexedDB
  e indicador de conectividad.
- **Backend:** API RESTful con Node.js, Express y TypeScript.
- **Base de datos:** PostgreSQL local para desarrollo y PostgreSQL administrado por Supabase para integración/producción.
- **Autenticación:** Supabase Auth en la Fase 4A, manteniendo un modo DEV temporal y explícito.
- **Mapa:** Leaflet con teselas de OpenStreetMap, marcadores semánticos y Browser Geolocation API.
- **Rutas y clima:** proxy del backend hacia OpenRouteService y Open-Meteo para no exponer claves en el cliente.

## FASE 1
Se ha completado la inicialización de la estructura de carpetas, configuraciones de TypeScript, entorno de Docker y dependencias fundamentales. Ningún dato real ni implementación de base de datos se ha realizado en esta fase.

## Estado actual

Las fases 0 a 4A están cerradas y verificadas. La Fase 4B contiene 20 lugares,
16 servicios y 16 prestadores en borrador, además de la bandeja administrativa;
continúa abierta por derechos de imagen, coordenadas y validación editorial. La
Fase 4C cuenta con implementación funcional y revisión adaptable; su aceptación
con sitios cercanos depende de que 4B publique coordenadas reales. La Fase 4D
tiene clima conectado y el flujo de rutas preparado, pendiente de configurar la
clave de OpenRouteService y disponer de destinos aprobados. La Fase 4E está
cerrada con PWA instalable, cachés, IndexedDB, indicador de conectividad y prueba
automatizada real sin red.
