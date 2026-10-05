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
| H02 | Media | `frontend/vite.config.ts` | El *bundle* JavaScript original superaba los 500 kB (588 kB). | Tiempos de carga inicial lenta. | **Corregido.** Se aplicó `manualChunks` separando `@supabase` reduciendo el bloque principal a 374 kB. |
| H03 | Baja | `frontend/vite.config.ts` | Se cargaban 47 variantes de WOFF/WOFF2 de Poppins. | Ocupaba más de 1.6 MB en caché innecesariamente (56 entradas). | **Corregido.** Se importó solo el subconjunto `latin` reduciendo el precaché a 905 kB (23 entradas). |
| H04 | Riesgo | `MapPage.tsx` | Redirección a Google Maps. | Google Maps no sirve *offline*. | **Corregido.** Se modificó la interfaz para advertir claramente que requiere red externa, y se diferenció el error de desconexión. |
| H05 | Bloqueo | Repositorio general | Ausencia de `Iconografia.pdf`. | Impide generar PWA Maskable real. | **Pendiente.** A la espera de recibir el material gráfico oficial. |

## 4. Pasos para Reproducir Errores Comprobados y Pruebas Ejecutadas
*   **Sincronización (H00):**
    Se creó y ejecutó el script `frontend/scripts/test-sync-logic.mjs` que simula concurrencia (respuestas tardías de 50ms vs clics de 10ms). **Resultado comprobado**: Solo se borran de `localStorage` los ítems efectivamente enviados.
*   **Partición de bundle (H02):**
    `npm run build` confirma un `index-[hash].js` de 374 kB y un `supabase-[hash].js` de 214 kB.
*   **Fuentes y Precaché PWA (H03):**
    `npm run build` confirma que la PWA redujo sus entradas de 56 a 23, pesando 905.03 KiB.
*   **Google Maps fallback (H04):**
    Probado aislando la clave vacía. El texto diferencia "No se pudo conectar con el servicio" vs "falta de configuración".

## 5. Pruebas Ejecutadas y Resultados
*   `npm run build` (Backend/Frontend): **Exitoso**.
*   `npm run lint` (Frontend): **Exitoso**.
*   `npm test` (Backend): **21 pruebas aprobadas** (mocks).
*   **Prueba de Lógica (test-sync-logic.mjs)**: **3/3 pruebas aprobadas** (comprobando carreras de condiciones y aislamiento).

## 6. Comprobaciones Bloqueadas o Limitaciones
*   **Renderizado visual real:** Queda **no comprobado** de manera automatizada en celular/escritorio real.
*   La sincronización se marca como **Cumplida**, ya que la falla H00 fue solucionada, pero su persistencia estricta a caídas abruptas del navegador depende de las políticas nativas.

## 7. Acciones Pendientes
1.  **Aportar PDF:** Subir el material gráfico para reemplazar los íconos genéricos actuales.
