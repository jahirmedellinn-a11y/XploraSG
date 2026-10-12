# Estructura del Proyecto XploraSG

Guía rápida de organización de carpetas y archivos para encontrar todo fácilmente.

---

## 🚀 Inicio Rápido
- **[`iniciar_proyecto.bat`](./iniciar_proyecto.bat)**: Doble clic para arrancar automáticamente el backend, el frontend y abrir la web en tu navegador (`http://localhost:5173`).

---

## 📁 Carpetas Principales

### 💻 Desarrollo y Código Fuente
- **[`frontend/`](./frontend/)**: Aplicación web del usuario (React, Vite, TypeScript, Tailwind CSS).
- **[`backend/`](./backend/)**: Servidor API REST (Node.js, Express, TypeScript, conexión a base de datos).
- **[`database/`](./database/)**: Scripts de la base de datos PostgreSQL/Supabase (migraciones en `migrations/` y datos iniciales en `seeds/`).
- **[`scripts/`](./scripts/)**: Herramientas de automatización (procesamiento de fichas, auditoría de imágenes y catálogos).

### 📑 Documentación y Entregables
- **[`documentos_proyecto/`](./documentos_proyecto/)**:
  - `Bitacora_Nuevos_Talentos_Actualizada.xlsx`: Bitácora de trabajo y avances.
  - `Exposicion Inicial.pdf`: Presentación inicial del proyecto.
  - `IDEA DE PROYECTO1.pdf` y `proyecto de turismo.pdf`: Justificación y propuesta conceptual.
  - `XploraSG_Interfaces_v3.pdf`: Mockups y diseño de pantallas.
  - `Logo XploraSG.pdf`, `Logo expandido.pdf`, `Iconografia.pdf`: Identidad gráfica y logotipos.
- **[`docs/`](./docs/)**: Documentación técnica de desarrollo (arquitectura, autenticación, base de datos, PWA, etc.).

### 🌄 Contenido y Fichas Informativas
- **[`content/fichas_docx/`](./content/fichas_docx/)**: Documentos originales en Word (`.docx`) con las fichas de lugares turísticos y servicios recopilados por municipio.
- **[`content/fichas/`](./content/fichas/)**: Datos estructurados extraídos de las fichas en formato JSON (`catalogo_extraido.json`, multimedia y coordenadas).

### 🎨 Recursos Multimedia
- **[`recursos/videos/`](./recursos/videos/)**: Grabaciones y demostraciones de video (`Interfacez app.mp4`).
- **[`recursos/imagenes/`](./recursos/imagenes/)**: Fotografías organizadas por municipio (Arroyo Seco, Jalpan, Landa, Peñamiller, Pinal de Amoles, San Joaquín).
- **[`recursos/imagenes_referencia/`](./recursos/imagenes_referencia/)**: Fotografías e imágenes de referencia adicionales.
- **[`recursos/graficas/`](./recursos/graficas/)**: Paquete de gráficos e infografías.

### 📦 Archivo Histórico y Respaldos
- **[`entregas_y_respaldos/`](./entregas_y_respaldos/)**: Paquetes comprimidos de entregas anteriores (`_entregas`), salidas generadas (`Claude outputs`) y respaldos de seguridad.
