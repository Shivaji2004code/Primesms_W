import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

export const pool = new Pool({
  connectionString: url,
  // ssl: { rejectUnauthorized: false }, // enable if your DB enforces SSL
});

// One-time startup probe with retries
async function probe() {
  const parsed = new URL(url!);
  const safeHost = parsed.hostname;
  const safePort = parsed.port || '5432';

  let attempt = 0;
  while (attempt < 5) {
    try {
      await pool.query('SELECT 1');
      console.log(`[DB] Connected. host=${safeHost} port=${safePort}`);
      return;
    } catch (e) {
      attempt++;
      const wait = 500 * 2 ** (attempt - 1);
      console.warn(`[DB] Connection attempt ${attempt} failed. Retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  console.error('[DB] Failed to connect after 5 attempts. Exiting.');
  process.exit(1);
}

probe().catch(err => {
  console.error('[DB] Startup probe error:', err);
  process.exit(1);
});