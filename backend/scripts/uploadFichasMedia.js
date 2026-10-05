/* eslint-disable no-console */
const fs = require('node:fs/promises');
const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const projectRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const apply = process.argv.includes('--apply');
const catalogPath = path.join(projectRoot, 'content', 'fichas', 'catalogo_extraido.json');
const auditPath = path.join(projectRoot, 'content', 'fichas', 'multimedia_auditoria.json');
const bucket = 'xplorasg-review';

const requireSetting = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta ${name} en .env.`);
  return value;
};

const uploadObject = async (baseUrl, serviceRoleKey, objectPath, payload) => {
  const safePath = objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${safePath}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: payload,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Storage rechazó ${objectPath} (${response.status}): ${detail.slice(0, 300)}`);
  }
};

const linkMedia = async (client, record, objectPath, sizeBytes) => {
  const sourceFile = record.fuente.archivo;
  const media = await client.query(
    `INSERT INTO public.multimedia (
       tipo, url, bucket_id, object_path, mime_type, size_bytes,
       alt_text, titulo, descripcion
     ) VALUES (
       'image', NULL, $1, $2, 'image/jpeg', $3, $4, $4, $5
     )
     ON CONFLICT (bucket_id, object_path)
       WHERE bucket_id IS NOT NULL AND object_path IS NOT NULL
     DO UPDATE SET
       mime_type = EXCLUDED.mime_type,
       size_bytes = EXCLUDED.size_bytes,
       alt_text = EXCLUDED.alt_text,
       titulo = EXCLUDED.titulo,
       descripcion = EXCLUDED.descripcion,
       updated_at = CURRENT_TIMESTAMP,
       deleted_at = NULL
     RETURNING id`,
    [
      bucket,
      objectPath,
      sizeBytes,
      record.nombre,
      `Importada desde ${sourceFile}. Derechos y publicación pendientes de validación.`,
    ],
  );

  const mediaId = media.rows[0].id;
  const targetTable = record.tipo === 'lugar' ? 'lugares_turisticos' : 'servicios';
  const linkTable = record.tipo === 'lugar' ? 'lugar_multimedia' : 'servicio_multimedia';
  const targetColumn = record.tipo === 'lugar' ? 'lugar_id' : 'servicio_id';
  const target = await client.query(
    `SELECT id FROM public.${targetTable} WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`,
    [record.slug],
  );
  if (!target.rows[0]) throw new Error(`No se encontró ${record.tipo} con slug ${record.slug}.`);

  await client.query(
    `INSERT INTO public.${linkTable} (${targetColumn}, multimedia_id, orden, es_principal)
     VALUES ($1, $2, 0, TRUE)
     ON CONFLICT (${targetColumn}, multimedia_id) DO UPDATE SET
       orden = EXCLUDED.orden,
       es_principal = EXCLUDED.es_principal`,
    [target.rows[0].id, mediaId],
  );
};

const main = async () => {
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
  const records = [...catalog.lugares, ...catalog.servicios];
  const audit = JSON.parse(await fs.readFile(auditPath, 'utf8'));
  const decisions = new Map(audit.archivos.map((item) => [item.archivo, item]));
  const excluded = records.filter((record) => decisions.get(record.imagen.archivo)?.decision === 'no_cargar');
  const uploadable = records.filter((record) => decisions.get(record.imagen.archivo)?.decision !== 'no_cargar');
  console.log(`${uploadable.length} imágenes aptas para revisión privada en ${bucket}; ${excluded.length} bloqueadas por la auditoría visual.`);
  if (excluded.length) console.log(`Bloqueadas: ${excluded.map((record) => record.slug).join(', ')}`);

  if (!apply) {
    console.log('Simulación completada. Usa --apply para cargar y asociar las imágenes.');
    return;
  }

  const baseUrl = requireSetting('SUPABASE_URL').replace(/\/$/, '');
  const serviceRoleKey = requireSetting('SUPABASE_SERVICE_ROLE_KEY');
  const databaseUrl = requireSetting('DATABASE_URL');
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    for (const record of uploadable) {
      const absolutePath = path.join(projectRoot, record.imagen.archivo);
      const payload = await fs.readFile(absolutePath);
      const group = record.tipo === 'lugar' ? 'lugares' : 'servicios';
      const objectPath = `imports/fichas/${group}/${record.slug}.jpg`;
      await uploadObject(baseUrl, serviceRoleKey, objectPath, payload);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await linkMedia(client, record, objectPath, payload.byteLength);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      console.log(`Cargada: ${objectPath}`);
    }
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
