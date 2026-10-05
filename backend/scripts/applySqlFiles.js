#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const projectRoot = path.resolve(__dirname, '..', '..');
const databaseRoot = path.join(projectRoot, 'database');

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const resolveSqlFile = (input) => {
  const target = path.resolve(projectRoot, input);
  const relative = path.relative(databaseRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative) || path.extname(target) !== '.sql') {
    throw new Error(`Sólo se admiten archivos .sql dentro de database/: ${input}`);
  }
  if (!fs.existsSync(target)) throw new Error(`Archivo no encontrado: ${input}`);
  return target;
};

const main = async () => {
  const inputs = process.argv.slice(2);
  if (!inputs.length) {
    throw new Error('Indica al menos un archivo SQL, por ejemplo database/migrations/009_place_coordinate_provenance.sql');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');

  const files = inputs.map(resolveSqlFile);
  const host = new URL(process.env.DATABASE_URL).hostname;
  const useSsl = !['db', 'localhost', '127.0.0.1'].includes(host);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const file of files) {
      await client.query(fs.readFileSync(file, 'utf8'));
      console.log(`Aplicado: ${path.relative(projectRoot, file)}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
