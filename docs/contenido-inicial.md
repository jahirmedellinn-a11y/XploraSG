# Inventario inicial de contenido

## Estado

Las fichas DOCX entregadas contienen información estructurada para 20 lugares
turísticos y 16 servicios. El texto se importó a Supabase como `borrador`; no se
publicó ningún registro. Sólo Las Adjuntas incluye coordenadas numéricas en la
fuente original, pero aún no tienen respaldo cartográfico verificable.

El 3 de octubre de 2026 se incorporaron las coordenadas exactas de las cinco
misiones franciscanas publicadas por UNESCO. Esas cinco ubicaciones se marcan
como `verificada`; Las Adjuntas permanece como `candidata`. Los resultados de
OpenStreetMap/Nominatim de otros 11 lugares se guardaron únicamente para
revisión en `content/fichas/coordenadas_auditoria.json`, sin aplicarlos a la
base de datos. Tres lugares no produjeron una coincidencia útil.

La plantilla `Plantilla_XploraSG_20_Puntos_15_Servicios.xlsx` confirma un objetivo
de 20 puntos turísticos y 15 servicios comunitarios. Las fichas posteriores
contienen 16 servicios identificables. Se conservaron los 16 como borradores
para no desechar una fuente real de manera arbitraria.

## Lugares detectados

| Municipio | Lugares |
| --- | --- |
| Jalpan de Serra | Misión de Jalpan; Misión de Tancoyol; Presa Jalpan; Tancama |
| Arroyo Seco | Las Adjuntas; Misión de San Miguel Concá; Sótano del Barro |
| Landa de Matamoros | Misión de Landa; Misión de Tilaco; Neblinas; Río Verdito |
| Pinal de Amoles | Cuatro Palos; El Chuveje; Mirador de Cristal |
| Peñamiller | Balneario El Oasis; Cañón del Paraíso; Vestigios Prehistóricos |
| San Joaquín | Cascadas Maravilla; Grutas de los Herrera; Ranas |

La carpeta `bosque, biking hiking` se trata como material de actividades, no
como un lugar adicional. Las imágenes sueltas `pinal*.jpg` requieren clasificación
antes de asociarse con Cuatro Palos, El Chuveje o Mirador de Cristal.

## Diferencia entre la plantilla y el Drive

La hoja `Control` de la plantilla distribuye los 20 lugares como 4 en Jalpan,
3 en Arroyo Seco, 3 en Landa, 3 en Pinal, 3 en Peñamiller y 4 en San Joaquín.
Las carpetas del Drive contienen 4 en Jalpan, 3 en Arroyo Seco, 4 en Landa,
3 en Pinal, 3 en Peñamiller y 3 en San Joaquín.

No falta ningún registro en el total, pero un lugar está asignado de forma
distinta entre ambos materiales. La semilla sigue los nombres y municipios del
Drive y conserva los 20 registros como `borrador` hasta validar si `Río Verdito`
pertenece a Landa o si falta un cuarto lugar de San Joaquín en las imágenes.

## Servicios extraídos

La distribución esperada en la plantilla es:

| Municipio | Servicios esperados |
| --- | ---: |
| Jalpan de Serra | 3 |
| Arroyo Seco | 3 |
| Landa de Matamoros | 3 |
| Pinal de Amoles | 2 |
| Peñamiller | 2 |
| San Joaquín | 2 |
| **Total** | **15** |

Las fichas entregadas contienen esta distribución:

| Municipio | Servicios en fichas |
| --- | ---: |
| Jalpan de Serra | 5 |
| Arroyo Seco | 3 |
| Landa de Matamoros | 2 |
| Pinal de Amoles | 0 |
| Peñamiller | 3 |
| San Joaquín | 3 |
| **Total** | **16** |

Esta diferencia queda pendiente de decisión editorial. Algunos registros
describen colectivos o categorías de negocios, no una empresa individual, y
requieren confirmación antes de aprobarse.

## Imágenes recuperadas

Los 11 documentos usados contienen 36 imágenes válidas: una por registro. Las
imágenes fueron incrustadas con extensión `.undefined` y sin tipo MIME en el
paquete OOXML, por lo que `python-docx` y otros lectores estrictos no pueden
abrir esos archivos. `scripts/extract_fichas.py` lee el OOXML directamente,
valida la firma JPEG y genera:

- `content/fichas/catalogo_extraido.json`
- `content/fichas/media/lugares/*.jpg`
- `content/fichas/media/servicios/*.jpg`

La versión V3 de las fichas de Jalpan sustituye V2 porque incluye cuatro lugares.
Varias fotografías muestran marcas de agua o procedencia no documentada. Por
eso sus derechos se consideran no verificados y no deben pasar al bucket público.

La auditoría visual completa quedó registrada en
`content/fichas/multimedia_auditoria.json`. No hay duplicados binarios. Dos
archivos muestran marcas comerciales de Alamy o Dreamstime y tres no representan
el lugar o servicio asignado; esos cinco quedaron bloqueados en el cargador. Las
31 imágenes restantes sólo son candidatas al bucket privado de revisión: ninguna
tiene derechos de publicación acreditados todavía.

## Criterio para publicar

Un lugar o servicio sólo puede pasar a `aprobado` cuando tenga información real,
fuente verificable, ubicación suficiente para el mapa y multimedia autorizada.
Los archivos de prestadores entran primero al bucket privado
`xplorasg-review`; sólo un administrador puede mover contenido aprobado a
`xplorasg-public`.

## Estado técnico aplicado

El 2 de octubre de 2026 se aplicaron y verificaron en Supabase:

- `007_content_fichas_fields.sql`
- `003_content_from_fichas.sql`

El proyecto remoto contiene 20 lugares, 16 servicios y 16 prestadores en
`borrador`, con 0 recursos multimedia publicados o registrados. Los dos buckets
previstos permanecen configurados. La API pública responde correctamente y no
expone los borradores.

El 3 de octubre de 2026 se aplicó `008_content_review_fields.sql`. La ruta
protegida `/admin/contenido` permite mover registros a revisión o rechazo,
conserva motivo, responsable y fecha, y bloquea la aprobación mientras falten
coordenadas o multimedia pública autorizada. La prueba local confirmó 20
lugares visibles para administración, la transición
`borrador → en_revision → borrador` y una respuesta `409` al intentar aprobar
un registro incompleto.

La carga multimedia está preparada mediante
`backend/scripts/uploadFichasMedia.js`. Se ejecuta primero en simulación y sólo
puede aplicarse cuando `SUPABASE_SERVICE_ROLE_KEY` esté configurada. Su destino
es siempre el bucket privado `xplorasg-review`.

`009_place_coordinate_provenance.sql` impide que una coordenada aproximada se
confunda con una validada. `004_verified_coordinates.sql` incorpora las cinco
misiones verificadas y actualiza horario, tarifa y fuente de Ranas con su ficha
oficial del INAH, cuya última actualización indicada es del 12 de enero de 2026.
