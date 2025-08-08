// server/src/db/index.ts
import { Pool } from 'pg';
import { env } from '../utils/env';

const pool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.database,
  user: env.database.user,
  password: env.database.password,
  // Add SSL only if your DB requires it:
  // ssl: { rejectUnauthorized: false },
});

export default pool;
export { pool };