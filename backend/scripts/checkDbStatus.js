const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

async function check() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set in .env');
    return;
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'traducciones';
    `);
    console.log('--- COLUMNAS ENCONTRADAS CON "traducciones" ---');
    console.log(res.rows);

    const countRes = await pool.query(`
      SELECT slug, (traducciones->'en'->>'descripcion') IS NOT NULL as tiene_ingles 
      FROM lugares_turisticos LIMIT 5;
    `);
    console.log('--- MUESTRA DE LUGARES TURISTICOS CON INGLÉS ---');
    console.log(countRes.rows);
  } catch (err) {
    console.error('Error conectando o consultando la BD:', err.message);
  } finally {
    await pool.end();
  }
}

check();
