// server/src/db/index.ts
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const pool = new Pool({
  connectionString: url,
  // Add SSL only if your DB requires it:
  // ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await pool.query('SELECT 1');
    const { hostname, port } = new URL(url);
    console.log(`[DB] Connected. host=${hostname} port=${port || '5432'}`);
  } catch (err) {
    console.error('[DB] Startup probe failed:', err);
    process.exit(1);
  }
})();

export default pool;
export { pool };