# AUDITORÍA XPLORASG

## 1. Veredicto Sustentado
El proyecto **XploraSG** es funcional y sus recientes actualizaciones se han implementado correctamente dentro del alcance de las herramientas proporcionadas. Las mejoras de navegación, detalle de servicios y protección de sincronización están operativas y pasan todas las pruebas automatizadas de lógica de negocio. Sin embargo, existen limitaciones de diseño técnico (dependencia de variantes excesivas de fuentes, componentes agrupados en un solo *bundle*) y carencias documentales que impiden alcanzar el 100% de la identidad oficial visual.

## 2. Matriz de Requisitos

| Requisito | Estado | Observación |
| :--- | :--- | :--- |
| **Separación Agenda/Favoritos** | Cumplido | Implementado correctamente. Barra móvil adaptada; estado vacío útil para agenda. |
| **Sincronización Autenticada** | Cumplido | Integrado con `ignore` local, y filtrado seguro por `$1` (`user_id`) en backend. |
| **Diseño Móvil y UX** | Parcial | No evaluado visualmente debido a falta de herramientas nativas E2E en consola, pero estructuralmente presente. |
| **Identidad Visual (Logos)** | Pendiente | No se encontraron los archivos PDF (Iconografía/Logotipos) requeridos para generar recursos. |
| **Catálogo de 20 lugares y 16 servicios** | Cumplido | 20 lugares extraídos, 15 servicios públicos. El 16° documentado es un borrador en base de datos. |
| **Disponibilidad Offline PWA** | Parcial | Se incluye Poppins en *precaché*. Google Maps no está disponible *offline*, se usa como *fallback*. |
| **Build, Lint y Pruebas** | Cumplido | 21/21 pruebas de backend aprobadas. 0 errores en frontend. |

## 3. Tabla de Hallazgos

| ID | Gravedad | Archivo / Componente | Evidencia | Impacto | Recomendación / Estado Final |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H00** | **Alta** | `useFavorites.ts` | `clearLocalFavorites()` borraba todos los datos tras sincronizar, destruyendo favoritos guardados localmente mientras la petición estaba en vuelo. | Pérdida de datos del usuario bajo condiciones de carrera o conexiones lentas. | **Corregido.** Ahora registra los IDs exactos que entraron a sincronización y elimina solo esos usando `removeLocalFavorite(id)`. |
| H01 | Baja | `frontend/src/hooks/useFavorites.ts` | Uso de `catalogApi.places({ limit: 100 })` | Problemas de rendimiento si el catálogo escala. | Pendiente (Requiere rediseño de backend para paginar favoritos). |
| H02 | Media | `frontend/vite.config.ts` | El *bundle* JavaScript original superaba los 500 kB (588 kB). | Tiempos de carga inicial lenta. | **Parcial.** Se aplicó `manualChunks` separando `@supabase` (214 kB). Esto resuelve la advertencia técnica y paralela las descargas, pero no reduce el volumen total descargado al inicio, ya que AuthContext demanda Supabase de inmediato. |
| H03 | Baja | `frontend/vite.config.ts` | Se cargaban 47 variantes de WOFF/WOFF2 de Poppins. | Ocupaba más de 1.6 MB en caché innecesariamente (56 entradas). | **Corregido y Verificado.** Se importó solo el subconjunto `latin` reduciendo el precaché a 905 kB (23 entradas). |
| H04 | Riesgo | `MapPage.tsx` | Redirección a Google Maps. | Google Maps no sirve *offline*. | **Corregido (Pendiente revisión visual).** Se programó en el código la diferenciación de errores y el descargo de responsabilidad sobre el uso de red para Google Maps. |
| H05 | Bloqueo | Repositorio general | Ausencia de `Iconografia.pdf`. | Impide generar PWA Maskable real. | **Bloqueado.** A la espera de recibir el material gráfico oficial. |

## 4. Pasos para Reproducir Errores Comprobados y Pruebas Ejecutadas
*   **Sincronización (H00):**
    Se programó y ejecutó exitosamente el test unitario `test-sync-logic.mjs` que replica de forma determinista la lógica real usada en `useFavorites.ts`. Se ejecutaron flujos de *Fallo de red*, *Añadir ID distinto*, *Re-añadir el mismo ID* y *Cerrar sesión velozmente*. Todos demostraron que la memoria `localStorage` ahora se protege y no sufre pérdidas por carreras de condiciones. (Son pruebas unitarias a nivel Node).
*   **Partición de bundle (H02):**
    `npm run build` confirma un `index-[hash].js` de 374 kB y un `supabase-[hash].js` de 214 kB. Se aclara que ambos se cargan al inicio (no hay ahorro real de bytes procesados, solo de organización de chunks).
*   **Fuentes y Precaché PWA (H03):**
    `npm run build` confirma que la PWA redujo sus entradas de 56 a 23, pesando 905.03 KiB.
*   **Google Maps fallback (H04):**
    El código se auditó estáticamente en `MapPage.tsx` para garantizar que la bifurcación lógica (`? :`) separe el error nativo del proveedor de los errores de desconexión. No se modificaron credenciales.

## 5. Pruebas Ejecutadas y Resultados
*   `npm run build` (Backend/Frontend): **Exitoso**.
*   `npm run lint` (Frontend): **Exitoso**.
*   `npm test` (Backend): **21 pruebas aprobadas** (mocks unitarios).
*   **Prueba Lógica (test-sync-logic.mjs)**: **5/5 pruebas aprobadas** (pruebas unitarias independientes de React que evalúan el control de concurrencia y los cierres (closures) del hook original).

## 6. Comprobaciones Bloqueadas o Limitaciones (Falta de navegador real)
*   **Renderizado de interfaz y Rutas:** Al operar estrictamente por comandos (sin Cypress o Playwright configurado en el proyecto), **todas las comprobaciones de renderizado real quedan como no comprobadas**. Los estados de error de red (ORS vs Offline) y los clics de Favoritos se auditaron inspeccionando los componentes y simulando sus funciones base, pero no fueron verificados viendo la UI real en un DOM de navegador.
*   El modo *Offline* de la PWA se verifica parcialmente validando que el ServiceWorker incluya los archivos en *precaché*, pero su montaje físico sin internet requiere un navegador.

## 7. Acciones Pendientes
1.  **Aportar PDF:** Subir el material gráfico para reemplazar los íconos genéricos actuales.
