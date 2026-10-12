# Sistema de diseño XploraSG

Basado en la hoja de marca oficial (`Iconografia.pdf`, `png Logo.pdf`). Objetivo: moderno, sofisticado, limpio y profesional.

## Marca
- **Logo**: sólo las imágenes oficiales en `frontend/public/brand/` mediante `<BrandLogo />` (`src/components/brand/BrandLogo.tsx`): `variant="horizontal" | "stacked" | "mark"`, `tone="dark"` (fondos claros) o `"light"` (fondos oscuros). Nunca redibujar el logo ni usar el texto "XploraSG" como logotipo.
- **Eslogan**: "Explora. Conecta. Vive la Sierra Gorda." (`common.slogan`). Tagline del logo: "Turismo inteligente".
- **Paleta (estricta)**: `brand-blue #0D2B45` (texto, superficies oscuras), `brand-green #2E7D4E` (acción principal / naturaleza), `brand-teal #1FA7A5` (acentos, ubicación, info), `brand-gold #C49A4E` (destacados, cultura, detalles finos como la línea del eyebrow), `brand-light #F2EDE1` (fondo). Blanco para tarjetas. Rojo/ámbar sólo para estados de error/aviso. Prohibido: emerald, stone, lime, gray-*, slate-*, colores fuera de paleta.
- **Tipografía**: Poppins. Titulares `font-bold` (700) con `tracking-tight`; texto `font-normal`; etiquetas `font-medium`/`font-semibold`. Evitar `font-black` (900): se ve pesado y no es parte de la marca.
- **Iconografía**: línea fina redondeada (`src/components/brand/icons.tsx`): NatureIcon, CultureIcon, AdventureIcon, RouteIcon, ExperienceIcon, CommunityIcon, LodgingIcon, FoodIcon, MissionIcon, MapIcon, CalendarIcon, CompassIcon, PinIcon, SearchIcon, ArrowRightIcon, CloseIcon, HeartIcon, ShieldIcon, WifiOffIcon, SparkleIcon, BirdMark (asistente). `categoryVisual(categoria)` → `{ Icon, tone, bg, solid }` para cada categoría. No usar emojis como iconos de interfaz.
- **Ilustración**: `<SierraLandscape />` (sierra en capas + ruta con nodos + misión + agaves). Usar como cierre de secciones/hero, con moderación.

## Utilidades (src/index.css)
- `surface` tarjeta blanca (radio 24px, borde 1px, sombra suave) · `bento` similar · `lift` hover que eleva.
- `btn` + `btn-primary` (azul → verde al hover) · `btn-accent` (verde) · `btn-secondary` (blanco con borde) · `btn-ghost`.
- `chip` etiqueta suave · `eyebrow` (mayúsculas verdes con línea dorada) · `section-title` (titular de sección fluido) · `field` (inputs) · `bg-topo` (curvas de nivel sutiles para fondos).
- `img-zoom` dentro de un `.group` para zoom suave de fotos.

## Principios de layout
- Contenedor `mx-auto max-w-7xl px-5 lg:px-8`; secciones `py-16 lg:py-24`.
- Encabezado de página: eyebrow → título (`section-title` o `text-4xl sm:text-5xl font-bold tracking-tight`) → párrafo `text-brand-blue/65 leading-7 max-w-2xl`.
- Radios: tarjetas 24px (`rounded-3xl`), controles `rounded-full` o `rounded-2xl`.
- Sombras: `shadow-soft` reposo, `shadow-lift` hover. Sin bordes gruesos.
- Jerarquía con tamaño y peso, no con color. Texto secundario `text-brand-blue/60–70`.
- Microinteracciones: `transition-all duration-300`, hover `-translate-y-1`. Respetar `prefers-reduced-motion` (ya global).
- Móvil primero: hay barra inferior de 64px y el botón flotante del asistente abajo a la derecha (`bottom: 5.5rem` en móvil, `1.5rem` en escritorio): no poner acciones fijas en esa esquina.

## Gráficas (panel admin)
- Forma antes que color: KPI → tarjetas con número grande; distribuciones → barras horizontales de un solo tono (sequential, `brand-green`); metas → medidor (track del mismo tono + marca de meta).
- Categórico (máx. 3 series): `#2E7D4E, #C49A4E, #1FA7A5` (validado CVD; requiere etiquetas visibles porque dorado y teal tienen contraste < 3:1).
- Barras delgadas con extremos redondeados de 4px, separación 2px, etiquetas de valor en tinta de texto (no en el color de la serie), cuadrícula muy tenue, tooltip al pasar el cursor y una tabla accesible (`<details>` "Ver tabla").

