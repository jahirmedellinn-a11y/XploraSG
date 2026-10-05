#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(projectRoot, 'content', 'fichas', 'catalogo_extraido.json');
const outputPath = path.join(projectRoot, 'content', 'fichas', 'multimedia_auditoria.json');

const visualFindings = {
  'content/fichas/media/lugares/mision-de-san-miguel-conca.jpg': {
    decision: 'no_cargar',
    alerta: 'marca_de_agua',
    nota: 'Marca comercial visible de Alamy y múltiples sellos superpuestos.',
  },
  'content/fichas/media/lugares/mision-de-tilaco.jpg': {
    decision: 'no_cargar',
    alerta: 'marca_de_agua',
    nota: 'Marca comercial visible de Dreamstime sobre toda la imagen.',
  },
  'content/fichas/media/lugares/vestigios-prehistoricos.jpg': {
    decision: 'no_cargar',
    alerta: 'contenido_no_corresponde',
    nota: 'La imagen muestra una vista urbana y no vestigios ni pinturas rupestres de Peñamiller.',
  },
  'content/fichas/media/servicios/renta-y-tours-en-cuatrimoto-san-joaquin-ecotours.jpg': {
    decision: 'no_cargar',
    alerta: 'contenido_no_corresponde',
    nota: 'La imagen muestra cabañas y no el servicio de renta o recorrido en cuatrimoto.',
  },
  'content/fichas/media/servicios/restaurantes-tradicionales-y-fondas-penamiller.jpg': {
    decision: 'no_cargar',
    alerta: 'contenido_no_corresponde',
    nota: 'La imagen muestra una calle y no identifica un restaurante, fonda o platillo.',
  },
  'content/fichas/media/lugares/rio-verdito.jpg': {
    decision: 'revision_privada',
    alerta: 'calidad_baja',
    nota: 'Imagen comprimida con franjas negras; parece un fotograma y requiere reemplazo preferente.',
  },
  'content/fichas/media/servicios/restaurante-coral.jpg': {
    decision: 'revision_privada',
    alerta: 'imagen_generica',
    nota: 'Fotografía genérica de pizza; el prestador debe confirmar autoría y correspondencia.',
  },
  'content/fichas/media/servicios/pollos-brandon-comedores-de-landa.jpg': {
    decision: 'revision_privada',
    alerta: 'composicion_promocional',
    nota: 'Composición promocional con ilustración; requiere el archivo original y autorización del prestador.',
  },
  'content/fichas/media/servicios/sierra-gorda-ecotours-operadora-de-grupo-ecologico-sierra-gorda.jpg': {
    decision: 'revision_privada',
    alerta: 'composicion_promocional',
    nota: 'Collage con texto promocional; requiere confirmación de autoría del prestador.',
  },
};

const jpegSize = (buffer) => {
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  return { width: null, height: null };
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const records = [...catalog.lugares, ...catalog.servicios];
const items = records.map((record) => {
  const relativePath = record.imagen.archivo.replaceAll('\\', '/');
  const absolutePath = path.join(projectRoot, relativePath);
  const buffer = fs.readFileSync(absolutePath);
  const finding = visualFindings[relativePath] || {
    decision: 'revision_privada',
    alerta: 'sin_marca_visible',
    nota: 'No se observó marca de agua, pero la ficha no acredita autoría ni licencia de publicación.',
  };
  return {
    tipo: record.tipo,
    slug: record.slug,
    nombre: record.nombre,
    archivo: relativePath,
    mime_type: 'image/jpeg',
    bytes: buffer.byteLength,
    ...jpegSize(buffer),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    derechos: 'no_verificados',
    ...finding,
  };
});

const hashes = new Map();
for (const item of items) hashes.set(item.sha256, (hashes.get(item.sha256) || 0) + 1);
const duplicateGroups = [...hashes.values()].filter((count) => count > 1).length;
const summary = {
  total: items.length,
  derechos_verificados: items.filter((item) => item.derechos === 'verificados').length,
  revision_privada: items.filter((item) => item.decision === 'revision_privada').length,
  no_cargar: items.filter((item) => item.decision === 'no_cargar').length,
  marcas_de_agua: items.filter((item) => item.alerta === 'marca_de_agua').length,
  contenido_no_corresponde: items.filter((item) => item.alerta === 'contenido_no_corresponde').length,
  grupos_duplicados_exactos: duplicateGroups,
};

fs.writeFileSync(outputPath, `${JSON.stringify({
  generado_el: '2026-10-03',
  criterio: 'La ausencia de una marca visible no demuestra autorización. Ningún archivo puede publicarse hasta documentar autoría o licencia.',
  resumen: summary,
  archivos: items,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary));
