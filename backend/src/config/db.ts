import './env';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está configurada.');
}

// Detectar si la conexión es remota (ej. Supabase) para activar SSL requerido por la nube
const isRemote = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('db:5432') &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS current_time');
    client.release();
    return result.rows[0].current_time;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

export default pool;