## v3 · Editorial natural (vigente)
Referencia: plataformas de turismo premium y composición editorial tipo Pinterest. Debe parecer el sitio de una empresa turística real, no una plantilla.
- **Paleta** (tokens en `src/index.css`, mismos nombres de clase): tinta/bosque profundo `brand-blue #1F2C24`, verde bosque `brand-green #2F5D3E`, salvia `brand-teal #6E8B6F`, terracota `brand-gold #9E552F` (sólo detalles; cumple AA como texto), crema `brand-light #F3EDE2`, beige `brand-sand #E6DCCB`, blanco cálido `brand-paper #FAF7F1` (fondo general), blanco para tarjetas.
- **Estados**: arcilla `clay-*` (errores, acciones destructivas) y ocre `ochre-*` (avisos, sin conexión). Nunca `red-*`/`amber-*` de Tailwind. Texto: `clay-800`/`ochre-900` sobre su tono 50.
- **Texto secundario**: mínimo `text-brand-blue/70` (AA sobre papel y crema); cuerpo `/75` o más. Utilidades `meta` (municipio, pies de foto) y `label-quiet` (rótulos de campos y datos), en minúsculas naturales.
- **Mayúsculas espaciadas**: sólo en el eyebrow (uno por sección como máximo, sin repetir lo que ya dice el encabezado), encabezados del pie, tablas y bloques de fecha de la Agenda.
- **Movimiento**: un fundido de entrada (450 ms) en el titular y la foto del encabezado; sin cascadas en listas. Se conserva el movimiento que comunica estado (mensajes del chat, hoja del asistente, carga).
- **Tipografía**: titulares en serif **Fraunces** (`font-display`/`font-serif`, peso 400–500, nunca negritas pesadas; cursiva para una palabra de énfasis), interfaz y textos en **Poppins** 400/500. Eyebrow: mayúsculas pequeñas terracota con línea de 1px.
- **Composición**: mucho espacio en blanco (secciones `py-20 lg:py-28`), retícula editorial asimétrica (12 columnas), fotos grandes, mosaicos tipo Pinterest (columnas de alturas distintas), texto en columnas estrechas, separadores de 1px `brand-sand`.
- **Tarjetas limpias**: foto + texto debajo, radio pequeño (`rounded-xl`/`rounded-2xl`), sin sombras o casi imperceptibles, borde 1px sólo si hace falta.
- **Botones**: rectángulos redondeados o píldoras sobrias, verde bosque o tinta, secundario con borde fino; enlaces de texto subrayados con flecha.
- **Prohibido**: degradados decorativos (sólo un velo oscuro sutil y uniforme sobre fotos cuando el texto va encima), glassmorphism/backdrop-blur, tarjetas flotantes encimadas, colores saturados (teal/azul brillante), ilustraciones genéricas, emojis, palabras gigantes translúcidas, animaciones llamativas.
- **Fotografías**: sólo las del proyecto (vienen de la API: `imagenPrincipal`, `multimedia`, `lugar_imagen`; foto del equipo en `/equipo`). Se pueden recortar (`object-cover`, distintas proporciones) pero no sustituir. Sin foto: bloque crema/beige con el nombre en serif, nunca un dibujo genérico.
- **Logo**: `<BrandLogo />` oficial. Mascota guacamaya sólo como ícono discreto del asistente.
- **Chatboot** (asistente): único nombre en todo el sitio. Ícono `BirdMark` (guacamaya a una línea, 1.5 px). Voz manos libres opcional con la Web Speech API (`useVoice`: dictado + lectura en voz alta); si el navegador no la soporta, los botones no aparecen.
- **Clima de montaña** (`WeatherCard`): temperatura en serif, sensación térmica, viento, humedad e índice UV (escala OMS) y la posición del lugar (latitud, longitud y altitud en m.s.n.m.; la altitud sale de la ficha o del modelo de elevación de Open-Meteo).
- **Guías descargables** (`public/guias`): se generan con `scripts/guias` a partir de las fichas aprobadas; nunca con datos inventados.
