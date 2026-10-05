import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

// En ejecución local se admite .env dentro de backend o en la raíz del proyecto.
// En Docker las variables llegan mediante env_file y no se necesita copiar .env.
const envPath = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../../.env'),
].find(existsSync);

if (envPath) {
  dotenv.config({ path: envPath, quiet: true });
}

