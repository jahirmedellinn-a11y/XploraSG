#!/usr/bin/env node

const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const main = async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');
  const host = new URL(process.env.DATABASE_URL).hostname;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: !['db', 'localhost', '127.0.0.1'].includes(host) ? { rejectUnauthorized: false } : false,
  });

  try {
    const [coordinateSummary, locations, ranas, editorial, media, users] = await Promise.all([
      pool.query(`
        SELECT estado_coordenadas, COUNT(*)::INT AS total
        FROM public.lugares_turisticos
        WHERE deleted_at IS NULL
        GROUP BY estado_coordenadas
        ORDER BY estado_coordenadas`),
      pool.query(`
        SELECT slug, latitud, longitud, estado_coordenadas
        FROM public.lugares_turisticos
        WHERE estado_coordenadas != 'pendiente'
        ORDER BY slug`),
      pool.query(`
        SELECT horarios, costo, estado_aprobacion
        FROM public.lugares_turisticos
        WHERE slug = 'ranas'`),
      pool.query(`
        SELECT 'lugares' AS tipo, estado_aprobacion, COUNT(*)::INT AS total
        FROM public.lugares_turisticos WHERE deleted_at IS NULL GROUP BY estado_aprobacion
        UNION ALL
        SELECT 'servicios' AS tipo, estado_aprobacion, COUNT(*)::INT AS total
        FROM public.servicios WHERE deleted_at IS NULL GROUP BY estado_aprobacion
        ORDER BY tipo, estado_aprobacion`),
      pool.query(`SELECT COUNT(*)::INT AS total FROM public.multimedia WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*)::INT AS total FROM public.usuarios WHERE deleted_at IS NULL`),
    ]);

    console.log(JSON.stringify({
      coordenadas: coordinateSummary.rows,
      ubicacionesConDatos: locations.rows,
      ranas: ranas.rows[0] || null,
      editorial: editorial.rows,
      multimedia: media.rows[0]?.total ?? 0,
      usuariosAplicacion: users.rows[0]?.total ?? 0,
    }, null, 2));
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
